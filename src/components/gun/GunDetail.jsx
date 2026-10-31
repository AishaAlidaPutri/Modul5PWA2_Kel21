import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
  X,
  Save,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareModal from '../common/ShareModal'
import { useReviews } from '../../hooks/useReviews'
import { useCart } from '../../hooks/useCart'
import userService from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import ConfirmModal from '../modals/ConfirmModal'

/**
 * Full-screen product detail view with:
 * - Share Link (unique URL)
 * - Add to Cart with Quantity selector
 * - Full Review CRUD (Create, Read, Update, Delete)
 * - Review Thumbs Up / Down voting
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Cart
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [cartFeedback, setCartFeedback] = useState(false)

  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false)

  // Reviews
  const gunIdentifier = gun.id || gun.name
  const {
    reviews,
    loading: reviewsLoading,
    createReview,
    updateReview,
    deleteReview,
    toggleReaction,
  } = useReviews(gunIdentifier)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Review Edit State
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Review Delete Target
  const [deleteReviewTarget, setDeleteReviewTarget] = useState(null)
  const [deletingReview, setDeletingReview] = useState(false)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = reviews.length

  const handleAddToCart = () => {
    addItem(gun, quantity)
    setCartFeedback(true)
    setTimeout(() => setCartFeedback(false), 2500)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating harus antara 1 dan 5 bintang.')
      return
    }

    setSubmitting(true)
    const profile = userService.getUserProfile()
    const result = await createReview({
      user_identifier: profile.username || 'Shooter',
      user_id: profile.userId,
      rating,
      comment: comment.trim(),
    })
    setSubmitting(false)

    if (result) {
      setReviewSuccess('Review berhasil dipublikasikan!')
      setComment('')
      setRating(5)
      setTimeout(() => setReviewSuccess(''), 3500)
    } else {
      setReviewError('Gagal mengirimkan review.')
    }
  }

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setEditComment('')
  }

  const handleSaveEdit = async (reviewId) => {
    setSavingEdit(true)
    const profile = userService.getUserProfile()
    const result = await updateReview(reviewId, {
      rating: editRating,
      comment: editComment.trim(),
      user_identifier: profile.username || 'Shooter',
    })
    setSavingEdit(false)

    if (result) {
      setEditingReviewId(null)
      setReviewSuccess('Review berhasil diperbarui!')
      setTimeout(() => setReviewSuccess(''), 3000)
    } else {
      setReviewError('Gagal memperbarui review.')
    }
  }

  const handleConfirmDeleteReview = async () => {
    if (!deleteReviewTarget) return
    setDeletingReview(true)
    const success = await deleteReview(deleteReviewTarget.id)
    setDeletingReview(false)
    setDeleteReviewTarget(null)

    if (success) {
      setReviewSuccess('Review berhasil dihapus.')
      setTimeout(() => setReviewSuccess(''), 3000)
    } else {
      setReviewError('Gagal menghapus review.')
    }
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Katalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-img-wrap">
          <img className="detail-img" src={imgSrc} alt={gun.name} />
        </div>
        <div className="detail-info">
          <div className="detail-header-row">
            <h1 className="display">{gun.name}</h1>
          </div>

          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>

          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} ulasan)
            </p>
          )}

          {/* Cart Stepper & Add to Cart button */}
          <div className="detail-cart-row">
            <div className="detail-stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Kurangi kuantitas"
              >
                <Minus size={14} />
              </button>
              <span className="stepper-val">{quantity}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Tambah kuantitas"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              className={`btn btn--primary detail-add-cart-btn ${cartFeedback ? 'btn--success' : ''}`}
              onClick={handleAddToCart}
            >
              {cartFeedback ? (
                <><Check size={16} /> Ditambahkan!</>
              ) : (
                <><ShoppingBag size={16} /> Masukkan ke Keranjang</>
              )}
            </button>
          </div>

          {/* Action buttons (Share, Favorite, Edit, Delete) */}
          <div className="detail-actions">
            <button
              type="button"
              className="btn btn--outline detail-share-btn"
              onClick={() => setShowShareModal(true)}
              title="Bagikan melalui tautan unik"
            >
              <Share2 size={16} /> Bagikan Link
            </button>

            <FavoriteButton gunId={gun.id || gun.name} />

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                <Pencil size={15} /> Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                <Trash2 size={15} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Deskripsi &amp; Profil Balistik</h2>
        <p>{gun.description || 'Tidak ada deskripsi detail untuk hardware ini.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Spesifikasi Komponen</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Assembly / Maintenance Steps */}
      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Prosedur Perakitan &amp; Pemeliharaan</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section review-mgmt-section">
        <div className="review-section-header">
          <h2>Operator Reviews &amp; Feedback</h2>
          <span className="count">{reviews.length} ulasan</span>
        </div>

        {/* Submit review Form */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <h4>Tulis Review &amp; Evaluasi Lapangan</h4>

          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={24}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Bagikan ulasan mengenai ergonomi, recoil, atau siklus peluru…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Mengirimkan…</>
            ) : (
              <><Send size={16} /> Kirim Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {/* Existing reviews list */}
        {reviewsLoading ? (
          <p className="detail-loading">Memuat ulasan…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const isEditing = editingReviewId === rev.id

              return (
                <li key={rev.id} className="review-item">
                  {isEditing ? (
                    // Inline Edit Form for this review
                    <div className="review-edit-box">
                      <div className="review-stars" style={{ marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={20}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="3"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Edit ulasan Anda..."
                      />
                      <div className="review-edit-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={savingEdit}
                          onClick={() => handleSaveEdit(rev.id)}
                        >
                          <Save size={13} /> {savingEdit ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={handleCancelEdit}
                          disabled={savingEdit}
                        >
                          <X size={13} /> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="review-head">
                        <div className="review-head-left">
                          <span className="review-user">{rev.user_identifier || 'Operator'}</span>
                          <span className="review-stars-display">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < rev.rating ? 'var(--brass)' : 'none'}
                                stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                              />
                            ))}
                          </span>
                        </div>

                        {/* Edit & Delete CRUD buttons for this review */}
                        <div className="review-crud-btns">
                          <button
                            type="button"
                            className="review-icon-btn"
                            onClick={() => handleStartEdit(rev)}
                            title="Edit Review"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="review-icon-btn review-icon-btn--danger"
                            onClick={() => setDeleteReviewTarget(rev)}
                            title="Hapus Review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Thumbs Up / Down reaction bar */}
                      <div className="review-reactions">
                        <button
                          type="button"
                          className={`reaction-btn reaction-btn--up ${rev.user_reaction === 'up' ? 'reaction-btn--active-up' : ''}`}
                          onClick={() => toggleReaction(rev.id, 'up', rev.thumbs_up, rev.thumbs_down)}
                          title="Beri Thumb Up (Bermanfaat)"
                        >
                          <ThumbsUp size={15} />
                          <span className="reaction-label">Bermanfaat</span>
                          <span className="reaction-count">{rev.thumbs_up || 0}</span>
                        </button>

                        <button
                          type="button"
                          className={`reaction-btn reaction-btn--down ${rev.user_reaction === 'down' ? 'reaction-btn--active-down' : ''}`}
                          onClick={() => toggleReaction(rev.id, 'down', rev.thumbs_up, rev.thumbs_down)}
                          title="Beri Thumb Down"
                        >
                          <ThumbsDown size={15} />
                          <span className="reaction-label">Kurang Bermanfaat</span>
                          <span className="reaction-count">{rev.thumbs_down || 0}</span>
                        </button>

                        {rev.created_at && (
                          <span className="review-date">
                            {new Date(rev.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">Belum ada review untuk hardware ini. Jadilah yang pertama memberikan evaluasi!</p>
        )}
      </section>

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        gun={gun}
        onClose={() => setShowShareModal(false)}
      />

      {/* Delete Review Confirm Modal */}
      <ConfirmModal
        open={Boolean(deleteReviewTarget)}
        title="Hapus Review Operator"
        message="Apakah Anda yakin ingin menghapus ulasan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Review"
        danger
        loading={deletingReview}
        onConfirm={handleConfirmDeleteReview}
        onCancel={() => setDeleteReviewTarget(null)}
      />
    </div>
  )
}
