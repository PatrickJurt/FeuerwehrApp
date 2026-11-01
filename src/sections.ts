import type { ComponentType } from 'react'
import { EinsaetzeSection } from './features/einsaetze/EinsaetzeSection.tsx'

export interface Section {
  id: string
  title: string
  description: string
  icon: string
  component: ComponentType
}

export const sections: Section[] = [
  {
    id: 'einsaetze',
    title: 'Einsätze',
    description: 'Statistiken zu den Einsätzen der Feuerwehr',
    icon: '🚒',
    component: EinsaetzeSection,
  },
]
