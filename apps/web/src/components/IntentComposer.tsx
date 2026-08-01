import { useState, type FormEvent } from 'react'
import { ArrowUp, Compass } from 'lucide-react'
import { intentOptions, type IntentId } from '../data/catalog'
import { detectIntent } from '../lib/intent'

interface IntentComposerProps {
  activeIntent: IntentId
  onIntent: (intent: IntentId, query: string) => void
}

export function IntentComposer({ activeIntent, onIntent }: IntentComposerProps) {
  const [query, setQuery] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const cleanQuery = query.trim()
    if (!cleanQuery) return
    onIntent(detectIntent(cleanQuery), cleanQuery)
    setQuery('')
  }

  return (
    <aside className="intent-composer" aria-label="Descoberta guiada">
      <div className="intent-suggestions" aria-label="Sugestões de ocasião">
        {intentOptions.map((intent) => (
          <button
            key={intent.id}
            className={activeIntent === intent.id ? 'is-active' : ''}
            aria-pressed={activeIntent === intent.id}
            onClick={() => onIntent(intent.id, intent.label)}
          >
            {intent.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        <Compass aria-hidden="true" />
        <label className="sr-only" htmlFor="intent-query">Conte o que você procura</label>
        <input
          id="intent-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Conte a ocasião, o clima ou como quer se sentir"
          autoComplete="off"
        />
        <button type="submit" aria-label="Encontrar seleção">
          <ArrowUp aria-hidden="true" />
        </button>
      </form>
    </aside>
  )
}
