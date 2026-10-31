import { useState } from 'react'
import { Share2, ShoppingBag, Check } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareModal from '../common/ShareModal'
import { formatPrice, truncate } from '../../utils/helpers'
import { useCart } from '../../hooks/useCart'

/**
 * Product card used in the catalog grid with:
 * - Direct click to detail
 * - Add to Cart action
 * - Share Link (unique URL) modal / action
 * - Favorite, Edit, Delete actions
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addItem(gun, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleOpenShare = (e) => {
    e.stopPropagation()
    setShowShareModal(true)
  }

  return (
    <>
      <li className="card">
        <button
          type="button"
          className="card-btn"
          onClick={() => onSelect(gun)}
          aria-label={`View ${gun.name}`}
        >
          <img
            className="card-img"
            src={imgSrc}
            alt={gun.name}
            width="240"
            height="180"
            loading="lazy"
          />

          <span className="name display">{gun.name}</span>

          <span className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </span>

          {gun.description && (
            <span className="card-desc">{truncate(gun.description, 72)}</span>
          )}

          <span className="price">{formatPrice(price)}</span>
        </button>

        {/* Quick Add to Cart & Actions row */}
        <div className="card-bottom-bar">
          <button
            type="button"
            className={`card-cart-btn ${added ? 'card-cart-btn--added' : ''}`}
            onClick={handleAddToCart}
            title="Tambah ke Keranjang"
          >
            {added ? (
              <><Check size={14} /> Di Keranjang</>
            ) : (
              <><ShoppingBag size={14} /> Beli / Cart</>
            )}
          </button>

          <div className="card-actions">
            <button
              type="button"
              className="card-act-btn"
              onClick={handleOpenShare}
              aria-label={`Bagikan tautan ${gun.name}`}
              title="Bagikan Tautan Unik"
            >
              <Share2 size={15} />
            </button>

            <FavoriteButton gunId={gun.id || gun.name} />

            {onEdit && (
              <button
                type="button"
                className="card-act-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(gun)
                }}
                aria-label={`Edit ${gun.name}`}
                title="Edit"
              >
                ✏️
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                className="card-act-btn card-act-btn--danger"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(gun)
                }}
                aria-label={`Delete ${gun.name}`}
                title="Hapus / Soft Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </li>

      <ShareModal
        open={showShareModal}
        gun={gun}
        onClose={() => setShowShareModal(false)}
      />
    </>
  )
}
