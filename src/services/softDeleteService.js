// ---------------------------------------------------------------------------
// softDeleteService.js — Soft delete management with recovery & permanent purge.
// ---------------------------------------------------------------------------

const SOFT_DELETE_KEY = 'bore_barrel_soft_deleted'

class SoftDeleteService {
  constructor() {
    this.listeners = new Set()
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify() {
    const list = this.getDeletedGuns()
    this.listeners.forEach((cb) => {
      try {
        cb(list)
      } catch (err) {
        console.error('SoftDelete listener error:', err)
      }
    })
  }

  /**
   * Get all soft-deleted items.
   * @returns {Array}
   */
  getDeletedGuns() {
    try {
      const raw = localStorage.getItem(SOFT_DELETE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  /**
   * Save deleted list.
   */
  saveDeleted(list) {
    try {
      localStorage.setItem(SOFT_DELETE_KEY, JSON.stringify(list))
    } catch (err) {
      console.error('Failed to save soft-delete storage:', err)
    }
    this.notify()
  }

  /**
   * Check if a specific gun ID is soft-deleted.
   */
  isDeleted(gunId) {
    if (!gunId) return false
    const list = this.getDeletedGuns()
    const targetId = String(gunId)
    return list.some((g) => String(g.id) === targetId || String(g.name) === targetId)
  }

  /**
   * Move a gun into soft-delete trash.
   * @param {Object} gun
   */
  softDeleteGun(gun) {
    if (!gun) return
    const list = this.getDeletedGuns()
    const gunId = String(gun.id || gun.name)

    // Remove if already present
    const filtered = list.filter((g) => String(g.id || g.name) !== gunId)

    filtered.unshift({
      ...gun,
      id: gun.id || `local-${Date.now()}`,
      deleted_at: new Date().toISOString(),
    })

    this.saveDeleted(filtered)
    return filtered
  }

  /**
   * Restore a soft-deleted item back to active inventory.
   * @param {string|number} gunId
   */
  restoreGun(gunId) {
    const list = this.getDeletedGuns()
    const targetId = String(gunId)
    const restoredItem = list.find((g) => String(g.id || g.name) === targetId)
    const filtered = list.filter((g) => String(g.id || g.name) !== targetId)
    this.saveDeleted(filtered)
    return { restoredItem, remaining: filtered }
  }

  /**
   * Restore all soft-deleted items.
   */
  restoreAll() {
    const list = this.getDeletedGuns()
    this.saveDeleted([])
    return list
  }

  /**
   * Permanently purge an item from trash.
   */
  permanentDeleteGun(gunId) {
    const list = this.getDeletedGuns()
    const targetId = String(gunId)
    const filtered = list.filter((g) => String(g.id || g.name) !== targetId)
    this.saveDeleted(filtered)
    return filtered
  }

  /**
   * Empty trash completely.
   */
  emptyTrash() {
    this.saveDeleted([])
  }

  /**
   * Count of soft-deleted items.
   */
  getCount() {
    return this.getDeletedGuns().length
  }
}

const softDeleteService = new SoftDeleteService()
export default softDeleteService
