import type { DistributionBucket } from '../types.ts'

interface BarChartProps {
  buckets: DistributionBucket[]
}

const HEIGHT = 270
const BAR_WIDTH = 28
const GAP = 8
const PADDING = { top: 34, bottom: 36, left: 8, right: 8 }
const percentFormat = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatPercent = (value: number) => `${percentFormat.format(value)}%`

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
              <title>{`${bucket.label}: ${bucket.count} (${formatPercent(bucket.percent)})`}</title>
              <rect className="bar" x={x} y={y} width={BAR_WIDTH} height={barHeight} rx={4} />
              {bucket.count > 0 ? (
                <text className="bar-value" x={x + BAR_WIDTH / 2} y={y - 14} textAnchor="middle">
                  <tspan x={x + BAR_WIDTH / 2} dy="0">
                    {bucket.count}
                  </tspan>
                  <tspan x={x + BAR_WIDTH / 2} dy="12">
                    {formatPercent(bucket.percent)}
                  </tspan>
                </text>
              ) : null}
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
