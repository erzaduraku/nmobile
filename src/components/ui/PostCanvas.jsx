import { useEffect, useRef } from 'react'
import { renderTo } from '../../features/templates/index.js'

export default function PostCanvas({ tpl, type, theme, data, scale = 0.3, className = '', ready }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ready || !ref.current) return
    const id = requestAnimationFrame(() => renderTo(ref.current, tpl, type, theme, data, scale))
    return () => cancelAnimationFrame(id)
  }, [tpl, type, theme, data, scale, ready])
  return <canvas ref={ref} className={`w-full h-auto block ${className}`} />
}
