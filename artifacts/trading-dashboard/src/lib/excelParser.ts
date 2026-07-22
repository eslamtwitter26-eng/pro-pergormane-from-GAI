import * as XLSX from "xlsx";
import type { Trade, EquityPoint } from "./tradeAnalysis";

function parseMTDate(val: unknown): Date | null {
  if (val == null) return null;
  if (val instanceof Date) return val;
  
  const str = String(val).trim();
  if (!str) return null;

  // MetaTrader format: "2025.11.14 03:42:08"
  const mt = str.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (mt) {
    return new Date(Date.UTC(
      parseInt(mt[1]), parseInt(mt[2]) - 1, parseInt(mt[3]),
      parseInt(mt[4]), parseInt(mt[5]), parseInt(mt[6])
    ));
  }

  // ISO-like: "2025-11-14 03:42:08" or "2025/11/14 03:42:08"
  const iso = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (iso) {
    return new Date(Date.UTC(
      parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]),
      parseInt(iso[4]), parseInt(iso[5]), parseInt(iso[6])
    ));
  }

  // Excel serial date number
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, d.S));
  }

  // Fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function parseNum(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    // Handle "0.01 / 0.01" format (volume in Orders section)
    const parts = val.split("/");
    const n = parseFloat((parts[0] || val).replace(/,/g, "").trim());
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseStr(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

function isSectionHeader(row: unknown[]): boolean {
  const first = parseStr(row[0]);
  const looksLikeSection = ["Positions", "Orders", "Deals", "Results", "Summary", "Statistics"].includes(first);
  const restEmpty = row.slice(1).every(c => c == null || String(c).trim() === "");
  return looksLikeSection && restEmpty;
}

function isHeaderRow(row: unknown[]): boolean {
  const str0 = parseStr(row[0]).toLowerCase();
  return str0 === "time" || str0 === "open time";
}

function isDataRow(row: unknown[]): boolean {
  if (!row || row.length === 0) return false;
  const first = row[0];
  if (first == null) return false;
  const str = parseStr(first);
  // Data rows start with a date-like string or number
  if (/^\d{4}[.\-/]\d{2}[.\-/]\d{2}/.test(str)) return true;
  // Could also be a numeric serial date
  if (typeof first === "number" && first > 40000 && first < 50000) return true;
  return false;
}

// Parse the Positions section of a MetaTrader report
// Format per row: OpenTime, PositionID, Symbol, Type, Volume, OpenPrice, SL, TP, CloseTime, ClosePrice, Commission, Swap, Profit
function parsePositionsSection(rows: unknown[][]): Trade[] {
  const trades: Trade[] = [];
  let inPositions = false;
  let headerFound = false;

  // Column index mapping (will be set from header row)
  let colOpenTime = 0;
  let colSymbol = 2;
  let colType = 3;
  let colVolume = 4;
  let colOpenPrice = 5;
  let colCloseTime = 8;
  let colClosePrice = 9;
  let colCommission = 10;
  let colSwap = 11;
  let colProfit = 12;

  for (const row of rows) {
    if (!row || !row.some(c => c != null)) continue;

    const first = parseStr(row[0]).toLowerCase().trim();

    // Detect section headers
    if (first === "positions") {
      inPositions = true;
      headerFound = false;
      continue;
    }

    // If we hit another section after Positions, stop
    if (inPositions && (first === "orders" || first === "deals" || first === "results" || first === "summary" || first === "statistics")) {
      break;
    }

    if (inPositions && !headerFound) {
      // This should be the header row
      if (isHeaderRow(row)) {
        headerFound = true;
        // Remap column indices from header
        for (let i = 0; i < row.length; i++) {
          const h = parseStr(row[i]).toLowerCase().replace(/[\s\/]/g, "");
          if (i === 0) colOpenTime = 0; // first time col = open time
          if (h === "symbol" || h === "instrument") colSymbol = i;
          if (h === "type") colType = i;
          if (h === "volume" || h === "size" || h === "lots") colVolume = i;
          if (h === "price" && i < 7) colOpenPrice = i;
          if (h === "commission" || h === "comm") colCommission = i;
          if (h === "swap") colSwap = i;
          if (h === "profit") colProfit = i;
        }
        // Close time is the second "Time" column (if header has it)
        let timeCount = 0;
        for (let i = 0; i < row.length; i++) {
          const h = parseStr(row[i]).toLowerCase();
          if (h === "time") {
            timeCount++;
            if (timeCount === 2) colCloseTime = i;
          }
        }
        // Close price is the second "Price" column
        let priceCount = 0;
        for (let i = 0; i < row.length; i++) {
          const h = parseStr(row[i]).toLowerCase();
          if (h === "price") {
            priceCount++;
            if (priceCount === 2) colClosePrice = i;
          }
        }
        continue;
      }
    }

    if (inPositions && headerFound && isDataRow(row)) {
      const openTime = parseMTDate(row[colOpenTime]);
      const closeTime = parseMTDate(row[colCloseTime]);
      const symbol = parseStr(row[colSymbol]);
      const typeStr = parseStr(row[colType]).toLowerCase();
      const volume = parseNum(row[colVolume]);
      const openPrice = parseNum(row[colOpenPrice]);
      const closePrice = parseNum(row[colClosePrice]);
      const commission = parseNum(row[colCommission]);
      const swap = parseNum(row[colSwap]);
      const grossProfit = parseNum(row[colProfit]);

      if (!openTime || !symbol || !typeStr) continue;
      if (typeStr !== "buy" && typeStr !== "sell" && typeStr !== "buy stop" && typeStr !== "sell stop" && typeStr !== "buy limit" && typeStr !== "sell limit") continue;

      const direction: "buy" | "sell" = typeStr.includes("sell") ? "sell" : "buy";
      const netProfit = grossProfit + commission + swap;
      const effectiveCloseTime = closeTime || openTime;
      const durationMs = effectiveCloseTime.getTime() - openTime.getTime();

      trades.push({
        openTime,
        closeTime: effectiveCloseTime,
        symbol,
        type: direction,
        volume,
        openPrice,
        closePrice,
        profit: grossProfit,
        commission,
        swap,
        netProfit,
        durationMs,
        durationMinutes: durationMs / 60000,
      });
    }
  }

  return trades.sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
}

// Fallback: try to parse any sheet with trade-like rows
function parseFallback(rows: unknown[][]): Trade[] {
  const trades: Trade[] = [];

  // Find a row that looks like a header
  let headerRow = -1;
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const normalized = row.map(c => parseStr(c).toLowerCase());
    if (normalized.includes("symbol") && normalized.includes("profit")) {
      headerRow = i;
      break;
    }
  }

  if (headerRow === -1) return trades;

  const header = rows[headerRow].map(c => parseStr(c).toLowerCase().replace(/[\s\/]/g, ""));
  const get = (row: unknown[], key: string): unknown => {
    const idx = header.findIndex(h => h === key || h.includes(key));
    return idx >= 0 ? row[idx] : null;
  };

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !isDataRow(row)) continue;

    const symbol = parseStr(get(row, "symbol"));
    const typeStr = parseStr(get(row, "type")).toLowerCase();
    const profit = parseNum(get(row, "profit"));
    const commission = parseNum(get(row, "commission") ?? get(row, "comm"));
    const swap = parseNum(get(row, "swap"));
    const volume = parseNum(get(row, "volume") ?? get(row, "lots") ?? get(row, "size"));
    const openPrice = parseNum(get(row, "price") ?? get(row, "openprice") ?? get(row, "openingprice"));
    
    // Try to get open and close times
    const timeIdx1 = header.findIndex(h => h === "time" || h === "opentime" || h === "datetime");
    const timeIdx2 = header.findIndex((h, i) => i > timeIdx1 && (h === "time" || h === "closetime"));
    
    const openTime = parseMTDate(timeIdx1 >= 0 ? row[timeIdx1] : null);
    const closeTime = parseMTDate(timeIdx2 >= 0 ? row[timeIdx2] : null) || openTime;

    if (!openTime || !symbol || !typeStr.match(/buy|sell/)) continue;

    const direction: "buy" | "sell" = typeStr.includes("sell") ? "sell" : "buy";
    const netProfit = profit + commission + swap;
    const durationMs = (closeTime?.getTime() ?? 0) - openTime.getTime();

    trades.push({
      openTime,
      closeTime: closeTime || openTime,
      symbol,
      type: direction,
      volume,
      openPrice,
      closePrice: 0,
      profit,
      commission,
      swap,
      netProfit,
      durationMs: Math.max(0, durationMs),
      durationMinutes: Math.max(0, durationMs) / 60000,
    });
  }

  return trades.sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());
}

