import { Camera } from 'lucide-react'

export default function PhotoTab({ ed }) {
  const { img, onPhoto, type } = ed
  return (
          <div className="pt-6 text-center">
            <h1 className="text-2xl font-extrabold font-display">Krijo një postim</h1>
            <p className="text-neutral-500 mt-2 mb-8">Bëj foto telefonit që po shet ose zgjidhe nga galeria.</p>
            <label className="btn-red !py-10 flex flex-col items-center gap-3 cursor-pointer text-2xl">
              <Camera size={56} strokeWidth={1.8} /> {img ? 'Ndrysho foton' : 'Ngarko foto'}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>
  )
}
