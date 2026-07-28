import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { Mail, AlertCircle, Loader2, ChevronRight, TrendingUp } from "lucide-react";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTXv9PB3EtBUtXpbL7PFkpRmg8URXsJEdG3S5aZFOBV8ni7QavAWZ-j3q5pLj478mcxgMzK-aW6t04i/pub?output=csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchAuthorizedEmails(): Promise<Set<string>> {
  const bust = `&t=${Date.now()}&r=${Math.random()}`;
  const res = await fetch(`${CSV_URL}${bust}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache" },
  });
  if (!res.ok) throw new Error("Failed to fetch access list.");
  const text = await res.text();
  const lines = text.split("\n").map(l => l.replace(/\r$/, ""));

  // Find the header row that contains "email" (handles blank rows at top)
  let emailColIndex = -1;
  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const emailIdx = cols.findIndex(c => c.toLowerCase().trim() === "email");
    if (emailIdx !== -1) {
      emailColIndex = emailIdx;
      dataStartIndex = i + 1;
      break;
    }
  }

  // Fallback: if no header found, scan every cell for email-like values
  const emails = new Set<string>();
  if (emailColIndex === -1) {
    for (const line of lines) {
      const cols = parseCSVLine(line);
      for (const col of cols) {
        const v = col.toLowerCase().trim();
        if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) emails.add(v);
      }
    }
    return emails;
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCSVLine(lines[i]);
    if (cols.length > emailColIndex) {
      const email = cols[emailColIndex].toLowerCase().trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) emails.add(email);
    }
  }
  return emails;
}

interface LoginPageProps {
  onAccessGranted: () => void;
}

export function LoginPage({ onAccessGranted }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "network-error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!isValidEmail(trimmed)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const authorized = await fetchAuthorizedEmails();
      if (authorized.has(trimmed)) {
        sessionStorage.setItem("egfx_auth", trimmed);
        onAccessGranted();
      } else {
        setStatus("error");
        setErrorMsg("Email not authorized. Please contact support.");
      }
    } catch {
      setStatus("network-error");
      setErrorMsg("Unable to verify access. Please check your connection and try again.");
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
      style={{ background: "#0B0F17" }}
    >
      {/* A single, barely-there vignette. No orbs, no grid, no glow. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.05) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[20px]"
        style={{
          background: "#141A24",
          border: "1px solid var(--hairline)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div className="p-9">
          {/* Brand */}
          <div className="mb-8 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.08 }}
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: "#3B82F6", boxShadow: "var(--shadow-md)" }}
            >
              <TrendingUp className="h-6 w-6 text-white" strokeWidth={2} />
            </motion.div>
            <h1 className="text-center text-[20px] font-semibold leading-tight tracking-tight text-white">
              EG-Finance Fx Pro Analyser
            </h1>
            <p className="mt-2 text-center text-[13px] text-[#94A3B8]">
              Secure access for registered students
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[12px] font-medium text-[#94A3B8]">
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                  strokeWidth={1.75}
                  style={{ color: email ? "#3B82F6" : "#64748B", transition: "color 200ms" }}
                />
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={status === "loading"}
                  className="w-full rounded-[12px] py-3 pl-10 pr-4 text-[14px] outline-none"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      status === "error"
                        ? "rgba(239,68,68,0.5)"
                        : email
                        ? "rgba(59,130,246,0.45)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    color: "#FFFFFF",
                    boxShadow: email ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {(status === "error" || status === "network-error") && errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="flex items-start gap-2.5 overflow-hidden rounded-[12px] px-3.5 py-3"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.75} style={{ color: "#EF4444" }} />
                  <p className="text-[13px]" style={{ color: "#EF4444" }}>{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              whileHover={status !== "loading" && email.trim() ? { y: -1 } : undefined}
              whileTap={status !== "loading" && email.trim() ? { y: 0, scale: 0.985 } : undefined}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[14px] font-medium"
              style={{
                background: status === "loading" || !email.trim() ? "rgba(59,130,246,0.28)" : "#3B82F6",
                color: "white",
                boxShadow: !email.trim() || status === "loading" ? "none" : "var(--shadow-md)",
                cursor: status === "loading" || !email.trim() ? "not-allowed" : "pointer",
              }}
            >
              {status === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying access…</>
              ) : (
                <>Access dashboard <ChevronRight className="h-4 w-4" strokeWidth={2} /></>
              )}
            </motion.button>
          </form>

          <p className="mt-7 text-center text-[11.5px] leading-relaxed" style={{ color: "#64748B" }}>
            Access is verified in real time against the authorized student list.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
