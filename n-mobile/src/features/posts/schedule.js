// Planned posts: times are picked and shown in the shop's time zone.
export const TZ = 'Europe/Budapest'
export const MIN_AHEAD_MIN = 10 // the scheduler runs every 5 minutes

export const fmtWhen = (iso) => new Date(iso).toLocaleString('sq-AL', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Offset (ms) of TZ from UTC at a given instant
const offsetAt = (ms) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000
}
// ISO time -> "YYYY-MM-DDTHH:mm" in TZ (value of <input type="datetime-local">)
export const toLocalInput = (ms) => new Date(ms + offsetAt(ms)).toISOString().slice(0, 16)
// "YYYY-MM-DDTHH:mm" in TZ -> ISO time
export const fromLocalInput = (v) => {
  const guess = Date.parse(v + ':00Z')
  return new Date(guess - offsetAt(guess - offsetAt(guess))).toISOString()
}
export const earliest = () => Date.now() + MIN_AHEAD_MIN * 60e3
