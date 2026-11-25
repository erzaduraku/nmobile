// Instagram redirects with ?code&state. A missing saved state must not be treated as a match.
export function oauthStateOk(saved, state) {
  if (!saved) return false
  return (state || '').replace(/#_$/, '') === saved
}
