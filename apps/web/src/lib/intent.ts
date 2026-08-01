import type { IntentId, Product } from '../data/catalog'

const signals: Record<IntentId, string[]> = {
  'por-do-sol': ['pôr do sol', 'entardecer', 'blazer', 'jantar', 'fim da tarde'],
  'beira-mar': ['beira-mar', 'mar', 'praia', 'calor', 'linho'],
  ilha: ['ilha', 'fim de semana', 'viagem', 'casual', 'barco', 'passeio'],
  essenciais: ['essencial', 'básico', 'versátil', 'todo dia', 'guarda-roupa'],
}

export function detectIntent(query: string): IntentId {
  const normalized = query.toLocaleLowerCase('pt-BR')
  const tokens = normalized.split(/[^\p{L}\p{N}-]+/u)
  const match = (Object.entries(signals) as [IntentId, string[]][]).find(([, words]) =>
    words.some((word) => (word.includes(' ') ? normalized.includes(word) : tokens.includes(word))),
  )

  return match?.[0] ?? 'essenciais'
}

export function rankProducts(products: Product[], intent: IntentId): Product[] {
  return [...products].sort((a, b) => Number(b.intents.includes(intent)) - Number(a.intents.includes(intent)))
}
