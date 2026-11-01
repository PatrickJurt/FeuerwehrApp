import { useMemo, useState } from 'react'
import { computeDistribution } from '../stats.ts'
import type { DistributionMode, Operation } from '../types.ts'
import { BarChart } from './BarChart.tsx'

const OPTIONS: { value: DistributionMode; label: string }[] = [
  { value: 'hour', label: 'Stunden' },
  { value: 'weekhour', label: 'Wochenstunden' },
  { value: 'weekday', label: 'Wochentage' },
  { value: 'month', label: 'Monate' },
  { value: 'year', label: 'Jahre' },
]

interface DistributionToolProps {
  operations: Operation[]
}

export function DistributionTool({ operations }: DistributionToolProps) {
  const [mode, setMode] = useState<DistributionMode>('hour')
  const isWeekhour = mode === 'weekhour'
  const buckets = useMemo(() => computeDistribution(operations, mode), [operations, mode])

  return (
    <section className="card">
      <div className="segmented" role="group" aria-label="Einheit">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={mode === option.value}
            onClick={() => setMode(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="count">
        <strong>{operations.length}</strong>{' '}
        Einsätze
        {isWeekhour
          ? ' (dichte Ansicht: 168 Wochenstunden, Werte im Tooltip)'
          : ' (Wert je Balken: Anzahl und Anteil in %)'}
      </p>
      {operations.length === 0 ? (
        <p className="empty">Keine Einsätze gefunden.</p>
      ) : (
        <BarChart buckets={buckets} compact={isWeekhour} showValues={!isWeekhour} />
      )}
    </section>
  )
}
