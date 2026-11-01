import type { Operation } from './types.ts'

const LINE_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})\s*Uhr\s*;\s*(.+)$/

export interface ParseResult {
  operations: Operation[]
  invalidLines: string[]
}

export function parseLine(line: string): Operation | null {
  const match = LINE_PATTERN.exec(line.trim())
  if (!match) return null
  const [, day, month, year, hour, minute, description] = match
  const date = new Date(+year, +month - 1, +day, +hour, +minute)
  const valid =
    date.getFullYear() === +year &&
    date.getMonth() === +month - 1 &&
    date.getDate() === +day &&
    date.getHours() === +hour &&
    date.getMinutes() === +minute
  return valid ? { date, description: description.trim() } : null
}

export function parseOperations(content: string): ParseResult {
  const operations: Operation[] = []
  const invalidLines: string[] = []
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue
    const operation = parseLine(line)
    if (operation) operations.push(operation)
    else invalidLines.push(line)
  }
  return { operations, invalidLines }
}
