import { Camera, LayoutTemplate, Palette, PenLine, Send, History, Home, Settings } from 'lucide-react'

// Bottom tab bar definition (order = the guided flow)
export const TABS = [
  { id: 'foto', name: 'Foto', icon: Camera },
  { id: 'template', name: 'Template', icon: LayoutTemplate },
  { id: 'tema', name: 'Tema', icon: Palette },
  { id: 'detajet', name: 'Detajet', icon: PenLine },
  { id: 'posto', name: 'Eksporto', icon: Send },
]

// Bottom navigation (outside the editor)
export const NAV = [
  { id: 'home', name: 'Kryefaqja', icon: Home },
  { id: 'posts', name: 'Postimet', icon: History },
  { id: 'settings', name: 'Cilësime', icon: Settings },
]
