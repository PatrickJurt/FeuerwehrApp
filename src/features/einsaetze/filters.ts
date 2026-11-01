import type { Operation } from './types.ts'

export type Timeframe = '1m' | '3m' | '6m' | '1y' | 'all' | 'custom'

export interface DateRange {
  from: Date | null
  to: Date | null
}

export function parseKeywords(input: string): string[] {
  return input
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean)
}

/** Keeps operations whose description contains at least one keyword (case-insensitive). */
export function filterByKeywords(operations: Operation[], keywords: string[]): Operation[] {
  if (keywords.length === 0) return operations
  return operations.filter((op) => {
    const text = op.description.toLowerCase()
    return keywords.some((keyword) => text.includes(keyword))
  })
}

const MONTHS_BY_TIMEFRAME: Record<'1m' | '3m' | '6m' | '1y', number> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '1y': 12,
}

export function getRange(timeframe: Timeframe, now: Date, custom: DateRange): DateRange {
  if (timeframe === 'all') return { from: null, to: null }
  if (timeframe === 'custom') return custom
  const from = new Date(now)
  from.setMonth(from.getMonth() - MONTHS_BY_TIMEFRAME[timeframe])
  return { from, to: now }
}

export function filterByRange(operations: Operation[], { from, to }: DateRange): Operation[] {
  const start = from ? startOfDay(from).getTime() : -Infinity
  const end = to ? endOfDay(to).getTime() : Infinity
  return operations.filter((op) => {
    const time = op.date.getTime()
    return time >= start && time <= end
  })
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}
