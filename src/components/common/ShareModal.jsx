import { useState } from 'react'
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react'
import {
  getGunShareUrl,
  copyGunShareLink,
  getWhatsAppGunShareUrl,
  getTwitterGunShareUrl,
} from '../../utils/shareUtils'

export default function ShareModal({ open, gun, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!open || !gun) return null

  const shareUrl = getGunShareUrl(gun)

  const handleCopy = async () => {
    const success = await copyGunShareLink(gun)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--sm share-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div className="modal-header">
          <div className="modal-header-icon">
            <Share2 size={20} stroke="var(--brass)" />
          </div>
          <div>
            <h3 id="share-modal-title" className="modal-title">Share Hardware Piece</h3>
            <p className="modal-subtitle">Share "{gun.name}" via unique armory link</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Item preview snippet */}
          <div className="share-preview">
            <img
              src={gun.image_url || gun.image || '/guns/pistol.svg'}
              alt={gun.name}
              className="share-preview-img"
            />
            <div className="share-preview-info">
              <span className="share-preview-name">{gun.name}</span>
              <span className="share-preview-type">
                {gun.type || 'Hardware'} {gun.caliber ? `· ${gun.caliber}` : ''}
              </span>
            </div>
          </div>

          {/* Unique URL row */}
          <div className="share-url-group">
            <label className="form-label" htmlFor="unique-share-link">Unique Link:</label>
            <div className="share-url-box">
              <input
                id="unique-share-link"
                type="text"
                readOnly
                value={shareUrl}
                className="share-url-input"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={`btn btn--sm ${copied ? 'btn--success' : 'btn--primary'}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <><Check size={14} /> Copied</>
                ) : (
                  <><Copy size={14} /> Copy</>
                )}
              </button>
            </div>
            {copied && <span className="share-copied-hint">Tautan unik berhasil disalin ke clipboard!</span>}
          </div>

          {/* Quick share channels */}
          <div className="share-channels">
            <a
              href={getWhatsAppGunShareUrl(gun)}
              target="_blank"
              rel="noopener noreferrer"
              className="share-channel-btn share-channel-btn--wa"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href={getTwitterGunShareUrl(gun)}
              target="_blank"
              rel="noopener noreferrer"
              className="share-channel-btn share-channel-btn--tw"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X / Twitter
            </a>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
