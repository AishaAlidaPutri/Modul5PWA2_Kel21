import { useState } from 'react'
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import userService from '../../services/userService'
import { formatPrice } from '../../utils/helpers'

export default function CartDrawer({ open, onClose, onNavigateCatalog }) {
  const {
    items,
    count,
    total,
    updateQuantity,
    removeItem,
    clearCart,
    getWhatsAppUrl,
  } = useCart()

  const [profile] = useState(() => userService.getUserProfile())
  const [customerName, setCustomerName] = useState(profile.username || 'Shooter')
  const [waPhone, setWaPhone] = useState('082284911909') // Default seller/personal WA
  const [orderNotes, setOrderNotes] = useState('')
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  if (!open) return null

  const handleCheckout = () => {
    if (items.length === 0) return

    const waUrl = getWhatsAppUrl({
      phone: waPhone,
      customerName: customerName.trim() || 'Shooter',
      notes: orderNotes.trim(),
    })

    if (waUrl) {
      window.open(waUrl, '_blank')
      setCheckoutSuccess(true)
      setTimeout(() => {
        setCheckoutSuccess(false)
      }, 5000)
    }
  }

  return (
    <div className="cart-backdrop" onClick={onClose}>
      <aside
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Procurement Cart"
      >
        {/* Drawer Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} stroke="var(--brass)" />
            <h2>Procurement Cart</h2>
            <span className="cart-badge-count">{count}</span>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {checkoutSuccess && (
          <div className="toast toast--success" style={{ margin: '12px 16px' }}>
            <Check size={18} /> Pesanan dialihkan ke WhatsApp! Periksa tab baru.
            <button
              type="button"
              className="btn btn--outline btn--sm"
              style={{ marginLeft: 'auto' }}
              onClick={clearCart}
            >
              Kosongkan Keranjang
            </button>
          </div>
        )}

        {/* Drawer Body */}
        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} stroke="var(--steel)" opacity={0.5} />
              <h3>Keranjang Anda Kosong</h3>
              <p>Belum ada hardware atau firearm yang ditambahkan.</p>
              {onNavigateCatalog && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    onClose()
                    onNavigateCatalog()
                  }}
                >
                  Jelajahi Katalog <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-meta">
                      {item.type} {item.caliber ? `· ${item.caliber}` : ''}
                    </span>
                    <span className="cart-item-price">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  <div className="cart-item-stepper">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Kurangi jumlah"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="stepper-val">{item.quantity}</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Tambah jumlah"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => removeItem(item.id)}
                    title="Hapus dari keranjang"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Checkout Configuration Form */}
          {items.length > 0 && (
            <div className="cart-form-section">
              <h4 className="cart-section-title">
                <ShieldCheck size={16} stroke="var(--brass)" /> Data Pemesan & Kontak WA
              </h4>

              <div className="form-group">
                <label className="form-label" htmlFor="cart-customer-name">
                  Nama Pemesan / Callsign
                </label>
                <input
                  id="cart-customer-name"
                  type="text"
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Operator Delta / Budi"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cart-wa-phone">
                  Nomor WhatsApp Tujuan (Seller)
                </label>
                <input
                  id="cart-wa-phone"
                  type="tel"
                  className="form-input"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="e.g. 082284911909"
                />
                <span className="form-hint">
                  Pesan order akan otomatis dikirimkan ke nomor WhatsApp di atas.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cart-order-notes">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="cart-order-notes"
                  className="form-textarea"
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Spesifikasi khusus, warna, opsi pengiriman..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total Pembayaran:</span>
              <span className="cart-total-val">{formatPrice(total)}</span>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--checkout"
              onClick={handleCheckout}
            >
              <MessageCircle size={18} /> Checkout via WhatsApp
            </button>

            <button
              type="button"
              className="btn-clear-cart"
              onClick={clearCart}
            >
              Kosongkan Keranjang
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
