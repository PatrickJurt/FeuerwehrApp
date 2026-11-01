const dateFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatDateTime = (date: Date): string => `${dateFormat.format(date)} Uhr`

export const toInputDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const toInputTime = (date: Date): string =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

export function fromInputDate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fromInputDateTime(dateValue: string, timeValue: string): Date | null {
  const date = fromInputDate(dateValue)
  if (!date) return null
  const [hours, minutes] = timeValue.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.min(23, Math.max(0, hours)),
    Math.min(59, Math.max(0, minutes)),
  )
}
