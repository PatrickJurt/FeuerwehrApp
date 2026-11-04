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
const SEGMENT_COLORS = {
  low: '#1d4ed8',
  normal: '#15803d',
  elevated: '#c2410c',
  high: '#b91c1c',
} as const

interface AlarmIndexToolProps {
  operations: Operation[]
}

function getBandForValue(value: number): 'low' | 'normal' | 'elevated' | 'high' {
  if (value < 0.7) return 'low'
  if (value < 1.3) return 'normal'
  if (value < 2.0) return 'elevated'
  return 'high'
}

export function getTrendThresholdCrossings(startValue: number, endValue: number, thresholds = [0.7, 1.3, 2.0]) {
  const min = Math.min(startValue, endValue)
  const max = Math.max(startValue, endValue)
  const crossings = thresholds.filter((threshold) => threshold > min && threshold < max)

  return startValue <= endValue ? crossings.sort((a, b) => a - b) : crossings.sort((a, b) => b - a)
}

function getBandAfterThreshold(threshold: number, direction: 'up' | 'down') {
  const epsilon = 1e-9
  return getBandForValue(direction === 'up' ? threshold + epsilon : threshold - epsilon)
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null)

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
  const hoveredPoint = hoveredIndex === null ? null : trendPoints[hoveredIndex]
  const thresholdValues = [0.7, 1.3, 2.0]

  function handlePointHover(index: number, event: React.MouseEvent<SVGCircleElement>): void {
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const x = Math.min(Math.max(event.clientX - rect.left, 10), rect.width - 10)
    const y = Math.min(Math.max(event.clientY - rect.top, 10), rect.height - 10)

    setHoveredIndex(index)
    setHoveredPosition({ x, y })
  }

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

  const trendSegments = useMemo(() => {
    const segments: { d: string; band: 'low' | 'normal' | 'elevated' | 'high' }[] = []

    for (let index = 0; index < trendPoints.length - 1; index += 1) {
      const previous = trendPoints[index]
      const point = trendPoints[index + 1]
      const x1 = CHART_PADDING.left + ((CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) * index) / (trendPoints.length - 1)
      const x2 = CHART_PADDING.left + ((CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) * (index + 1)) / (trendPoints.length - 1)
      const y1 =
        CHART_PADDING.top +
        (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) -
        ((previous.value - trendMin) / Math.max(0.0001, trendMax - trendMin)) *
          (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)
      const y2 =
        CHART_PADDING.top +
        (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) -
        ((point.value - trendMin) / Math.max(0.0001, trendMax - trendMin)) *
          (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)

      let currentBand = getBandForValue(previous.value)
      let currentX = x1
      let currentY = y1
      const valueDelta = point.value - previous.value
      const direction = valueDelta >= 0 ? 'up' : 'down'
      const crossings = getTrendThresholdCrossings(previous.value, point.value, thresholdValues)

      for (const threshold of crossings) {
        const ratio = valueDelta === 0 ? 0 : (threshold - previous.value) / valueDelta
        const x = x1 + (x2 - x1) * ratio
        const y = y1 + (y2 - y1) * ratio
        const nextBand = getBandAfterThreshold(threshold, direction)

        segments.push({
          d: `M ${currentX} ${currentY} L ${x} ${y}`,
          band: currentBand,
        })

        currentBand = nextBand
        currentX = x
        currentY = y
      }

      segments.push({
        d: `M ${currentX} ${currentY} L ${x2} ${y2}`,
        band: currentBand,
      })
    }

    return segments
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
        {hoveredPoint && hoveredPosition ? (
          <div
            className="alarm-tooltip"
            style={{
              left: `${hoveredPosition.x}px`,
              top: `${hoveredPosition.y}px`,
            }}
          >
            <strong>{hoveredPoint.date.toLocaleTimeString('de-DE', { hour: '2-digit' })} Uhr</strong>
            <span>{indexFormat.format(hoveredPoint.value)}</span>
          </div>
        ) : null}
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
          {trendSegments.map((segment, index) => (
            <path
              key={`segment-${index}`}
              d={segment.d}
              stroke={SEGMENT_COLORS[segment.band]}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {trendPoints.map((point, index) => {
            const x = CHART_PADDING.left + ((CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) * index) / (trendPoints.length - 1)
            const y =
              CHART_PADDING.top +
              (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) -
              ((point.value - trendMin) / Math.max(0.0001, trendMax - trendMin)) *
                (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)
            const isSelected = index === selectedTrendIndex
            const isHovered = index === hoveredIndex
            return (
              <g key={`${point.label}-${index}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={CHART_HEIGHT - CHART_PADDING.bottom}
                  y2={CHART_HEIGHT - CHART_PADDING.bottom + 6}
                  className="alarm-trend-axis"
                />
                {(isSelected || isHovered) ? (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 10 : 8}
                      className={`alarm-trend-point is-${classification.band}`}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={14}
                      className="alarm-trend-hit"
                      onMouseMove={(event) => handlePointHover(index, event)}
                      onMouseEnter={(event) => handlePointHover(index, event)}
                      onMouseLeave={() => {
                        setHoveredIndex(null)
                        setHoveredPosition(null)
                      }}
                    />
                  </>
                ) : (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r={4}
                      className="alarm-trend-point-dim"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={14}
                      className="alarm-trend-hit"
                      onMouseMove={(event) => handlePointHover(index, event)}
                      onMouseEnter={(event) => handlePointHover(index, event)}
                      onMouseLeave={() => {
                        setHoveredIndex(null)
                        setHoveredPosition(null)
                      }}
                    />
                  </>
                )}
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
