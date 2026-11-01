export interface Operation {
  date: Date
  description: string
}

export type DistributionMode = 'hour' | 'weekday' | 'month' | 'year' | 'weekhour'

export interface DistributionBucket {
  label: string
  count: number
  percent: number
}
