import { randomBytes } from 'node:crypto'

/** Lightweight cuid-like id for raw SQL inserts (avoids extra deps). */
export function createId(): string {
  return `c${randomBytes(12).toString('hex')}`
}