export function buildEquityCurveFromTrades(trades: Trade[], initialBalance = 0): EquityPoint[] {
  const points: EquityPoint[] = [];
  let balance = initialBalance;
  let cumProfit = 0;

  for (const t of trades) {
    cumProfit += t.netProfit;
    balance += t.netProfit;
    points.push({
      time: t.closeTime,
      balance: initialBalance > 0 ? balance : cumProfit,
      profit: cumProfit,
    });
  }

  return points;
}

export async function parseMetaTraderExcel(file: File): Promise<{ trades: Trade[]; equityCurve: EquityPoint[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });

  let trades: Trade[] = [];

  // Try all sheets
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

    if (rows.length === 0) continue;

    // Check if this sheet has a "Positions" section header
    const hasPositions = rows.some(r => r && parseStr(r[0]).toLowerCase() === "positions");
    
    if (hasPositions) {
      trades = parsePositionsSection(rows as unknown[][]);
    } else {
      trades = parseFallback(rows as unknown[][]);
    }

    if (trades.length > 0) break;
  }

  // Try to find initial balance from summary rows
  let initialBalance = 0;
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null }) as unknown[][];
    for (const row of rows) {
      if (!row) continue;
      const first = parseStr(row[0]).toLowerCase();
      if (first.includes("balance") && !first.includes("drawdown") && !first.includes("profit") && !first.includes("net")) {
        const val = parseNum(row[1] ?? row[2] ?? row[3]);
        if (val > 0) { initialBalance = val; break; }
      }
      // "Initial Deposit" or "Deposit"
      if (first.includes("deposit") || first.includes("initial")) {
        const val = parseNum(row[3] ?? row[1]);
        if (val > 100) { initialBalance = val; break; }
      }
    }
    if (initialBalance > 0) break;
  }

  // If we couldn't find initial balance, estimate it:
  // Use max drawdown absolute + first cumulative balance as rough estimate, or just use 5000 as a typical demo account
  if (initialBalance === 0 && trades.length > 0) {
    // Try to find net profit from summary to compute initial balance
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null }) as unknown[][];
      for (const row of rows) {
        if (!row) continue;
        const first = parseStr(row[0]).toLowerCase();
        if (first.includes("total net profit") || first.includes("net profit")) {
          // found summary, but we need initial balance
          // Use a rough estimate: start at 5000 for demo accounts
          break;
        }
      }
    }
    // Default to 5000 for typical demo accounts if unknown
    initialBalance = 5000;
  }

  const equityCurve = buildEquityCurveFromTrades(trades, initialBalance);

  return { trades, equityCurve };
}
