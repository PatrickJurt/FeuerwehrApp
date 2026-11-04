import { useMemo, useState } from 'react'
import { buildAlarmIndexModel, classifyAlarmIndex, computeAlarmIndexAt } from '../alarmIndex.ts'
import { formatDateTime, fromInputDateTime, toInputDate, toInputTime } from '../format.ts'
import type { Operation } from '../types.ts'

const indexFormat = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const alarmIndexHelpText =
  'Interpretation des Alarmindex:\n' +
  '1,0 = durchschnittliche Einsatzwahrscheinlichkeit\n' +
  '2,0 = doppelt so hoch wie durchschnittlich\n' +
  '0,5 = halb so hoch wie durchschnittlich\n\n' +
  'Schwellen:\n' +
  '< 0,7: unterdurchschnittlich\n' +
  '0,7 bis < 1,3: durchschnittlich\n' +
  '1,3 bis < 2,0: erhöht\n' +
  '>= 2,0: deutlich erhöht'

interface AlarmIndexToolProps {
  operations: Operation[]
}

export function AlarmIndexTool({ operations }: AlarmIndexToolProps) {
  const [selection, setSelection] = useState(() => {
    const now = new Date()
    return {
      date: toInputDate(now),
      time: toInputTime(now),
    }
  })

  const model = useMemo(() => buildAlarmIndexModel(operations), [operations])

  const selectedDateTime = useMemo(
    () => fromInputDateTime(selection.date, selection.time) ?? new Date(),
    [selection],
  )

  const index = useMemo(() => computeAlarmIndexAt(model, selectedDateTime), [model, selectedDateTime])
  const classification = classifyAlarmIndex(index)

  function handleNow(): void {
    const now = new Date()
    setSelection({ date: toInputDate(now), time: toInputTime(now) })
  }

  return (
    <section className="card alarm-index-card">
      <div className="alarm-controls">
        <label className="field">
          <span className="field-label">Datum</span>
          <input
            type="date"
            value={selection.date}
            onChange={(e) => setSelection((s) => ({ ...s, date: e.target.value }))}
          />
        </label>
        <label className="field">
          <span className="field-label">Uhrzeit</span>
          <input
            type="time"
            value={selection.time}
            onChange={(e) => setSelection((s) => ({ ...s, time: e.target.value }))}
          />
        </label>
        <button type="button" className="alarm-now" onClick={handleNow}>
          Jetzt
        </button>
      </div>

      <div className="alarm-index-row">
        <p className={`alarm-index is-${classification.band}`}>{indexFormat.format(index)}</p>
        <button
          type="button"
          className="alarm-info"
          title={alarmIndexHelpText}
          aria-label="Hilfe zur Interpretation des Alarmindex"
        >
          ?
        </button>
      </div>
      <p className={`alarm-description is-${classification.band}`}>{classification.text}</p>
      <p className="count">Berechnet für {formatDateTime(selectedDateTime)}</p>
    </section>
  )
}
