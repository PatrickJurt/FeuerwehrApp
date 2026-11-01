import type { DistributionBucket, DistributionMode, Operation } from './types.ts'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

const pad = (n: number) => String(n).padStart(2, '0')

export function computeDistribution(
  operations: Operation[],
  mode: DistributionMode,
): DistributionBucket[] {
  let labels: string[]
  let indexOf: (date: Date) => number

  switch (mode) {
    case 'hour':
      labels = Array.from({ length: 24 }, (_, h) => `${pad(h)}:00`)
      indexOf = (d) => d.getHours()
      break
    case 'weekday':
      labels = WEEKDAYS
      indexOf = (d) => (d.getDay() + 6) % 7
      break
    case 'month':
      labels = MONTHS
      indexOf = (d) => d.getMonth()
      break
    case 'year': {
      if (operations.length === 0) return []
      const years = operations.map((op) => op.date.getFullYear())
      const first = Math.min(...years)
      const last = Math.max(...years)
      labels = Array.from({ length: last - first + 1 }, (_, i) => String(first + i))
      indexOf = (d) => d.getFullYear() - first
      break
    }
  }

  const counts = labels.map(() => 0)
  for (const op of operations) counts[indexOf(op.date)]++
  const total = operations.length
  return labels.map((label, i) => ({
    label,
    count: counts[i],
    percent: total === 0 ? 0 : (counts[i] / total) * 100,
  }))
}
