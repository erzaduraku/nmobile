import { Loader2 } from 'lucide-react'

// Small brand-red spinner shown while a lazily loaded screen is downloading.
export default function Spinner({ full = false }) {
  return (
    <div className={full ? 'h-full grid place-items-center' : 'py-10 grid place-items-center'}>
      <Loader2 size={28} className="animate-spin text-brand" aria-label="Duke u ngarkuar" />
    </div>
  )
}
