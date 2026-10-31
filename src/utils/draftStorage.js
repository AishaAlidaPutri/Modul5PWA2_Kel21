// ---------------------------------------------------------------------------
// draftStorage.js — auto-save / restore form drafts via localStorage.
//
// Drafts are keyed by a string id:
//   'create'              → the Create form
//   '<uuid>'              → the Edit form for a specific product
//
// Each draft is stored under  `gun_draft_<id>`  and its companion
// timestamp under  `gun_draft_<id>_ts`.
// ---------------------------------------------------------------------------

const PREFIX = 'gun_draft_'
const TS_SUFFIX = '_ts'

/**
 * Persist a draft object.
 * @param {Object} draftData — arbitrary JSON-serializable form state
 * @param {string} draftId   — 'create' or a product UUID
 * @returns {boolean} true on success
 */
export const saveDraft = (draftData, draftId = 'create') => {
  try {
    const key = `${PREFIX}${draftId}`
    const ts = new Date().toISOString()
    localStorage.setItem(key, JSON.stringify({ ...draftData, savedAt: ts }))
    localStorage.setItem(`${key}${TS_SUFFIX}`, ts)
    return true
  } catch {
    return false
  }
}

/**
 * Load a previously saved draft.
 * @returns {Object|null}
 */
export const loadDraft = (draftId = 'create') => {
  try {
    const raw = localStorage.getItem(`${PREFIX}${draftId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Remove a draft and its timestamp from storage.
 */
export const deleteDraft = (draftId = 'create') => {
  try {
    const key = `${PREFIX}${draftId}`
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}${TS_SUFFIX}`)
    return true
  } catch {
    return false
  }
}

/**
 * Check whether a draft exists.
 */
export const hasDraft = (draftId = 'create') => {
  try {
    return localStorage.getItem(`${PREFIX}${draftId}`) !== null
  } catch {
    return false
  }
}

/**
 * Return the ISO-8601 timestamp string of the last save, or null.
 */
export const getDraftTimestamp = (draftId = 'create') => {
  try {
    return localStorage.getItem(`${PREFIX}${draftId}${TS_SUFFIX}`)
  } catch {
    return null
  }
}

/**
 * Human-readable "time ago" label for a draft timestamp.
 */
export const formatDraftTime = (timestamp) => {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Return all existing draft ids.
 */
export const getAllDraftIds = () => {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX) && !k.endsWith(TS_SUFFIX))
      .map((k) => k.slice(PREFIX.length))
  } catch {
    return []
  }
}

/**
 * Return all drafts with structured preview data.
 */
export const getAllDrafts = () => {
  try {
    const ids = getAllDraftIds()
    return ids
      .map((id) => {
        const data = loadDraft(id)
        if (!data) return null
        const formData = data.formData || data
        const timestamp = getDraftTimestamp(id) || data.savedAt

        return {
          id,
          isCreate: id === 'create',
          name: formData.name || (id === 'create' ? 'New Weapon Draft' : `Weapon Modification #${id.substring(0, 6)}`),
          type: formData.type || formData.category || 'Pistol',
          caliber: formData.caliber || '',
          price: formData.price ?? formData.cook_time ?? 0,
          description: formData.description || '',
          imagePreview: data.imagePreview || formData.image_url || null,
          specsCount: Array.isArray(data.specs) ? data.specs.length : 0,
          stepsCount: Array.isArray(data.steps) ? data.steps.length : 0,
          timestamp,
          timeAgo: formatDraftTime(timestamp),
          raw: data,
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
  } catch {
    return []
  }
}

/**
 * Remove every gun draft from storage.
 */
export const clearAllDrafts = () => {
  getAllDraftIds().forEach(deleteDraft)
}
