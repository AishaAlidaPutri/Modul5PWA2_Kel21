import { useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Shield,
  Save,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import userService from '../services/userService'

const PRESET_ROLES = [
  'Master Armorer',
  'Tactical Marksman',
  'Field Operative',
  'Ballistics Engineer',
  'Range Safety Officer',
]

/**
 * EditProfilePage — dedicated separate page for updating Operator Name and Station Bio.
 * (Replaces inline form at the bottom of ProfilePage).
 */
export default function EditProfilePage({ onBack, onSuccess }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar avatar maksimal 2MB.')
      setTimeout(() => setError(''), 3500)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      setFeedback('Avatar berhasil dipilih.')
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleApplyPresetRole = (role) => {
    const prefix = username.split(' - ')[0] || username
    setUsername(`${prefix} · ${role}`)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    setFeedback('')

    if (!username.trim()) {
      setError('Nama atau Callsign operator tidak boleh kosong.')
      return
    }

    setSaving(true)
    const updated = {
      ...profile,
      username: username.trim(),
      bio: bio.trim(),
      avatar,
    }

    const result = userService.saveUserProfile(updated)
    setSaving(false)

    if (result.success) {
      setFeedback('Profil operator berhasil diperbarui!')
      setTimeout(() => {
        if (onSuccess) onSuccess(result.data)
        else if (onBack) onBack()
      }, 700)
    } else {
      setError('Gagal menyimpan profil operator.')
    }
  }

  return (
    <div className="edit-profile-page">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Profil Operator
      </button>

      <section className="masthead">
        <h1 className="display">Edit Operator Credentials</h1>
        <p className="lede">
          Perbarui nama callsign, foto avatar profil, serta catatan bio armorer Anda.
        </p>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {error && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="edit-profile-card">
        {/* Avatar Customization */}
        <div className="edit-avatar-section">
          <div className="avatar-wrap edit-avatar-wrap">
            {avatar ? (
              <img src={avatar} alt="Avatar Preview" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={44} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="edit-avatar-file" className="avatar-upload-btn" title="Ganti avatar">
              <Camera size={16} />
              <input
                id="edit-avatar-file"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>
          <div className="edit-avatar-desc">
            <h3>Foto Avatar Operator</h3>
            <p className="form-hint">Format PNG, JPG, atau WebP (maksimal 2MB).</p>
            {avatar && (
              <button
                type="button"
                className="link-btn"
                onClick={() => setAvatar(null)}
                style={{ marginTop: '4px', fontSize: '0.85rem' }}
              >
                Hapus foto kustom (Gunakan standar)
              </button>
            )}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="edit-profile-form">
          <div className="form-group">
            <label htmlFor="edit-username" className="form-label">
              Callsign / Nama Operator
            </label>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Master Gunsmith, Operator Ghost"
              className="form-input"
              maxLength={50}
              required
            />
            <span className="form-hint">{username.length} / 50 karakter</span>
          </div>

          {/* Preset Roles */}
          <div className="preset-roles-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} stroke="var(--brass)" /> Preset Jabatan / Role:
            </label>
            <div className="preset-badges">
              {PRESET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className="role-badge-btn"
                  onClick={() => handleApplyPresetRole(role)}
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-bio" className="form-label">
              Station Bio / Catatan Armory
            </label>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Deskripsikan spesialisasi kaliber, kualifikasi militer/sipil, atau unit tugas..."
              rows={5}
              className="form-textarea"
              maxLength={400}
            />
            <span className="form-hint">{bio.length} / 400 karakter</span>
          </div>

          <div className="edit-profile-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Profil Operator'}
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={onBack}
              disabled={saving}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
