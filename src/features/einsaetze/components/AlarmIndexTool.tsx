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

const HOUR_IN_MS = 60 * 60 * 1000
const CHART_WIDTH = 1100
const CHART_HEIGHT = 280
const CHART_PADDING = { top: 22, right: 30, bottom: 46, left: 42 }

interface AlarmIndexToolProps {
  operations: Operation[]
}

function buildTrendPoints(model: ReturnType<typeof buildAlarmIndexModel>, target: Date) {
  return Array.from({ length: 11 }, (_, index) => {
    const offsetHours = index - 5
    const pointDate = new Date(target.getTime() + offsetHours * HOUR_IN_MS)
    pointDate.setMinutes(0, 0, 0)
    const value = computeAlarmIndexAt(model, pointDate)
    return {
      date: pointDate,
      label: new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
      }).format(pointDate),
      value,
      offsetHours,
    }
  })
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
  const trendPoints = useMemo(
    () => buildTrendPoints(model, selectedDateTime),
    [model, selectedDateTime],
  )

  const trendMin = 0
  const trendMax = useMemo(
    () => Math.max(2, ...trendPoints.map((point) => point.value)) + 0.5,
    [trendPoints],
  )
  const selectedTrendIndex = trendPoints.findIndex((point) => point.offsetHours === 0)

  const trendPath = useMemo(() => {
    const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
    const range = Math.max(0.0001, trendMax - trendMin)

    return trendPoints
      .map((point, index) => {
        const x = CHART_PADDING.left + (plotWidth * index) / (trendPoints.length - 1)
        const y =
          CHART_PADDING.top +
          plotHeight -
          ((point.value - trendMin) / range) * plotHeight
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }, [trendMax, trendMin, trendPoints])

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
      <div className="alarm-trend" aria-label="Alarmindex-Verlauf in den letzten und nächsten fünf Stunden">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" height={CHART_HEIGHT}>
          <line
            x1={CHART_PADDING.left}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y1={CHART_HEIGHT - CHART_PADDING.bottom}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            className="alarm-trend-axis"
          />
          <line
            x1={CHART_PADDING.left}
            x2={CHART_PADDING.left}
            y1={CHART_PADDING.top}
            y2={CHART_HEIGHT - CHART_PADDING.bottom}
            className="alarm-trend-axis"
          />
          {[0, 0.5, 1, 1.5, 2].map((value) => {
            if (value > trendMax) return null
            const y =
              CHART_PADDING.top +
              ((CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) * (trendMax - value)) /
                (trendMax - trendMin)
            return (
              <g key={value}>
                <text
                  x={CHART_PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="alarm-trend-label"
                >
                  {value.toFixed(1).replace('.0', '')}
                </text>
                <line
                  x1={CHART_PADDING.left}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                  className="alarm-trend-grid"
                />
              </g>
            )
          })}
          <path
            d={`${trendPath} L ${CHART_WIDTH - CHART_PADDING.right} ${CHART_HEIGHT - CHART_PADDING.bottom} L ${CHART_PADDING.left} ${CHART_HEIGHT - CHART_PADDING.bottom} Z`}
            className="alarm-trend-area"
          />
          <path d={trendPath} className={`alarm-trend-line is-${classification.band}`} />
          {trendPoints.map((point, index) => {
            const x = CHART_PADDING.left + ((CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) * index) / (trendPoints.length - 1)
            const y =
              CHART_PADDING.top +
              (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) -
              ((point.value - trendMin) / Math.max(0.0001, trendMax - trendMin)) *
                (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)
            const isSelected = index === selectedTrendIndex
            return (
              <g key={`${point.label}-${index}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={CHART_HEIGHT - CHART_PADDING.bottom}
                  y2={CHART_HEIGHT - CHART_PADDING.bottom + 6}
                  className="alarm-trend-axis"
                />
                {isSelected ? (
                  <circle cx={x} cy={y} r={5} className={`alarm-trend-point is-${classification.band}`} />
                ) : null}
              </g>
            )
          })}
          {trendPoints.map((point, index) => {
            const x = CHART_PADDING.left + ((CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) * index) / (trendPoints.length - 1)
            const isLabelPoint = index === 0 || index === 5 || index === 10
            if (!isLabelPoint) return null

            const label = point.date.toLocaleTimeString('de-DE', {
              hour: '2-digit',
            })

            return (
              <text
                key={`${point.label}-label-${index}`}
                x={x}
                y={CHART_HEIGHT - 10}
                textAnchor="middle"
                className="alarm-trend-label"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
      <p className="count">Berechnet für {formatDateTime(selectedDateTime)}</p>
    </section>
  )
}
