import { useState, type KeyboardEvent } from 'react'
import type { KeywordRule, KeywordRuleMode } from '../filters.ts'

interface KeywordFilterProps {
  rules: KeywordRule[]
  onAddRule: (keyword: string, mode: KeywordRuleMode) => void
  onRemoveRule: (index: number) => void
}

export function KeywordFilter({ rules, onAddRule, onRemoveRule }: KeywordFilterProps) {
  const [input, setInput] = useState('')

  function add(mode: KeywordRuleMode): void {
    onAddRule(input, mode)
    setInput('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter') return
    event.preventDefault()
    add('include')
  }

  return (
    <div className="card field keyword-filter">
      <span className="field-label">
        Stichwort eingeben und als Muss (+) oder Ausschluss (-) hinzufügen. Spätere Regeln haben
        Vorrang.
      </span>
      <div className="keyword-input-row">
        <input
          type="search"
          value={input}
          placeholder="z. B. Brand, BMA, Fahrzeug"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="keyword-add keyword-add-plus"
          onClick={() => add('include')}
          disabled={input.trim().length === 0}
          aria-label="Als Muss-Stichwort hinzufügen"
          title="Als Muss-Stichwort hinzufügen"
        >
          +
        </button>
        <button
          type="button"
          className="keyword-add keyword-add-minus"
          onClick={() => add('exclude')}
          disabled={input.trim().length === 0}
          aria-label="Als Ausschluss-Stichwort hinzufügen"
          title="Als Ausschluss-Stichwort hinzufügen"
        >
          -
        </button>
      </div>

      {rules.length > 0 ? (
        <ul className="keyword-rules" aria-label="Aktive Stichwort-Regeln">
          {rules.map((rule, index) => (
            <li key={`${rule.mode}-${rule.keyword}-${index}`}>
              <span className={`keyword-pill is-${rule.mode}`}>
                {rule.mode === 'include' ? '+' : '-'} {rule.keyword}
              </span>
              <button
                type="button"
                className="keyword-remove"
                onClick={() => onRemoveRule(index)}
                aria-label={`Regel ${rule.keyword} entfernen`}
                title="Regel entfernen"
              >
                x
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Noch keine Stichwort-Regeln.</p>
      )}
    </div>
  )
}
