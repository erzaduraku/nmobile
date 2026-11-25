import { useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'

// Fullscreen image viewer. Closes on X, backdrop tap or Escape; locks body scroll while open.
// `src` can be null while the full-size image is still rendering (shows a spinner).
export default function ImageLightbox({ src, alt = '', onClose }) {
  const close = useRef(onClose); close.current = onClose
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close.current()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/90 overflow-auto" style={{ touchAction: 'pinch-zoom' }} onClick={onClose}>
      <div className="min-h-full flex items-center justify-center" style={{ padding: 'calc(16px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left))' }}>
        {src
          ? <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} className="block max-w-full object-contain rounded-lg shadow-2xl" style={{ maxHeight: 'calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }} />
          : <Loader2 size={36} className="animate-spin text-white" />}
      </div>
      <button onClick={onClose} aria-label="Mbyll" className="fixed w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white grid place-items-center" style={{ top: 'calc(12px + env(safe-area-inset-top))', right: 'calc(12px + env(safe-area-inset-right))' }}>
        <X size={24} />
      </button>
    </div>
  )
}
