import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import EditProfilePage from './pages/EditProfilePage.jsx'
import CreateGunPage from './pages/CreateGunPage.jsx'
import EditGunPage from './pages/EditGunPage.jsx'
import GunDetail from './components/gun/GunDetail.jsx'
import CartDrawer from './components/cart/CartDrawer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import softDeleteService from './services/softDeleteService.js'
import GUNS_LOCAL from './data/guns.js'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'edit-profile'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  // Listen for unique gun links in URL (e.g. ?gun=Glock%2017 or ?gun=123)
  useEffect(() => {
    const handleCheckUrlParam = () => {
      const params = new URLSearchParams(window.location.search)
      const gunQuery = params.get('gun')
      if (gunQuery) {
        // Try server lookup
        gunService
          .getGunById(gunQuery)
          .then((res) => {
            if (res?.data) {
              setSelectedGun(res.data)
              setMode('detail')
            }
          })
          .catch(() => {
            // Fallback to local list
            const local = GUNS_LOCAL.find(
              (g) => String(g.id) === gunQuery || g.name.toLowerCase() === gunQuery.toLowerCase(),
            )
            if (local) {
              setSelectedGun({ ...local, id: local.id || gunQuery })
              setMode('detail')
            }
          })
      }
    }

    handleCheckUrlParam()
    window.addEventListener('popstate', handleCheckUrlParam)
    return () => window.removeEventListener('popstate', handleCheckUrlParam)
  }, [])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      // Update browser URL query param for unique share link
      const gunId = payload.id || payload.name
      if (gunId) {
        window.history.pushState(
          { gunId },
          '',
          `${window.location.pathname}?gun=${encodeURIComponent(gunId)}`,
        )
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('edit-profile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      if (window.location.search.includes('gun=')) {
        window.history.pushState(null, '', window.location.pathname)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
    if (window.location.search.includes('gun=')) {
      window.history.pushState(null, '', window.location.pathname)
    }
  }

  const handleOpenDraft = (draft) => {
    if (draft.isCreate) {
      setMode('create')
    } else {
      setEditingGun(draft.raw?.formData ? { ...draft.raw.formData, id: draft.id } : { id: draft.id, name: draft.name })
      setMode('edit')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="main">
        {/* Sub-page views */}
        {mode === 'create' && (
          <CreateGunPage
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'edit' && (
          <EditGunPage
            gun={editingGun}
            gunId={editingGun?.id}
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'edit-profile' && (
          <EditProfilePage
            onBack={() => {
              setMode('list')
              setTab('Profile')
            }}
            onSuccess={() => {
              setMode('list')
              setTab('Profile')
            }}
          />
        )}

        {mode === 'detail' && selectedGun && (
          <GunDetail
            gun={selectedGun}
            onBack={handleBackToList}
            onEdit={(g) => handleNavigate('Edit', g)}
            onDelete={(g) => setDeleteTarget(g)}
          />
        )}

        {/* Top-level Tabs */}
        {mode === 'list' && (
          <>
            {tab === 'Catalog' && (
              <Catalog
                onNavigate={(destination, payload) => handleNavigate(destination, payload)}
              />
            )}
            {tab === 'Favorites' && (
              <FavoritesPage
                onSelectGun={(g) => handleNavigate('Detail', g)}
                onNavigateCatalog={() => setTab('Catalog')}
              />
            )}
            {tab === 'Profile' && (
              <ProfilePage
                onReplaySplash={() => setShowSplash(true)}
                onNavigateEditProfile={() => handleNavigate('EditProfile')}
                onOpenDraft={handleOpenDraft}
              />
            )}
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onNavigateCatalog={() => {
          setCartOpen(false)
          handleNavigate('Catalog')
        }}
      />

      {/* Global Soft Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Pindahkan ke Recycle Bin (Soft Delete)"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Item ini akan diarsipkan di Recycle Bin dan dapat dipulihkan sewaktu-waktu.`}
        confirmLabel="Pindahkan ke Trash"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            softDeleteService.softDeleteGun(deleteTarget)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Gagal memindahkan ke recycle bin.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
