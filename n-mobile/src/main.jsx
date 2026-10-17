import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import '@fontsource/montserrat/900.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/700-italic.css'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/barlow-condensed/800-italic.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700-italic.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './index.css'
import App from './app/App.jsx'
import { renderTo, fontsReady, TEMPLATES } from './features/templates/index.js'
import { THEMES } from './features/themes/themes.js'
import { drawLogo, drawMark } from './lib/canvas/draw.js'

// Hook për testim automatik (render i templates në headless browser)
if (location.search.includes('test')) {
  window.__nm = { renderTo, fontsReady, TEMPLATES, THEMES, drawLogo, drawMark }
}
createRoot(document.getElementById('root')).render(<App />)
