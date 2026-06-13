import { useState, useId, useCallback, useMemo } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  calculateTaxResult,
  formatInput,
  formatPKR,
  getActiveSlabIndex,
  MAX_MONTHLY_SALARY,
  RATE_LABELS,
  SLAB_LABELS,
  TAX_SLABS,
  type TaxResult,
} from "../lib/tax";

// ─── Styles (defined outside component — no re-creation on render) ─────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .tc-root {
    min-height: 100vh;
    background: linear-gradient(145deg, #060d1e 0%, #0b1a38 55%, #0a2450 100%);
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #dde8fb;
    padding: 28px 16px 48px;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Header ── */
  .tc-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(96,165,250,0.1);
    border: 1px solid rgba(96,165,250,0.22);
    border-radius: 99px;
    padding: 5px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
    color: #7eb8f7;
    margin-bottom: 14px;
  }
  .tc-badge-dot {
    width: 6px; height: 6px;
    background: #3b82f6;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .tc-heading {
    font-size: clamp(24px, 6vw, 34px);
    font-weight: 900;
    margin: 0 0 6px;
    background: linear-gradient(100deg, #93c5fd 10%, #bfdbfe 60%, #e0f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.8px;
    line-height: 1.15;
  }
  .tc-sub {
    color: #64748b;
    font-size: 13px;
    margin: 0;
  }

  /* ── Input Card ── */
  .tc-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(96,165,250,0.2);
    border-radius: 20px;
    padding: 22px 20px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
  .tc-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.1px;
    text-transform: uppercase;
    color: #93c5fd;
    margin-bottom: 10px;
  }
  .tc-input-row {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }
  .tc-input-wrap {
    flex: 1;
    position: relative;
  }
  .tc-rupee {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #60a5fa;
    font-weight: 800;
    font-size: 17px;
    pointer-events: none;
    user-select: none;
  }
  .tc-input {
    width: 100%;
    padding: 14px 14px 14px 38px;
    background: rgba(255,255,255,0.07);
    border: 1.5px solid rgba(96,165,250,0.28);
    border-radius: 12px;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -moz-appearance: textfield;
  }
  .tc-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
  }
  .tc-input.has-error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.18);
  }
  .tc-input::placeholder { color: #334155; font-weight: 500; }
  .tc-btn {
    padding: 0 22px;
    border: none;
    border-radius: 12px;
    font-family: inherit;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s, opacity 0.2s;
    white-space: nowrap;
  }
  .tc-btn:active { transform: scale(0.97); }
  .tc-btn:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }
  .tc-btn-active {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff;
  }
  .tc-btn-active:hover { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  .tc-btn-disabled {
    background: rgba(255,255,255,0.07);
    color: #374151;
    cursor: not-allowed;
  }
  .tc-error-msg {
    margin: 8px 0 0;
    font-size: 12px;
    color: #f87171;
    font-weight: 500;
  }
  .tc-annual-hint {
    margin: 10px 0 0;
    font-size: 12px;
    color: #475569;
  }

  /* ── Results ── */
  @keyframes tc-rise {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .tc-results { animation: none !important; }
    .tc-bar-fill { transition: none !important; }
  }
  .tc-results {
    animation: tc-rise 0.35s ease both;
    margin-bottom: 18px;
  }

  /* Effective rate banner */
  .tc-banner {
    background: linear-gradient(135deg, #132248, #1a3369);
    border: 1px solid rgba(96,165,250,0.35);
    border-radius: 18px;
    padding: 20px 22px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }
  .tc-banner-rate-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #93c5fd;
    margin-bottom: 2px;
  }
  .tc-banner-rate {
    font-size: clamp(32px, 8vw, 44px);
    font-weight: 900;
    color: #fff;
    line-height: 1;
    letter-spacing: -1px;
  }
  .tc-banner-slab {
    font-size: 11px;
    color: #475569;
    margin-top: 4px;
    font-weight: 500;
  }
  .tc-banner-tax-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #f87171;
    margin-bottom: 3px;
    text-align: right;
  }
  .tc-banner-tax-val {
    font-size: 20px;
    font-weight: 800;
    color: #fca5a5;
    text-align: right;
  }

  /* Breakdown bar */
  .tc-bar-wrap {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 12px;
  }
  .tc-bar-header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .tc-bar-track {
    height: 10px;
    background: rgba(255,255,255,0.06);
    border-radius: 99px;
    overflow: hidden;
  }
  .tc-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #ef4444, #f87171);
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
  }
  .tc-bar-legend {
    display: flex;
    gap: 16px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .tc-bar-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
  }
  .tc-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Stat grid */
  .tc-stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .tc-stat {
    border-radius: 14px;
    padding: 14px 16px;
    border: 1px solid transparent;
  }
  .tc-stat-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #475569;
    margin-bottom: 6px;
  }
  .tc-stat-val {
    font-size: 15px;
    font-weight: 800;
  }

  /* ── Slab Table ── */
  .tc-table {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .tc-table-head {
    background: rgba(29,78,216,0.22);
    padding: 13px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tc-table-title {
    font-weight: 700;
    font-size: 13px;
    color: #93c5fd;
  }
  .tc-table-sub {
    font-size: 11px;
    color: #334155;
    font-weight: 500;
  }
  .tc-slab-row {
    padding: 12px 18px;
    border-left: 3px solid transparent;
    transition: background 0.25s;
  }
  .tc-slab-row + .tc-slab-row {
    border-top: 1px solid rgba(255,255,255,0.04);
  }
  .tc-slab-row.active {
    background: rgba(37,99,235,0.15);
    border-left-color: #3b82f6;
  }
  .tc-slab-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }
  .tc-slab-range {
    font-size: 12.5px;
    font-weight: 400;
    color: #64748b;
    flex-shrink: 0;
  }
  .tc-slab-row.active .tc-slab-range {
    color: #bfdbfe;
    font-weight: 600;
  }
  .tc-slab-rate {
    font-size: 11.5px;
    color: #475569;
    text-align: right;
    flex: 0 0 auto;
    max-width: 56%;
  }
  .tc-slab-row.active .tc-slab-rate {
    color: #fde68a;
  }
  .tc-active-arrow {
    color: #60a5fa;
    margin-right: 5px;
    font-size: 9px;
  }

  /* ── Footer ── */
  .tc-footer {
    text-align: center;
    font-size: 11px;
    color: #1e293b;
    line-height: 1.6;
  }
  .tc-footer a {
    color: #334155;
    text-decoration: none;
  }
  .tc-footer a:hover { text-decoration: underline; }
`;

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TaxCalculator() {
  const inputId = useId();
  const [raw, setRaw] = useState("");        // unformatted digits only
  const [error, setError] = useState("");
  const [result, setResult] = useState<TaxResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Derived values — only recalculated when result changes
  const activeSlabIndex = useMemo(
    () => (result ? getActiveSlabIndex(result.annual) : -1),
    [result]
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, "");
    if (digits.length > 10) return; // guard against ridiculous input length
    setRaw(digits);
    setError("");
    if (hasCalculated) setResult(null); // clear stale result on edit
  }, [hasCalculated]);

  const calculate = useCallback(() => {
    const monthly = Number(raw);

    if (!raw || monthly <= 0) {
      setError("Please enter a valid monthly salary.");
      return;
    }

    if (monthly > MAX_MONTHLY_SALARY) {
      setError(`Please enter a salary below ${formatPKR(MAX_MONTHLY_SALARY)}.`);
      return;
    }

    setResult(calculateTaxResult(monthly));
    setHasCalculated(true);
    setError("");
  }, [raw]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") calculate(); },
    [calculate]
  );

  const displayValue = formatInput(raw);
  const annualHint = raw && !error ? `Annual income: ${formatPKR(Number(raw) * 12)}` : null;
  const canCalc = !!raw && !error;

  const STATS = result
    ? [
        { label: "Monthly Tax",  value: formatPKR(result.monthlyTax), color: "#f87171", bg: "rgba(239,68,68,0.09)",   border: "rgba(239,68,68,0.18)"   },
        { label: "Annual Tax",   value: formatPKR(result.tax),        color: "#fbbf24", bg: "rgba(251,191,36,0.09)",  border: "rgba(251,191,36,0.18)"  },
        { label: "Net Monthly",  value: formatPKR(result.netMonthly), color: "#34d399", bg: "rgba(52,211,153,0.09)",  border: "rgba(52,211,153,0.18)"  },
        { label: "Net Annual",   value: formatPKR(result.netAnnual),  color: "#60a5fa", bg: "rgba(96,165,250,0.09)",  border: "rgba(96,165,250,0.18)"  },
      ]
    : [];

  return (
    <>
      <style>{css}</style>
      <div className="tc-root" role="main">

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div>
            <div className="tc-badge">
              <span className="tc-badge-dot" aria-hidden="true" />
              Federal Budget 2026–27
            </div>
          </div>
          <h1 className="tc-heading">Salary Tax Calculator</h1>
          <p className="tc-sub">Salaried Individuals · Pakistan Income Tax</p>
        </div>

        {/* ── Input Card ── */}
        <div className="tc-card" style={{ marginBottom: 16 }}>
          <label htmlFor={inputId} className="tc-label">Monthly Salary (PKR)</label>
          <div className="tc-input-row">
            <div className="tc-input-wrap">
              <span className="tc-rupee" aria-hidden="true">₨</span>
              <input
                id={inputId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 150,000"
                aria-label="Monthly salary in Pakistani Rupees"
                aria-describedby={error ? "tc-error" : annualHint ? "tc-hint" : undefined}
                aria-invalid={!!error}
                className={`tc-input${error ? " has-error" : ""}`}
              />
            </div>
            <button
              onClick={calculate}
              disabled={!canCalc}
              aria-label="Calculate income tax"
              className={`tc-btn ${canCalc ? "tc-btn-active" : "tc-btn-disabled"}`}
            >
              Calculate
            </button>
          </div>

          {error && (
            <p id="tc-error" className="tc-error-msg" role="alert">{error}</p>
          )}
          {annualHint && !error && (
            <p id="tc-hint" className="tc-annual-hint">{annualHint}</p>
          )}
        </div>

        {/* ── Results ── */}
        {result && (
          <div className="tc-results">

            {/* Effective Rate Banner */}
            <div className="tc-banner" aria-label="Tax summary">
              <div>
                <div className="tc-banner-rate-label">Effective Tax Rate</div>
                <div className="tc-banner-rate" aria-live="polite">
                  {result.effectiveRate.toFixed(2)}%
                </div>
                <div className="tc-banner-slab">{SLAB_LABELS[activeSlabIndex]} slab</div>
              </div>
              <div>
                <div className="tc-banner-tax-label">Annual Tax</div>
                <div className="tc-banner-tax-val">{formatPKR(result.tax)}</div>
              </div>
            </div>

            {/* ── Signature: Breakdown Bar ── */}
            <div className="tc-bar-wrap" aria-label="Income breakdown">
              <div className="tc-bar-header">
                <span style={{ color: "#f87171" }}>Tax Deducted</span>
                <span style={{ color: "#34d399" }}>Take-Home</span>
              </div>
              <div className="tc-bar-track" role="img" aria-label={`${result.taxPct.toFixed(1)}% tax, ${(100 - result.taxPct).toFixed(1)}% take-home`}>
                <div
                  className="tc-bar-fill"
                  style={{ width: `${Math.min(result.taxPct, 100)}%` }}
                />
              </div>
              <div className="tc-bar-legend">
                <span className="tc-bar-legend-item">
                  <span className="tc-legend-dot" style={{ background: "#ef4444" }} aria-hidden="true" />
                  {result.taxPct.toFixed(1)}% tax
                </span>
                <span className="tc-bar-legend-item">
                  <span className="tc-legend-dot" style={{ background: "#34d399" }} aria-hidden="true" />
                  {(100 - result.taxPct).toFixed(1)}% take-home
                </span>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="tc-stat-grid">
              {STATS.map(({ label, value, color, bg, border }) => (
                <div
                  key={label}
                  className="tc-stat"
                  style={{ background: bg, borderColor: border }}
                >
                  <div className="tc-stat-label">{label}</div>
                  <div className="tc-stat-val" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tax Slab Table ── */}
        <div className="tc-table" role="table" aria-label="Pakistan income tax slabs 2026–27">
          <div className="tc-table-head" role="rowgroup">
            <span className="tc-table-title" role="columnheader">Tax Slabs 2026–27</span>
            <span className="tc-table-sub" role="columnheader">Salaried Individuals</span>
          </div>
          <div role="rowgroup">
            {TAX_SLABS.map((_, i) => {
              const isActive = i === activeSlabIndex;
              return (
                <div
                  key={i}
                  className={`tc-slab-row${isActive ? " active" : ""}`}
                  role="row"
                  aria-current={isActive ? "true" : undefined}
                >
                  <div className="tc-slab-inner">
                    <div className="tc-slab-range" role="cell">
                      {isActive && <span className="tc-active-arrow" aria-hidden="true">▶</span>}
                      {SLAB_LABELS[i]}
                    </div>
                    <div className="tc-slab-rate" role="cell">{RATE_LABELS[i]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="tc-footer">
          Tax slabs per FBR notification · Federal Budget 2026–27<br />
          For reference only — consult a tax professional for filing.
        </p>
      </div>
    </>
  );
}