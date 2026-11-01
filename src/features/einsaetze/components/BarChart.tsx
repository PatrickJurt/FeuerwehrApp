import type { DistributionBucket } from '../types.ts'

interface BarChartProps {
  buckets: DistributionBucket[]
}

const HEIGHT = 240
const BAR_WIDTH = 28
const GAP = 8
const PADDING = { top: 20, bottom: 36, left: 8, right: 8 }

export function BarChart({ buckets }: BarChartProps) {
  const max = Math.max(1, ...buckets.map((b) => b.count))
  const width = PADDING.left + PADDING.right + buckets.length * (BAR_WIDTH + GAP)
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  return (
    <div className="chart-scroll">
      <svg
        role="img"
        aria-label="Verteilung der Einsätze"
        viewBox={`0 0 ${width} ${HEIGHT}`}
        width={width}
        height={HEIGHT}
      >
        {buckets.map((bucket, i) => {
          const barHeight = (bucket.count / max) * plotHeight
          const x = PADDING.left + i * (BAR_WIDTH + GAP)
          const y = PADDING.top + plotHeight - barHeight
          return (
            <g key={bucket.label}>
              <title>{`${bucket.label}: ${bucket.count} (${bucket.percent.toFixed(1)} %)`}</title>
              <rect className="bar" x={x} y={y} width={BAR_WIDTH} height={barHeight} rx={4} />
              <text className="bar-value" x={x + BAR_WIDTH / 2} y={y - 5} textAnchor="middle">
                {bucket.count > 0 ? `${bucket.percent.toFixed(0)}%` : ''}
              </text>
              <text
                className="bar-label"
                x={x + BAR_WIDTH / 2}
                y={HEIGHT - PADDING.bottom + 16}
                textAnchor="middle"
              >
                {bucket.label.replace(':00', '')}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
