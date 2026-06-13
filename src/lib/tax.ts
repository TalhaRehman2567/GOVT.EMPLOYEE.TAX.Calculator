export type TaxSlab = {
  min: number
  max: number
  base: number
  rate: number
  over: number
}

export type TaxResult = {
  annual: number
  monthly: number
  tax: number
  monthlyTax: number
  effectiveRate: number
  netAnnual: number
  netMonthly: number
  taxPct: number
}

export const TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 600_000, base: 0, rate: 0, over: 0 },
  { min: 600_000, max: 1_200_000, base: 0, rate: 0.01, over: 600_000 },
  { min: 1_200_000, max: 2_200_000, base: 6_000, rate: 0.11, over: 1_200_000 },
  { min: 2_200_000, max: 3_200_000, base: 116_000, rate: 0.2, over: 2_200_000 },
  { min: 3_200_000, max: 4_100_000, base: 316_000, rate: 0.25, over: 3_200_000 },
  { min: 4_100_000, max: 5_600_000, base: 541_000, rate: 0.29, over: 4_100_000 },
  { min: 5_600_000, max: 7_000_000, base: 976_000, rate: 0.32, over: 5_600_000 },
  { min: 7_000_000, max: Infinity, base: 1_424_000, rate: 0.35, over: 7_000_000 },
]

export const SLAB_LABELS = [
  'Below Rs. 600,000',
  'Rs. 600,000 – 1,200,000',
  'Rs. 1,200,000 – 2,200,000',
  'Rs. 2,200,000 – 3,200,000',
  'Rs. 3,200,000 – 4,100,000',
  'Rs. 4,100,000 – 5,600,000',
  'Rs. 5,600,000 – 7,000,000',
  'Above Rs. 7,000,000',
]

export const RATE_LABELS = [
  'Exempt',
  '1% of excess over Rs. 600,000',
  'Rs. 6,000 + 11% of excess over Rs. 1,200,000',
  'Rs. 116,000 + 20% of excess over Rs. 2,200,000',
  'Rs. 316,000 + 25% of excess over Rs. 3,200,000',
  'Rs. 541,000 + 29% of excess over Rs. 4,100,000',
  'Rs. 976,000 + 32% of excess over Rs. 5,600,000',
  'Rs. 1,424,000 + 35% of excess over Rs. 7,000,000',
]

export const MAX_MONTHLY_SALARY = 100_000_000

export function calculateTax(annualIncome: number) {
  for (const slab of TAX_SLABS) {
    if (annualIncome <= slab.max) {
      const excess = Math.max(0, annualIncome - slab.over)
      return slab.base + excess * slab.rate
    }
  }

  return 0
}

export function getActiveSlabIndex(annualIncome: number) {
  for (let index = 0; index < TAX_SLABS.length; index += 1) {
    const slab = TAX_SLABS[index]

    if (annualIncome >= slab.min && annualIncome <= slab.max) {
      return index
    }
  }

  return TAX_SLABS.length - 1
}

export function formatPKR(amount: number) {
  return `Rs.\u00a0${Math.round(amount).toLocaleString('en-PK')}`
}

export function formatInput(raw: string) {
  if (!raw) return ''

  return Number(raw).toLocaleString('en-PK')
}

export function calculateTaxResult(monthlySalary: number): TaxResult {
  const annual = monthlySalary * 12
  const tax = calculateTax(annual)
  const monthlyTax = tax / 12
  const effectiveRate = annual > 0 ? (tax / annual) * 100 : 0
  const netAnnual = annual - tax
  const netMonthly = netAnnual / 12
  const taxPct = annual > 0 ? (tax / annual) * 100 : 0

  return {
    annual,
    monthly: monthlySalary,
    tax,
    monthlyTax,
    effectiveRate,
    netAnnual,
    netMonthly,
    taxPct,
  }
}