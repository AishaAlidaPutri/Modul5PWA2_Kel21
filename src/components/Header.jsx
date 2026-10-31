import { Plus, ShoppingBag } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useCart } from '../hooks/useCart'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Favorites', label: 'Favorites', hasBadge: true },
  { id: 'Profile', label: 'Profile' },
]

function Header({ tab, onTab, onNavigateCreate, onOpenCart }) {
  const { favorites } = useFavorites()
  const { count: cartCount } = useCart()
  const favCount = favorites ? favorites.length : 0

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="header-right-actions">
        {/* Cart Button */}
        <button
          type="button"
          className="header-cart-btn"
          onClick={onOpenCart}
          title="Keranjang Pemesanan (WhatsApp Checkout)"
          aria-label="Buka Keranjang"
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="header-cart-badge">{cartCount}</span>
          )}
        </button>

        {onNavigateCreate && (
          <button
            type="button"
            className="btn btn--primary btn--sm header-cta"
            onClick={onNavigateCreate}
            title="Register new hardware"
          >
            <Plus size={15} /> Add Hardware
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
