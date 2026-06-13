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
import "./TaxCalculator.css";

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