import { useMemo, useState } from 'react'
import { filterByRange, getRange, type DateRange, type Timeframe } from '../filters.ts'
import { formatDateTime, fromInputDate } from '../format.ts'
import type { Operation } from '../types.ts'

const OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '1m', label: '1 Monat' },
  { value: '3m', label: '3 Monate' },
  { value: '6m', label: '6 Monate' },
  { value: '1y', label: '1 Jahr' },
  { value: 'all', label: 'Gesamt' },
  { value: 'custom', label: 'Benutzerdefiniert' },
]

interface TimeframeToolProps {
  operations: Operation[]
}

export function TimeframeTool({ operations }: TimeframeToolProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1y')
  const [now] = useState(() => new Date())
  const [custom, setCustom] = useState<DateRange>({ from: null, to: null })

  const visible = useMemo(
    () => filterByRange(operations, getRange(timeframe, now, custom)),
    [operations, timeframe, custom, now],
  )

  return (
    <section className="card">
      <div className="segmented" role="group" aria-label="Zeitraum">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={timeframe === option.value}
            onClick={() => setTimeframe(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {timeframe === 'custom' && (
        <div className="date-range">
          <label className="field">
            <span className="field-label">Von</span>
            <input
              type="date"
              onChange={(e) => setCustom((c) => ({ ...c, from: fromInputDate(e.target.value) }))}
            />
          </label>
          <label className="field">
            <span className="field-label">Bis</span>
            <input
              type="date"
              onChange={(e) => setCustom((c) => ({ ...c, to: fromInputDate(e.target.value) }))}
            />
          </label>
        </div>
      )}

      <p className="count">
        <strong>{visible.length}</strong> {visible.length === 1 ? 'Einsatz' : 'Einsätze'}
      </p>

      {visible.length === 0 ? (
        <p className="empty">Keine Einsätze gefunden.</p>
      ) : (
        <ul className="operation-list">
          {visible.map((op) => (
            <li key={`${op.date.getTime()}-${op.description}`}>
              <time dateTime={op.date.toISOString()}>{formatDateTime(op.date)}</time>
              <span>{op.description}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
