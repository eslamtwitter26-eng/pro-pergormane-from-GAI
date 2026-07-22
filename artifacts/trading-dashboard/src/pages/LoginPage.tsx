import { useState, useRef } from "react";
import { Mail, Lock, AlertCircle, Loader2, ChevronRight, TrendingUp } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.08) 0%, transparent 50%), #05070F" }}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/5 h-72 w-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-1/4 right-1/5 h-60 w-60 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />

      {/* Login card */}
      <div className="relative w-full max-w-md animate-slide-up"
        style={{
          background: "rgba(8, 11, 28, 0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "20px",
          boxShadow: "0 0 60px rgba(139,92,246,0.12), 0 24px 80px rgba(0,0,0,0.6)",
        }}>

        {/* Top accent bar */}
        <div className="h-0.5 w-full rounded-t-[20px]"
          style={{ background: "linear-gradient(90deg, transparent, #8B5CF6, #06B6D4, transparent)" }} />

        <div className="p-8">
          {/* Logo + branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)", boxShadow: "0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2)" }}>
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full"
                style={{ background: "#10F087", boxShadow: "0 0 8px rgba(16,240,135,0.8)", animation: "pulse 2s infinite" }} />
            </div>
            <h1 className="text-center font-black text-xl leading-tight"
              style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #10F087 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Welcome – EG-Finance<br />Fx Pro Analyser
            </h1>
            <p className="mt-2 text-sm text-center" style={{ color: "rgba(150,160,200,0.7)" }}>
              Secure access for registered students
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "rgba(139,92,246,0.2)" }} />
            <Lock className="h-3.5 w-3.5" style={{ color: "rgba(150,160,200,0.4)" }} />
            <div className="flex-1 h-px" style={{ background: "rgba(139,92,246,0.2)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "rgba(150,160,200,0.6)" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: email ? "#8B5CF6" : "rgba(150,160,200,0.4)", transition: "color 0.2s" }} />
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={status === "loading"}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
                  style={{
                    background: "rgba(15, 20, 45, 0.8)",
                    border: `1px solid ${status === "error" ? "rgba(255,71,87,0.5)" : email ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.15)"}`,
                    color: "rgba(220, 225, 245, 0.95)",
                    boxShadow: email ? "0 0 20px rgba(139,92,246,0.1)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Error message */}
            {(status === "error" || status === "network-error") && errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 animate-fade-in"
                style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.25)" }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#FF4757" }} />
                <p className="text-sm" style={{ color: "#FF4757" }}>{errorMsg}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: status === "loading" || !email.trim()
                  ? "rgba(139,92,246,0.3)"
                  : "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                color: "white",
                boxShadow: !email.trim() || status === "loading" ? "none" : "0 0 30px rgba(139,92,246,0.4)",
                cursor: status === "loading" || !email.trim() ? "not-allowed" : "pointer",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => { if (status !== "loading" && email.trim()) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              {status === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying access...</>
              ) : (
                <>Access Dashboard <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-[11px]" style={{ color: "rgba(150,160,200,0.35)" }}>
            Access is verified in real-time against the authorized student list.
          </p>
        </div>

        {/* Bottom glow */}
        <div className="absolute -bottom-px left-1/2 -translate-x-1/2 h-px w-2/3"
          style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)" }} />
      </div>
    </div>
  );
}
