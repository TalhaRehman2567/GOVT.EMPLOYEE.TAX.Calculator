import { useState } from "react"

type TaxSlab = {
  min: number
  max: number
  base: number
  rate: number
  over: number
}

type TaxResult = {
  annual: number
  tax: number
  monthlyTax: number
  effective: number
  netAnnual: number
  netMonthly: number
}

type SlabRow = {
  label: string
  rate: string
  isActive: boolean
}

const TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 600000, base: 0, rate: 0, over: 0 },
  { min: 600000, max: 1200000, base: 0, rate: 0.01, over: 600000 },
  { min: 1200000, max: 2200000, base: 6000, rate: 0.11, over: 1200000 },
  { min: 2200000, max: 3200000, base: 116000, rate: 0.2, over: 2200000 },
  { min: 3200000, max: 4100000, base: 316000, rate: 0.25, over: 3200000 },
  { min: 4100000, max: 5600000, base: 541000, rate: 0.29, over: 4100000 },
  { min: 5600000, max: 7000000, base: 976000, rate: 0.32, over: 5600000 },
  { min: 7000000, max: Infinity, base: 1424000, rate: 0.35, over: 7000000 },
]

const SLAB_LABELS = [
  "Below Rs. 600,000",
  "Rs. 600,000 – Rs. 1,200,000",
  "Rs. 1,200,000 – Rs. 2,200,000",
  "Rs. 2,200,000 – Rs. 3,200,000",
  "Rs. 3,200,000 – Rs. 4,100,000",
  "Rs. 4,100,000 – Rs. 5,600,000",
  "Rs. 5,600,000 – Rs. 7,000,000",
  "Above Rs. 7,000,000",
]

const SLAB_RATE_LABELS = [
  "0%",
  "1% of amount exceeding Rs. 600,000",
  "Rs. 6,000 + 11% of amount exceeding Rs. 1,200,000",
  "Rs. 116,000 + 20% of amount exceeding Rs. 2,200,000",
  "Rs. 316,000 + 25% of amount exceeding Rs. 3,200,000",
  "Rs. 541,000 + 29% of amount exceeding Rs. 4,100,000",
  "Rs. 976,000 + 32% of amount exceeding Rs. 5,600,000",
  "Rs. 1,424,000 + 35% of amount exceeding Rs. 7,000,000",
]

