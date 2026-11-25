// Bottom-sheet / centered dialog used for confirmations (tap outside to close).
export default function Modal({ title, text, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="font-extrabold">{title}</div>
        <p className="text-sm text-neutral-500 mt-1">{text}</p>
        <div className="grid gap-2 mt-4">{children}</div>
      </div>
    </div>
  )
}
