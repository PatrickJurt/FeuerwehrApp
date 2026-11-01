import { describe, expect, it } from 'vitest'
import { filterByKeywords, filterByRange, getRange, parseKeywords } from './filters.ts'
import { parseOperations } from './parser.ts'
import { computeDistribution } from './stats.ts'

const SAMPLE = `03.10.2026\t01:18 Uhr; B / C Ereignis
02.10.2026\t15:18 Uhr; Hilfeleistung (Sichtschutz)
19.09.2026\t16:30 Uhr; BMA-Alarm
garbage
31.02.2026\t10:00 Uhr; Ungültig
`

describe('parseOperations', () => {
  it('parses valid lines and reports invalid ones', () => {
    const { operations, invalidLines } = parseOperations(SAMPLE)
    expect(operations).toHaveLength(3)
    expect(operations[0].date).toEqual(new Date(2026, 9, 3, 1, 18))
    expect(operations[0].description).toBe('B / C Ereignis')
    expect(invalidLines).toHaveLength(2)
  })
})

describe('filters', () => {
  const { operations } = parseOperations(SAMPLE)
  const noCustom = { from: null, to: null }

  it('filters by keywords case-insensitively (any match)', () => {
    expect(filterByKeywords(operations, parseKeywords('bma, hilfe'))).toHaveLength(2)
    expect(filterByKeywords(operations, [])).toHaveLength(3)
    expect(filterByKeywords(operations, ['brand'])).toHaveLength(0)
  })

  it('filters by timeframe', () => {
    const now = new Date(2026, 9, 25)
    expect(filterByRange(operations, getRange('1m', now, noCustom))).toHaveLength(2)
    expect(filterByRange(operations, getRange('all', now, noCustom))).toHaveLength(3)
  })

  it('includes the whole end day for custom ranges', () => {
    const range = { from: new Date(2026, 9, 3), to: new Date(2026, 9, 3) }
    expect(filterByRange(operations, range)).toHaveLength(1)
  })
})

describe('computeDistribution', () => {
  const { operations } = parseOperations(SAMPLE)

  it('computes hourly percentages', () => {
    const buckets = computeDistribution(operations, 'hour')
    expect(buckets).toHaveLength(24)
    expect(buckets[1].count).toBe(1)
    expect(buckets[1].percent).toBeCloseTo(33.33, 1)
  })

  it('starts weekdays on Monday', () => {
    const buckets = computeDistribution(operations, 'weekday')
    expect(buckets[0].label).toBe('Mo')
    expect(buckets.reduce((s, b) => s + b.count, 0)).toBe(3)
  })

  it('covers the year range and handles empty input', () => {
    expect(computeDistribution(operations, 'year').map((b) => b.label)).toEqual(['2026'])
    expect(computeDistribution([], 'year')).toEqual([])
    expect(computeDistribution([], 'month')[0].percent).toBe(0)
  })
})
