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

// Hook për testim automatik (render i templates në headless browser)
if (location.search.includes('test')) {
  // loaded on demand so the templates are not part of the first download
  Promise.all([import('./features/templates/index.js'), import('./features/themes/themes.js'), import('./lib/canvas/draw.js')])
    .then(([{ renderTo, fontsReady, TEMPLATES }, { THEMES }, { drawLogo, drawMark }]) => { window.__nm = { renderTo, fontsReady, TEMPLATES, THEMES, drawLogo, drawMark } })
}
createRoot(document.getElementById('root')).render(<App />)
