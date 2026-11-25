import { useState } from 'react'
import { Save, Check, Loader2, ChevronDown, X, ImagePlus, Cpu, HardDrive, Camera, BatteryFull, Smartphone } from 'lucide-react'
import { SWATCHES } from './fields.js'
import { prepPhoto, blobToDataURL } from '../../lib/photoStore.js'
import OptionChips from '../../components/ui/OptionChips.jsx'
import { optionText, sameOption } from './options.js'
import { REGIONS, templateFields } from '../templates/index.js'
import { SPEC_FIELDS, normField } from './specFields.js'
const ICONS = { ram: Cpu, storage: HardDrive, camera: Camera, battery: BatteryFull, screen: Smartphone }

const colorHexFor = (name) => {
  const known = SWATCHES.find(([n]) => sameOption(n, name))
  if (known) return known[1]
  let hash = 0
  for (const ch of optionText(name)) hash = (hash * 31 + ch.codePointAt(0)) >>> 0
  return SWATCHES[hash % SWATCHES.length][1]
}
const colorOption = (text) => {
  const t = optionText(text)
  const match = t.match(/^(.*?)\s*#\s*([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  const name = (match ? match[1] : t).trim()
  return { name: name || t, hex: match ? '#' + match[2] : colorHexFor(name || t) }
}

export default function DetailsTab({ ed }) {
  const { cta, info, model, offer, price, setCta, setInfo, setModel, setOffer, setPrice, specF, setSpecField, code, setCode, region, setRegion, noActive, setNoActive, saveDraft, draftState, x, setX, tpl, type, optionSets, replaceOptions } = ed
  // Only inputs the selected template draws (values stay in state when switching templates)
  const has = (k) => fs.has(k), fs = templateFields(tpl, type)
  const anyMore = ['title', 'slogan', 'badge', 'colors', 'spec', 'meta', 'photo2', 'info'].some(has)
  const [more, setMore] = useState(false)
  const notes = x.notes || [], colors = x.colors || []
  const known = REGIONS.some((r) => r.id === region)
  const sel = !region ? '' : known ? region : '__custom'
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label">Seria</label><input className="field" value={x.series} onChange={(e) => setX('series', e.target.value)} placeholder="Galaxy" /></div>
        <div className="col-span-2"><label className="label">Modeli</label><input className="field" value={model} onChange={(e) => setModel(e.target.value)} placeholder="p.sh. S26 Ultra" /></div>
      </div>
      {has('meta') && <div><label className="label">Kapaciteti (opsional)</label>
        <OptionChips label="Kapaciteti" options={optionSets.capacity} value={x.capacity} onPick={(v) => setX('capacity', v)} makeOption={(s) => s.toUpperCase()} onSave={(list) => replaceOptions('capacity', list)} placeholder="Shto kapacitet" />
        <input className="field" value={x.capacity} onChange={(e) => setX('capacity', e.target.value.toUpperCase())} placeholder="p.sh. 512GB" />
      </div>}
      <div className={`grid gap-3 ${has('oldPrice') ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div><label className="label">Çmimi (opsional)</label><input className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="p.sh. 899" /></div>
        {has('oldPrice') && <div><label className="label">Çmimi i vjetër</label><input className="field" inputMode="decimal" value={x.oldPrice} onChange={(e) => setX('oldPrice', e.target.value)} placeholder="p.sh. 1099" /></div>}
      </div>
      {has('offer') && <div><label className="label">Ofertë (opsionale)</label><input className="field" value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="p.sh. -20%" /></div>}
      <div><label className="label">Teksti i butonit</label>
        <OptionChips label="Teksti i butonit" options={optionSets.cta} value={cta} onPick={setCta} onSave={(list) => replaceOptions('cta', list)} />
        <input className="field" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Bli tani!" />
      </div>
      {anyMore && <button type="button" onClick={() => setMore(!more)} className="w-full min-h-[48px] flex items-center justify-between rounded-xl bg-neutral-100 px-4 font-bold">Më shumë detaje <ChevronDown className={`transition ${more ? 'rotate-180' : ''}`} /></button>}
      {anyMore && more && <div className="space-y-4">
      {has('title') && <div><label className="label">Titulli sipër (opsional)</label>
        <OptionChips label="Titulli" options={optionSets.title} value={x.title} onPick={(v) => setX('title', v)} onSave={(list) => replaceOptions('title', list)} />
        <input className="field" value={x.title} onChange={(e) => setX('title', e.target.value)} placeholder="p.sh. SUPER OFERTA NË N MOBILE!" />
      </div>}
      {has('slogan') && <div><label className="label">Slogani (opsional)</label><input className="field" value={x.slogan} onChange={(e) => setX('slogan', e.target.value)} placeholder="p.sh. Fuqia e AI në duart e tua" /></div>}
      {has('badge') && <div><label className="label">Shenja e serisë (opsionale)</label>
        <OptionChips label="Shenja e serisë" options={optionSets.badge} value={x.seriesBadge} onPick={(v) => setX('seriesBadge', v)} onSave={(list) => replaceOptions('badge', list)} />
        <input className="field" value={x.seriesBadge} onChange={(e) => setX('seriesBadge', e.target.value)} placeholder="p.sh. Galaxy AI" />
      </div>}
      {has('colors') && <div className="rounded-2xl border-2 border-neutral-200 p-3">
        <div className="font-bold mb-2">Ngjyrat</div>
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-full border-2 border-neutral-200 shrink-0" style={{ background: c.hex }} />
            <input className="field !py-2 !text-base flex-1" value={c.name} onChange={(e) => setX('colors', colors.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
            <input className="field !py-2 !text-base w-24" value={c.delta || ''} onChange={(e) => setX('colors', colors.map((y, j) => (j === i ? { ...y, delta: e.target.value } : y)))} placeholder="+50€" aria-label="Diferenca e çmimit" />
            <button type="button" className="w-11 h-11 grid place-items-center rounded-full bg-neutral-100" onClick={() => setX('colors', colors.filter((_, j) => j !== i))} aria-label="Hiq ngjyrën"><X size={18} /></button>
          </div>))}
        {colors.length < 4 && <OptionChips
          label="Ngjyrat"
          options={optionSets.colors}
          value={colors.map((c) => c.name)}
          multiple
          onPick={(names, o) => {
            const name = optionText(o)
            if (names.length < colors.length) setX('colors', colors.filter((c) => names.some((n) => sameOption(c.name, n))))
            else if (colors.length < 4) setX('colors', [...colors, { name, hex: o?.hex || colorHexFor(name), delta: '' }])
          }}
          makeOption={colorOption}
          onSave={(list) => replaceOptions('colors', list)}
          renderOption={(o) => <><span className="w-6 h-6 rounded-full border" style={{ background: o.hex || colorHexFor(optionText(o)) }} />{optionText(o)}</>}
          placeholder="p.sh. Blu #2F5D9B"
        />}
      </div>}

      {has('spec') && <div className="rounded-2xl border-2 border-neutral-200 p-3 space-y-3" data-spec-section>
        <div className="flex items-baseline justify-between"><span className="font-bold">Specifikat</span><span className="text-xs text-neutral-400">opsionale, deri në 4 në foto</span></div>
        {SPEC_FIELDS.map((f) => { const I = ICONS[f.id], v = specF[f.id] || '', nv = normField(f.id, v), opts = optionSets['spec.' + f.id] || f.picks, picked = opts.some((o) => sameOption(o, nv)); return (
          <div key={f.id}>
            <div className="flex items-center gap-2 mb-1"><I size={16} className="text-brand" /><span className="text-sm font-semibold text-neutral-600">{f.label}</span></div>
            <OptionChips
              label={f.label}
              variant="compact"
              options={opts}
              value={nv}
              onPick={(val) => setSpecField(f.id, val)}
              makeOption={(s) => normField(f.id, s)}
              onSave={(list) => replaceOptions('spec.' + f.id, list)}
            />
            <input className={`shrink-0 w-24 rounded-full border-2 px-3 py-1.5 text-sm outline-none focus:border-brand ${v && !picked ? 'border-brand' : 'border-neutral-200'}`} value={picked ? '' : v} onChange={(e) => setSpecField(f.id, e.target.value)} placeholder="Tjetër" aria-label={f.label + ' tjetër'} />
          </div>) })}
        {specF.extra && <div><label className="label">Të tjera</label><input className="field" value={specF.extra} onChange={(e) => setSpecField('extra', e.target.value)} /></div>}
      </div>}
      {has('meta') && <>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Kodi i modelit (opsional)</label><input className="field" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="p.sh. A3717" /></div>
        <div><label className="label">Versioni / Rajoni</label>
          <select className="field bg-white" value={sel} onChange={(e) => setRegion(e.target.value === '__custom' ? ' ' : e.target.value)}>
            <option value="">Pa version</option>
            {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            <option value="__custom">Tjetër…</option>
          </select>
        </div>
      </div>
      {sel === '__custom' && <input className="field" value={region.trim()} onChange={(e) => setRegion(e.target.value || ' ')} placeholder="Shkruaj versionin, p.sh. ZA/A" />}
      <button type="button" onClick={() => setNoActive(!noActive)} className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left ${noActive ? 'border-brand bg-red-50' : 'border-neutral-200'}`}>
        <span><span className="font-bold block">No Active</span><span className="text-sm text-neutral-500">Pajisje e re, e paaktivizuar</span></span>
        <span className={`w-12 h-7 rounded-full relative transition ${noActive ? 'bg-brand' : 'bg-neutral-300'}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${noActive ? 'left-6' : 'left-1'}`} /></span>
      </button>
      <div><label className="label">Gjendja</label>
        <OptionChips label="Gjendja" options={optionSets.condition} value={x.condition} onPick={(v) => setX('condition', v)} onSave={(list) => replaceOptions('condition', list)} />
      </div>
      <div><label className="label">Shënime</label>
        <OptionChips label="Shënimet" options={optionSets.notes} value={notes} multiple icons onPick={(v) => setX('notes', v)} onSave={(list) => replaceOptions('notes', list)} />
      </div>
      </>}
      {has('photo2') && <div><label className="label">Foto e dytë</label>
        <div className="flex gap-2"><label className="btn-light flex-1 flex items-center justify-center gap-2 cursor-pointer"><ImagePlus size={18} /> {x.photo2 ? 'Ndrysho' : 'Ngarko'}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setX('photo2', await blobToDataURL(await prepPhoto(f))); e.target.value = '' }} /></label>
        {x.photo2 && <button type="button" className="btn-light !w-auto px-4" onClick={() => setX('photo2', '')} aria-label="Hiq foton e dytë"><X size={18} /></button>}</div></div>}
      {has('info') && <div><label className="label">Garancioni / info (opsionale)</label><input className="field" value={info} onChange={(e) => setInfo(e.target.value)} placeholder="p.sh. Të ri në pako, 1 vit garancion" /></div>}
      </div>}
      <button type="button" onClick={() => saveDraft(false)} className="btn-light flex items-center justify-center gap-2">
        {draftState === 'saving' ? <Loader2 size={18} className="animate-spin" /> : draftState === 'saved' ? <Check size={18} /> : <Save size={18} />}
        {draftState === 'saved' ? 'Drafti u ruajt' : 'Ruaj si draft'}
      </button>
      <p className="text-xs text-neutral-400 text-center -mt-2">Ndryshimet ruhen vetë si draft.</p>
    </div>
  )
}