function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`
}

function calculateTax(annualIncome: number): number {
  for (const slab of TAX_SLABS) {
    if (annualIncome <= slab.max) {
      const excess = Math.max(0, annualIncome - slab.over)
      return slab.base + excess * slab.rate
    }
  }

  return 0
}

function getSlabLabel(annualIncome: number): string {
  for (const slab of TAX_SLABS) {
    if (annualIncome <= slab.max) {
      if (slab.min === 0) return "Below Rs. 600,000 - Tax Exempt"
      if (slab.max === Infinity) return "Above Rs. 7,000,000 - 35% slab"
      return `Rs. ${(slab.min / 1000).toFixed(0)}K - Rs. ${(slab.max / 1000).toFixed(0)}K slab`
    }
  }

  return ""
}

export default function TaxCalculator() {
  const [monthly, setMonthly] = useState<string>("")
  const [result, setResult] = useState<TaxResult | null>(null)

  const handleInput = (value: string): void => {
    const clean = value.replace(/[^0-9]/g, "")
    setMonthly(clean)
    setResult(null)
  }

  const calculate = (): void => {
    const monthlyIncome = Number(monthly)

    if (!monthlyIncome || monthlyIncome <= 0) {
      return
    }

    const annual = monthlyIncome * 12
    const tax = calculateTax(annual)
    const monthlyTax = tax / 12
    const effective = annual > 0 ? (tax / annual) * 100 : 0
    const netAnnual = annual - tax
    const netMonthly = netAnnual / 12

    setResult({ annual, tax, monthlyTax, effective, netAnnual, netMonthly })
  }

  const slabRows: SlabRow[] = TAX_SLABS.map((slab, index) => {
    const isActive =
      result !== null && result.annual > slab.min && (slab.max === Infinity ? true : result.annual <= slab.max)

    return {
      label: SLAB_LABELS[index],
      rate: SLAB_RATE_LABELS[index],
      isActive,
    }
  })

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a1628 0%, #0d2144 60%, #0a2e5c 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "24px 16px",
        color: "#e8f0fe",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 40,
            padding: "6px 18px",
            marginBottom: 14,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#7eb8f7",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Federal Budget 2026-27
          </span>
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            margin: "0 0 6px",
            background: "linear-gradient(90deg, #60a5fa, #93c5fd, #bfdbfe)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -0.5,
          }}
        >
          Salary Tax Calculator
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Salaried Individuals · Pakistan Income Tax</p>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(96,165,250,0.25)",
          borderRadius: 20,
          padding: "24px 20px",
          marginBottom: 20,
          backdropFilter: "blur(12px)",
        }}
      >
        <label style={{ display: "block", fontSize: 13, color: "#93c5fd", fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
          MONTHLY SALARY (PKR)
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#60a5fa",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              ₨
            </span>
            <input
              type="text"
              value={monthly ? Number(monthly).toLocaleString("en-PK") : ""}
              onChange={(event) => handleInput(event.target.value.replace(/,/g, ""))}
              placeholder="e.g. 150,000"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 14px 14px 36px",
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(96,165,250,0.3)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 18,
                fontWeight: 700,
                outline: "none",
              }}
              onKeyDown={(event) => event.key === "Enter" && calculate()}
            />
          </div>
          <button
            onClick={calculate}
            disabled={!monthly}
            style={{
              padding: "0 22px",
              background: monthly ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 12,
              color: monthly ? "#fff" : "#4b5563",
              fontWeight: 700,
              fontSize: 15,
              cursor: monthly ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            Calculate
          </button>
        </div>
        {monthly && <p style={{ margin: "10px 0 0", fontSize: 13, color: "#64748b" }}>Annual income: {formatPKR(Number(monthly) * 12)}</p>}
      </div>

      {result && (
        <div style={{ marginBottom: 20, animation: "fadeIn 0.4s ease" }}>
          <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

          <div
            style={{
              background: "linear-gradient(135deg, #1e3a5f, #1e40af)",
              border: "1px solid rgba(96,165,250,0.4)",
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600, letterSpacing: 0.8 }}>EFFECTIVE TAX RATE</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{result.effective.toFixed(2)}%</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{getSlabLabel(result.annual)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>ANNUAL TAX</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fca5a5" }}>{formatPKR(result.tax)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[
              { label: "Monthly Tax", value: formatPKR(result.monthlyTax), color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
              { label: "Annual Tax", value: formatPKR(result.tax), color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)" },
              { label: "Net Monthly", value: formatPKR(result.netMonthly), color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)" },
              { label: "Net Annual", value: formatPKR(result.netAnnual), color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
            ].map(({ label, value, color, bg, border }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "rgba(37,99,235,0.3)",
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: "#93c5fd" }}>Tax Slabs 2026-27</span>
          <span style={{ fontSize: 11, color: "#475569" }}>Salaried Individuals</span>
        </div>

        {slabRows.map(({ label, rate, isActive }, index) => (
          <div
            key={label}
            style={{
              padding: "12px 18px",
              borderBottom: index < slabRows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              background: isActive ? "rgba(37,99,235,0.18)" : "transparent",
              borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
              transition: "background 0.3s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 13, color: isActive ? "#bfdbfe" : "#94a3b8", fontWeight: isActive ? 700 : 400 }}>
                {isActive && <span style={{ color: "#60a5fa", marginRight: 5 }}>▶</span>}
                {label}
              </div>
              <div style={{ fontSize: 12, color: isActive ? "#fde68a" : "#64748b", textAlign: "right", flex: "0 0 auto", maxWidth: "55%" }}>
                {rate}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 16 }}>Source: Friends Consulting · Federal Budget 2026-27</p>
    </div>
  )
}