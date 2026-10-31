import { useState, useEffect } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Pencil,
  Trash2,
  RotateCcw,
  ExternalLink,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Info,
  Archive,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { useSoftDelete } from '../hooks/useSoftDelete'
import { getAllDrafts, deleteDraft, clearAllDrafts } from '../utils/draftStorage'
import ConfirmModal from '../components/modals/ConfirmModal'
import { formatPrice } from '../utils/helpers'

/**
 * ProfilePage — Operator identity, Saved Drafts, Soft-Deleted Recycle Bin,
 * and integrated About & Contact sections.
 */
export default function ProfilePage({
  onReplaySplash,
  onNavigateEditProfile,
  onOpenDraft,
}) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [drafts, setDrafts] = useState(() => getAllDrafts())
  const [deleteDraftTarget, setDeleteDraftTarget] = useState(null)
  const [feedback, setFeedback] = useState('')

  const { favorites } = useFavorites()
  const {
    deletedGuns,
    count: deletedCount,
    restoreGun,
    restoreAll,
    permanentDeleteGun,
    emptyTrash,
  } = useSoftDelete()

  // Permanent delete confirmation target
  const [permanentTarget, setPermanentTarget] = useState(null)
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false)

  // Refresh profile on mount or focus
  useEffect(() => {
    setProfile(userService.getUserProfile())
    setDrafts(getAllDrafts())
  }, [])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraft = (draftId) => {
    deleteDraft(draftId)
    setDrafts(getAllDrafts())
    setDeleteDraftTarget(null)
    setFeedback('Draft berhasil dihapus.')
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleClearAllDrafts = () => {
    clearAllDrafts()
    setDrafts([])
    setFeedback('Semua draft telah dibersihkan.')
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleRestoreItem = (gunId, gunName) => {
    restoreGun(gunId)
    setFeedback(`"${gunName}" berhasil dipulihkan ke katalog!`)
    setTimeout(() => setFeedback(''), 3500)
  }

  const handlePermanentDelete = () => {
    if (!permanentTarget) return
    permanentDeleteGun(permanentTarget.id)
    setFeedback(`"${permanentTarget.name}" dihapus permanen.`)
    setPermanentTarget(null)
    setTimeout(() => setFeedback(''), 3500)
  }

  const handleEmptyTrash = () => {
    emptyTrash()
    setConfirmEmptyTrash(false)
    setFeedback('Recycle Bin berhasil dikosongkan.')
    setTimeout(() => setFeedback(''), 3500)
  }

  return (
    <div className="profile-page">
      {/* Masthead */}
      <section className="masthead profile-masthead">
        <div>
          <h1 className="display">Operator Profile & Armory</h1>
          <p className="lede">
            Operator credentials, offline draft inventory, soft-delete archive, and station info.
          </p>
        </div>
        <div className="profile-masthead-actions">
          {onReplaySplash && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onReplaySplash}
              title="Replay introductory splash animation"
            >
              <Play size={14} /> Replay Intro
            </button>
          )}
        </div>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={38} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <div className="profile-name-row">
              <h2 className="display">{profile.username || 'Shooter'}</h2>
              {onNavigateEditProfile && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm edit-profile-btn"
                  onClick={onNavigateEditProfile}
                  title="Edit Callsign & Bio di halaman baru"
                >
                  <Pencil size={14} /> Edit Profil
                </button>
              )}
            </div>

            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Armorer Bio Card */}
            <div className="profile-bio-box">
              <span className="profile-bio-title">Station Bio / Catatan Armorer:</span>
              <p className="profile-bio-text">
                {profile.bio && profile.bio.trim()
                  ? profile.bio
                  : 'Belum ada catatan bio operator. Klik tombol "Edit Profil" untuk menambahkan spesialisasi dan kualifikasi Anda.'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
          <div className="stat-item">
            <Trash2 size={20} className="stat-icon" stroke="#e05252" />
            <div className="stat-val">{deletedCount}</div>
            <div className="stat-label">Soft-Deleted Items</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Saved Offline Drafts */}
      <section className="profile-section" id="drafts-section">
        <div className="profile-section-header">
          <div>
            <h2 className="display section-heading">
              <FileText size={20} stroke="var(--brass)" /> Saved Offline Drafts
            </h2>
            <p className="section-subtext">
              Daftar spesifikasi hardware dan formulir yang tersimpan secara lokal di browser Anda.
            </p>
          </div>
          {drafts.length > 0 && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleClearAllDrafts}
              title="Bersihkan semua draft offline"
            >
              <Trash2 size={14} /> Clear All Drafts
            </button>
          )}
        </div>

        {drafts.length === 0 ? (
          <div className="empty-section-box">
            <FileText size={36} stroke="var(--steel)" opacity={0.5} />
            <p>Tidak ada draft tersimpan.</p>
            <span className="empty-sub">
              Saat Anda membuat atau mengedit senjata tanpa langsung menyimpannya, draf otomatis akan tersimpan di sini.
            </span>
          </div>
        ) : (
          <div className="drafts-grid">
            {drafts.map((d) => (
              <div key={d.id} className="draft-card">
                <div className="draft-card-header">
                  <span className={`draft-type-badge ${d.isCreate ? 'badge-new' : 'badge-edit'}`}>
                    {d.isCreate ? 'New Hardware' : 'Update Draft'}
                  </span>
                  <span className="draft-timestamp">{d.timeAgo}</span>
                </div>

                <h3 className="draft-name">{d.name}</h3>

                <div className="draft-meta">
                  <span>{d.type} {d.caliber ? `· ${d.caliber}` : ''}</span>
                  <span className="draft-price">{formatPrice(d.price)}</span>
                </div>

                <div className="draft-counts">
                  <span>{d.specsCount} Spesifikasi</span>
                  <span>·</span>
                  <span>{d.stepsCount} Langkah Perakitan</span>
                </div>

                <div className="draft-actions">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => onOpenDraft && onOpenDraft(d)}
                  >
                    Buka / Lanjutkan Draft <ExternalLink size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn-danger"
                    onClick={() => setDeleteDraftTarget(d)}
                    title="Hapus draft"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Soft Delete / Hardware Recycle Bin */}
      <section className="profile-section" id="trash-section">
        <div className="profile-section-header">
          <div>
            <h2 className="display section-heading">
              <Archive size={20} stroke="#e05252" /> Hardware Recycle Bin (Soft Delete)
            </h2>
            <p className="section-subtext">
              Senjata yang dihapus dari katalog disimpan di sini dan dapat dipulihkan kapan saja.
            </p>
          </div>
          {deletedGuns.length > 0 && (
            <div className="section-header-buttons">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={restoreAll}
                title="Pulihkan semua item yang dihapus"
              >
                <RotateCcw size={14} /> Restore All
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => setConfirmEmptyTrash(true)}
                title="Hapus permanen semua item di trash"
              >
                <Trash2 size={14} /> Empty Trash
              </button>
            </div>
          )}
        </div>

        {deletedGuns.length === 0 ? (
          <div className="empty-section-box">
            <Archive size={36} stroke="var(--steel)" opacity={0.5} />
            <p>Recycle Bin kosong.</p>
            <span className="empty-sub">
              Hardware yang dihapus menggunakan fitur Soft Delete akan diarsipkan di sini agar tidak hilang permanen.
            </span>
          </div>
        ) : (
          <div className="trash-grid">
            {deletedGuns.map((gun) => (
              <div key={gun.id || gun.name} className="trash-card">
                <img
                  src={gun.image_url || gun.image || '/guns/pistol.svg'}
                  alt={gun.name}
                  className="trash-card-img"
                />
                <div className="trash-card-body">
                  <h3 className="trash-card-name">{gun.name}</h3>
                  <p className="trash-card-meta">
                    {gun.type || gun.category} {gun.caliber ? `· ${gun.caliber}` : ''}
                  </p>
                  <p className="trash-card-deleted-at">
                    Dihapus: {new Date(gun.deleted_at || Date.now()).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="trash-card-actions">
                  <button
                    type="button"
                    className="btn btn--sm btn--outline"
                    onClick={() => handleRestoreItem(gun.id, gun.name)}
                    title="Pulihkan kembali ke katalog"
                  >
                    <RotateCcw size={14} /> Pulihkan (Restore)
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm btn--danger"
                    onClick={() => setPermanentTarget(gun)}
                    title="Hapus permanen dari penyimpanan"
                  >
                    <Trash2 size={14} /> Hapus Permanen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: About Bore & Barrel */}
      <section className="profile-section about-integrated-section" id="about-section">
        <div className="profile-section-header">
          <div>
            <h2 className="display section-heading">
              <Info size={20} stroke="var(--brass)" /> About Bore &amp; Barrel
            </h2>
            <p className="section-subtext">Filosofi dan dedikasi workshop persenjataan kami.</p>
          </div>
        </div>

        <div className="about-content-card">
          <h3 className="about-title display">A one-room armory.</h3>
          <p className="about-lede">
            Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
            from the bench — no markup theatre, no filler.
          </p>
          <div className="about-features-grid">
            <div className="about-feat">
              <span className="about-feat-num">01</span>
              <h4>Bench-Calibrated Hardware</h4>
              <p>
                Setiap platform diinspeksi secara manual sebelum masuk katalog, memastikan toleransi mekanisme berada pada standar operasional tertinggi.
              </p>
            </div>
            <div className="about-feat">
              <span className="about-feat-num">02</span>
              <h4>Transparansi Total</h4>
              <p>
                Spesifikasi kaliber, material receiver, dan daftar perakitan dicantumkan apa adanya tanpa klaim pemasaran berlebihan.
              </p>
            </div>
            <div className="about-feat">
              <span className="about-feat-num">03</span>
              <h4>Offline-First Resilience</h4>
              <p>
                Dilengkapi arsitektur Progressive Web App (PWA) lengkap dengan draft offline, caching katalog, dan pemesanan cepat via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Contact & Field Station */}
      <section className="profile-section contact-integrated-section" id="contact-section">
        <div className="profile-section-header">
          <div>
            <h2 className="display section-heading">
              <Phone size={20} stroke="var(--brass)" /> Field Station Contact &amp; HQ
            </h2>
            <p className="section-subtext">Hubungi bench armorer atau kunjungi bengkel kami.</p>
          </div>
        </div>

        <div className="contact-content-grid">
          <div className="contact-card">
            <div className="contact-icon-wrap">
              <MapPin size={22} stroke="var(--brass)" />
            </div>
            <h4>Lokasi Armory</h4>
            <p>123 Range Road, Range District HQ</p>
            <span className="contact-sub">Bore &amp; Barrel Main Facility</span>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrap">
              <Clock size={22} stroke="var(--brass)" />
            </div>
            <h4>Jam Operasional</h4>
            <p>Selasa – Sabtu: 10:00 – 18:00</p>
            <span className="contact-sub">Minggu &amp; Senin tutup untuk uji balistik</span>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrap">
              <Phone size={22} stroke="var(--brass)" />
            </div>
            <h4>Hotline Lapangan</h4>
            <p>(555) 010-0100</p>
            <span className="contact-sub">Dedicated Armory Operator Line</span>
          </div>

          <div className="contact-card contact-card--highlight">
            <div className="contact-icon-wrap">
              <MessageCircle size={22} stroke="#25D366" />
            </div>
            <h4>Pemesanan Langsung</h4>
            <p>WhatsApp Armorer Duty</p>
            <a
              href="https://wa.me/6282284911909?text=Hi%20aku%20mau%20tanya%20tentang%20hardware%20di%20Bore%20%26%20Barrel"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary btn--sm"
              style={{ marginTop: '8px' }}
            >
              <MessageCircle size={15} /> Chat via WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Modal: Delete Draft */}
      <ConfirmModal
        open={Boolean(deleteDraftTarget)}
        title="Hapus Draft Offline"
        message={`Apakah Anda yakin ingin menghapus draft "${deleteDraftTarget?.name}"? Data formulir yang belum disimpan akan hilang.`}
        confirmLabel="Hapus Draft"
        danger
        onConfirm={() => handleDeleteDraft(deleteDraftTarget.id)}
        onCancel={() => setDeleteDraftTarget(null)}
      />

      {/* Modal: Permanent Delete Soft-Deleted Item */}
      <ConfirmModal
        open={Boolean(permanentTarget)}
        title="Hapus Senjata Secara Permanen"
        message={`Senjata "${permanentTarget?.name}" akan dihapus permanen dari memori dan tidak dapat dipulihkan lagi.`}
        confirmLabel="Hapus Permanen"
        danger
        onConfirm={handlePermanentDelete}
        onCancel={() => setPermanentTarget(null)}
      />

      {/* Modal: Empty Trash */}
      <ConfirmModal
        open={confirmEmptyTrash}
        title="Kosongkan Recycle Bin"
        message="Semua item di Recycle Bin akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Kosongkan Semua"
        danger
        onConfirm={handleEmptyTrash}
        onCancel={() => setConfirmEmptyTrash(false)}
      />
    </div>
  )
}
