import {  useState } from "react"
import AdBanner from './AdBanner';


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
    <>
     <div className="tax-page">

      <div className="tax-header">
        <div className="tax-badge">
          <span className="tax-badge-text">
            Federal Budget 2026-27
          </span>
        </div>
        <h1 className="tax-title">Salary Tax Calculator</h1>
        <p className="tax-subtitle">Salaried Individuals · Pakistan Income Tax</p>
      </div>

      <div className="tax-card">
        <label className="tax-label">
          MONTHLY SALARY (PKR)
        </label>
        <div className="tax-input-row">
          <div className="tax-input-wrap">
            <span className="tax-currency">
              ₨
            </span>
            <input
              className="tax-input"
              type="text"
              value={monthly ? Number(monthly).toLocaleString("en-PK") : ""}
              onChange={(event) => handleInput(event.target.value.replace(/,/g, ""))}
              placeholder="e.g. 150,000"
              onKeyDown={(event) => event.key === "Enter" && calculate()}
            />
          </div>
          <button
            className="tax-button"
            onClick={calculate}
            disabled={!monthly}
          >
            Calculate
          </button>
        </div>
        {monthly && <p className="tax-annual">Annual income: {formatPKR(Number(monthly) * 12)}</p>}
      </div>

      {result && (
        <div className="tax-results">
          <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

          <div className="tax-banner">
            <div>
              <div className="tax-banner-label">EFFECTIVE TAX RATE</div>
              <div className="tax-banner-value">{result.effective.toFixed(2)}%</div>
              <div className="tax-banner-note">{getSlabLabel(result.annual)}</div>
            </div>
            <div className="tax-banner-right">
              <div className="tax-banner-right-label">ANNUAL TAX</div>
              <div className="tax-banner-right-value">{formatPKR(result.tax)}</div>
            </div>
          </div>

          <div className="tax-stat-grid">
            {[
              { label: "Monthly Tax", value: formatPKR(result.monthlyTax), className: "tax-stat-card tax-stat-card-red", valueClassName: "tax-stat-value tax-stat-value-red" },
              { label: "Annual Tax", value: formatPKR(result.tax), className: "tax-stat-card tax-stat-card-amber", valueClassName: "tax-stat-value tax-stat-value-amber" },
              { label: "Net Monthly", value: formatPKR(result.netMonthly), className: "tax-stat-card tax-stat-card-emerald", valueClassName: "tax-stat-value tax-stat-value-emerald" },
              { label: "Net Annual", value: formatPKR(result.netAnnual), className: "tax-stat-card tax-stat-card-blue", valueClassName: "tax-stat-value tax-stat-value-blue" },
            ].map(({ label, value, className, valueClassName }) => (
              <div key={label} className={className}>
                <div className="tax-stat-title">{label.toUpperCase()}</div>
                <div className={valueClassName}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tax-slab-table">
        <div className="tax-slab-header">
          <span className="tax-slab-title">Tax Slabs 2026-27</span>
          <span className="tax-slab-subtitle">Salaried Individuals</span>
        </div>

        {slabRows.map(({ label, rate, isActive }, index) => (
          <div key={label} className={`${isActive ? "tax-slab-row tax-slab-row-active" : "tax-slab-row"} ${index < slabRows.length - 1 ? "tax-slab-row-divider" : "tax-slab-row-last"}`}>
            <div className="tax-slab-content">
              <div className={isActive ? "tax-slab-label tax-slab-label-active" : "tax-slab-label"}>
                {isActive && <span className="tax-slab-arrow">▶</span>}
                {label}
              </div>
              <div className={isActive ? "tax-slab-rate tax-slab-rate-active" : "tax-slab-rate"}>
                {rate}
              </div>
            </div>
          </div>
        ))}
      </div>
            <AdBanner adSlot="1556060173" />
      <p className="tax-footer">Source: Talha Rehman· Federal Budget 2026-27</p>
    </div>

    </>

   
  )
}