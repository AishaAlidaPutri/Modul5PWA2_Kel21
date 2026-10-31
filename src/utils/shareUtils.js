// ---------------------------------------------------------------------------
// shareUtils.js — Unique link generation and social sharing utilities.
// ---------------------------------------------------------------------------

/**
 * Generate a unique, shareable URL for a firearm item.
 * @param {Object} gun
 * @returns {string} Unique URL
 */
export const getGunShareUrl = (gun) => {
  if (!gun) return window.location.href
  const identifier = gun.id || gun.name
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}?gun=${encodeURIComponent(identifier)}`
}

/**
 * Copy unique link to clipboard with fallback.
 * @param {Object} gun
 * @returns {Promise<boolean>}
 */
export const copyGunShareLink = async (gun) => {
  const url = getGunShareUrl(gun)
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url)
      return true
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Failed to copy link:', err)
    return false
  }
}

/**
 * Share gun via Web Share API or copy to clipboard.
 * @param {Object} gun
 * @returns {Promise<{ shared: boolean, copied: boolean }>}
 */
export const shareGun = async (gun) => {
  if (!gun) return { shared: false, copied: false }
  const url = getGunShareUrl(gun)
  const title = `${gun.name} · Bore & Barrel Armory`
  const text = `Check out ${gun.name} (${gun.type || 'Firearm'} · ${gun.caliber || 'Standard'}) on Bore & Barrel!`

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return { shared: true, copied: false }
    } catch (err) {
      if (err.name !== 'AbortError') {
        const copied = await copyGunShareLink(gun)
        return { shared: false, copied }
      }
      return { shared: false, copied: false }
    }
  }

  const copied = await copyGunShareLink(gun)
  return { shared: false, copied }
}

/**
 * Generate direct WhatsApp share link for hardware piece.
 */
export const getWhatsAppGunShareUrl = (gun) => {
  const url = getGunShareUrl(gun)
  const text = `Lihat ${gun.name} (${gun.type || 'Firearm'}, ${gun.caliber || ''}) di Bore & Barrel:\n${url}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/**
 * Generate Twitter / X share link.
 */
export const getTwitterGunShareUrl = (gun) => {
  const url = getGunShareUrl(gun)
  const text = `${gun.name} (${gun.type || 'Hardware'}) - Bore & Barrel Armory`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}
