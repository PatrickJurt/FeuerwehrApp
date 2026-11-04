import { AlarmIndexTool } from '../einsaetze/components/AlarmIndexTool.tsx'
import { operations } from '../einsaetze/data.ts'

export function AlarmIndexSection() {
  return (
    <div className="section alarm-index-page">
      <h1>Alarmindex</h1>
      <AlarmIndexTool operations={operations} />
    </div>
  )
}
