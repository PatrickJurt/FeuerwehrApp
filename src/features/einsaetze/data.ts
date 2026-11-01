import { parseOperations } from './parser.ts'
import type { Operation } from './types.ts'

const files = import.meta.glob('./data/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function loadOperations(): Operation[] {
  const all: Operation[] = []
  for (const [path, content] of Object.entries(files)) {
    const { operations, invalidLines } = parseOperations(content)
    if (invalidLines.length > 0) {
      console.warn(`Ignored ${invalidLines.length} invalid line(s) in ${path}`, invalidLines)
    }
    all.push(...operations)
  }
  return all.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const operations: Operation[] = loadOperations()
