// ---------------------------------------------------------------------------
// cartService.js — Local-first cart storage with WhatsApp order generation.
// ---------------------------------------------------------------------------

const CART_STORAGE_KEY = 'bore_barrel_cart'
const DEFAULT_WA_PHONE = '082284911909' // Default seller WhatsApp phone number

class CartService {
  constructor() {
    this.listeners = new Set()
  }

  /**
   * Subscribe to cart changes.
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify() {
    const items = this.getItems()
    this.listeners.forEach((cb) => {
      try {
        cb(items)
      } catch (err) {
        console.error('Cart listener error:', err)
      }
    })
  }

  /**
   * Get all items currently in cart.
   * @returns {Array}
   */
  getItems() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  /**
   * Save items to storage and notify subscribers.
   */
  saveItems(items) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.error('Failed to save cart:', err)
    }
    this.notify()
  }

  /**
   * Add a gun/product to cart.
   * @param {Object} gun
   * @param {number} quantity
   */
  addItem(gun, quantity = 1) {
    if (!gun) return
    const items = this.getItems()
    const gunId = String(gun.id || gun.name)
    const existingIndex = items.findIndex((i) => String(i.id) === gunId)

    if (existingIndex > -1) {
      items[existingIndex].quantity += Number(quantity) || 1
    } else {
      items.push({
        id: gunId,
        gunId: gun.id,
        name: gun.name || 'Hardware Piece',
        type: gun.type || gun.category || 'Hardware',
        caliber: gun.caliber || '',
        price: Number(gun.price ?? gun.cook_time ?? 0),
        image_url: gun.image_url || gun.image || '/guns/pistol.svg',
        quantity: Math.max(1, Number(quantity) || 1),
      })
    }

    this.saveItems(items)
    return items
  }

  /**
   * Update quantity of a specific item in cart.
   */
  updateQuantity(gunId, newQuantity) {
    const items = this.getItems()
    const targetId = String(gunId)
    const index = items.findIndex((i) => String(i.id) === targetId)

    if (index > -1) {
      if (newQuantity <= 0) {
        items.splice(index, 1)
      } else {
        items[index].quantity = newQuantity
      }
      this.saveItems(items)
    }
    return items
  }

  /**
   * Remove an item from cart completely.
   */
  removeItem(gunId) {
    const items = this.getItems()
    const targetId = String(gunId)
    const filtered = items.filter((i) => String(i.id) !== targetId)
    this.saveItems(filtered)
    return filtered
  }

  /**
   * Clear all items in cart.
   */
  clearCart() {
    this.saveItems([])
  }

  /**
   * Total number of individual items in cart.
   */
  getCount() {
    const items = this.getItems()
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  }

  /**
   * Total price of items in cart.
   */
  getTotal() {
    const items = this.getItems()
    return items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0,
    )
  }

  /**
   * Format currency for order summary.
   */
  formatCurrency(amount) {
    const num = Number(amount) || 0
    return `$${num.toLocaleString()}`
  }

  /**
   * Generate WhatsApp checkout URL with custom pre-filled message.
   * Starts with "Hi aku mau pesan..".
   *
   * @param {Object} options
   * @param {string} [options.phone]        WhatsApp recipient phone number
   * @param {string} [options.customerName] Customer name/callsign
   * @param {string} [options.notes]        Additional notes
   * @returns {string} wa.me URL
   */
  generateWhatsAppUrl({ phone, customerName = 'Shooter', notes = '' } = {}) {
    const items = this.getItems()
    if (items.length === 0) return ''

    let cleanPhone = (phone || DEFAULT_WA_PHONE).replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    }

    let message = 'Hi aku mau pesan..\n\n'
    message += '📋 *DETAIL PESANAN HARWARE:*\n'

    items.forEach((item, index) => {
      const itemSubtotal = (Number(item.price) || 0) * item.quantity
      const cal = item.caliber ? ` (${item.caliber})` : ''
      message += `${index + 1}. *${item.name}*${cal}\n`
      message += `   Qty: ${item.quantity} x ${this.formatCurrency(item.price)} = ${this.formatCurrency(itemSubtotal)}\n`
    })

    const total = this.getTotal()
    message += `\n💰 *Total Pembayaran:* ${this.formatCurrency(total)}\n`
    message += `👤 *Nama Pemesan:* ${customerName.trim() || 'Shooter'}\n`

    if (notes && notes.trim()) {
      message += `📝 *Catatan Tambahan:* ${notes.trim()}\n`
    }

    message += '\nMohon konfirmasi ketersediaan stok & prosedur pengiriman. Terima kasih!'

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  }
}

const cartService = new CartService()
export default cartService
