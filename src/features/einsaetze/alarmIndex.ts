import type { Operation } from './types.ts'

const HOURS_PER_WEEK = 24 * 7
const MONTHS_PER_YEAR = 12
const DAYS_PER_WEEK = 7
const HOURS_PER_DAY = 24
const FACTOR_SMOOTHING = 1
const DEFAULT_SMOOTHING_CONSTANT = 10

export interface AlarmIndexModel {
  totalOperations: number
  globalRate: number
  observedWeeks: number
  monthCounts: number[]
  weekdayCounts: number[]
  hourCounts: number[]
  weekhourCounts: number[]
}

export type AlarmBand = 'low' | 'normal' | 'elevated' | 'high'

/**
 * Builds reusable aggregates for the alarm-index model.
 *
 * Model overview:
 * - globalRate estimates the average operations per observed hour.
 * - month/weekday/hour factors capture broad seasonal and temporal structure.
 * - weekhourCounts captures fine-grained (weekday+hour) evidence.
 */
export function buildAlarmIndexModel(operations: Operation[]): AlarmIndexModel {
  const monthCounts = Array.from({ length: MONTHS_PER_YEAR }, () => 0)
  const weekdayCounts = Array.from({ length: DAYS_PER_WEEK }, () => 0)
  const hourCounts = Array.from({ length: HOURS_PER_DAY }, () => 0)
  const weekhourCounts = Array.from({ length: HOURS_PER_WEEK }, () => 0)

  if (operations.length === 0) {
    return {
      totalOperations: 0,
      globalRate: 0,
      observedWeeks: 1,
      monthCounts,
      weekdayCounts,
      hourCounts,
      weekhourCounts,
    }
  }

  let minTime = Number.POSITIVE_INFINITY
  let maxTime = Number.NEGATIVE_INFINITY

  for (const op of operations) {
    const t = op.date.getTime()
    if (t < minTime) minTime = t
    if (t > maxTime) maxTime = t

    const month = op.date.getMonth()
    const weekday = (op.date.getDay() + 6) % 7
    const hour = op.date.getHours()
    const weekhour = weekday * HOURS_PER_DAY + hour

    monthCounts[month]++
    weekdayCounts[weekday]++
    hourCounts[hour]++
    weekhourCounts[weekhour]++
  }

  const observedHours = Math.max(1, Math.ceil((maxTime - minTime) / 3_600_000) + 1)
  const observedWeeks = Math.max(1, observedHours / HOURS_PER_WEEK)
  const totalOperations = operations.length
  const globalRate = totalOperations / observedHours

  return {
    totalOperations,
    globalRate,
    observedWeeks,
    monthCounts,
    weekdayCounts,
    hourCounts,
    weekhourCounts,
  }
}

function smoothedFactor(count: number, expected: number): number {
  // Laplace-style smoothing keeps all factors > 0 even with sparse data.
  return (count + FACTOR_SMOOTHING) / (expected + FACTOR_SMOOTHING)
}

/**
 * Calculates relative alarm index at a target timestamp.
 *
 * 1) globalRate: baseline operations/hour
 * 2) lambdaModel: baseline * monthFactor * weekdayFactor * hourFactor
 * 3) lambdaWeekHour: empirical operations/week for exact weekday+hour
 * 4) lambdaFinal: weighted blend, weight = weekHourCount / (weekHourCount + k)
 * 5) alarmIndex: lambdaFinal / globalRate
 */
export function computeAlarmIndexAt(
  model: AlarmIndexModel,
  target: Date,
  smoothingConstant = DEFAULT_SMOOTHING_CONSTANT,
): number {
  if (model.totalOperations === 0 || model.globalRate <= 0) return 1

  const month = target.getMonth()
  const weekday = (target.getDay() + 6) % 7
  const hour = target.getHours()
  const weekhour = weekday * HOURS_PER_DAY + hour

  const expectedMonth = model.totalOperations / MONTHS_PER_YEAR
  const expectedWeekday = model.totalOperations / DAYS_PER_WEEK
  const expectedHour = model.totalOperations / HOURS_PER_DAY

  const monthFactor = smoothedFactor(model.monthCounts[month], expectedMonth)
  const weekdayFactor = smoothedFactor(model.weekdayCounts[weekday], expectedWeekday)
  const hourFactor = smoothedFactor(model.hourCounts[hour], expectedHour)

  const lambdaModel = model.globalRate * monthFactor * weekdayFactor * hourFactor

  const weekhourCount = model.weekhourCounts[weekhour]
  const lambdaWeekHour = weekhourCount / model.observedWeeks
  const weight = weekhourCount / (weekhourCount + smoothingConstant)
  const lambdaFinal = weight * lambdaWeekHour + (1 - weight) * lambdaModel

  return Math.max(Number.EPSILON, lambdaFinal / model.globalRate)
}

export function classifyAlarmIndex(index: number): { band: AlarmBand; text: string } {
  if (index < 0.7) {
    return { band: 'low', text: 'Unterdurchschnittliche Einsatzwahrscheinlichkeit' }
  }
  if (index < 1.3) {
    return { band: 'normal', text: 'Durchschnittliche Einsatzwahrscheinlichkeit' }
  }
  if (index < 2.0) {
    return { band: 'elevated', text: 'Erhöhte Einsatzwahrscheinlichkeit' }
  }
  return { band: 'high', text: 'Deutlich erhöhte Einsatzwahrscheinlichkeit' }
}
