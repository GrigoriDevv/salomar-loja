export const SHIPPING_TABLE_VERSION = 'v1'
export const GRAMS_PER_UNIT = 400

export type ShippingRegion = 'sudeste' | 'sul' | 'nordeste' | 'norte_centro'

export type ShippingServiceCode = 'pac' | 'express'

export type ShippingOption = {
  serviceCode: ShippingServiceCode
  serviceName: string
  priceCents: number
  days: number
}

type RegionRates = {
  pacBaseCents: number
  pacExtraUnitCents: number
  pacDays: number
  expressMultiplier: number
  expressDays: number
}

const REGION_RATES: Record<ShippingRegion, RegionRates> = {
  sudeste: {
    pacBaseCents: 1890,
    pacExtraUnitCents: 350,
    pacDays: 5,
    expressMultiplier: 1.7,
    expressDays: 2,
  },
  sul: {
    pacBaseCents: 2290,
    pacExtraUnitCents: 400,
    pacDays: 7,
    expressMultiplier: 1.7,
    expressDays: 3,
  },
  nordeste: {
    pacBaseCents: 2790,
    pacExtraUnitCents: 450,
    pacDays: 10,
    expressMultiplier: 1.75,
    expressDays: 5,
  },
  norte_centro: {
    pacBaseCents: 3190,
    pacExtraUnitCents: 500,
    pacDays: 12,
    expressMultiplier: 1.8,
    expressDays: 6,
  },
}

/** Prefixos CEP (3 dígitos) → região. Cobertura BR aproximada. */
export function regionForCepPrefix(prefix: number): ShippingRegion | null {
  if (prefix < 10 || prefix > 999) return null
  if (prefix >= 10 && prefix <= 399) return 'sudeste'
  if (prefix >= 800 && prefix <= 999) return 'sul'
  if (prefix >= 400 && prefix <= 659) return 'nordeste'
  if (prefix >= 660 && prefix <= 799) return 'norte_centro'
  return null
}

export function normalizeCep(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function isValidCepFormat(cep: string): boolean {
  if (!/^\d{8}$/.test(cep)) return false
  if (cep === '00000000') return false
  return true
}

export function buildShippingOptions(
  cep: string,
  totalUnits: number,
): ShippingOption[] {
  const prefix = Number(cep.slice(0, 3))
  const region = regionForCepPrefix(prefix)
  if (!region) {
    throw new Error('CEP fora das faixas atendidas')
  }

  const units = Math.max(1, totalUnits)
  const rates = REGION_RATES[region]
  const pacPrice =
    rates.pacBaseCents + rates.pacExtraUnitCents * Math.max(0, units - 1)
  const expressPrice = Math.round(pacPrice * rates.expressMultiplier)

  return [
    {
      serviceCode: 'pac',
      serviceName: 'Econômico',
      priceCents: pacPrice,
      days: rates.pacDays,
    },
    {
      serviceCode: 'express',
      serviceName: 'Expresso',
      priceCents: expressPrice,
      days: rates.expressDays,
    },
  ]
}

export function findOption(
  options: ShippingOption[],
  serviceCode: string,
): ShippingOption | undefined {
  return options.find((o) => o.serviceCode === serviceCode)
}
