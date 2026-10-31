import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings with reaction support (thumbs up/down)
// and full CRUD (Create, Read, Update, Delete) with local fallback persistence.
// ---------------------------------------------------------------------------

const REACTIONS_KEY = 'bore_barrel_review_reactions'
const LOCAL_REVIEWS_KEY = 'bore_barrel_local_reviews'

// Default sample reviews for firearms if none exist yet
const SAMPLE_REVIEWS = {
  'Glock 17': [
    {
      id: 'sample-rev-1',
      product_id: 'Glock 17',
      user_identifier: 'Sgt. Morrison',
      user_id: 'sample-user-1',
      rating: 5,
      comment: 'Exceptional reliability. Cycled 1,000 rounds through duty conditions without a single failure to feed.',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      thumbs_up: 8,
      thumbs_down: 0,
    },
    {
      id: 'sample-rev-2',
      product_id: 'Glock 17',
      user_identifier: 'Operator Ghost',
      user_id: 'sample-user-2',
      rating: 4,
      comment: 'Good ergonomics out of the box, trigger break is clean. Upgraded to night sights immediately.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      thumbs_up: 4,
      thumbs_down: 1,
    },
  ],
  'AK-47': [
    {
      id: 'sample-rev-3',
      product_id: 'AK-47',
      user_identifier: 'Armorer Rex',
      user_id: 'sample-user-3',
      rating: 5,
      comment: 'Rock solid durability. Heavy receiver and dependable cycle in freezing mud.',
      created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      thumbs_up: 12,
      thumbs_down: 1,
    },
  ],
}

class ReviewService {
  /**
   * Read all reactions from localStorage.
   */
  getReactionsMap() {
    try {
      const raw = localStorage.getItem(REACTIONS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  saveReactionsMap(map) {
    try {
      localStorage.setItem(REACTIONS_KEY, JSON.stringify(map))
    } catch (err) {
      console.error('Failed to save reactions:', err)
    }
  }

  /**
   * Read local reviews storage.
   */
  getLocalReviewsMap() {
    try {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  saveLocalReviewsMap(map) {
    try {
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(map))
    } catch (err) {
      console.error('Failed to save local reviews:', err)
    }
  }

  /**
   * Attach reaction metadata (thumbs_up, thumbs_down, user_reaction) to review list.
   */
  enrichWithReactions(reviews, currentUserId) {
    const reactions = this.getReactionsMap()
    return reviews.map((r) => {
      const revReaction = reactions[String(r.id)] || {
        thumbs_up: r.thumbs_up || 0,
        thumbs_down: r.thumbs_down || 0,
        users: {},
      }
      return {
        ...r,
        thumbs_up: revReaction.thumbs_up || 0,
        thumbs_down: revReaction.thumbs_down || 0,
        user_reaction: currentUserId && revReaction.users ? revReaction.users[currentUserId] || null : null,
      }
    })
  }

  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId, currentUserId) {
    let list = []
    const stringId = String(gunId)

    // 1. Try server fetch
    try {
      if (IS_SUPABASE) {
        const data = await apiClient.get(
          `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
        )
        if (Array.isArray(data)) {
          list = data.map((r) => ({
            id: String(r.id),
            product_id: r.product_id,
            user_identifier: r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous',
            user_id: r.user_id,
            rating: Number(r.rating) || 5,
            comment: r.comment || '',
            created_at: r.created_at,
          }))
        }
      } else {
        const res = await apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
        if (res && res.data) {
          list = res.data
        }
      }
    } catch {
      // Server error/unavailable — will use local reviews
    }

    // 2. Merge local reviews for this gun
    const localMap = this.getLocalReviewsMap()
    const localForGun = localMap[stringId] || []

    // Also inject sample reviews if empty
    let sampleForGun = []
    if (list.length === 0 && localForGun.length === 0) {
      sampleForGun = SAMPLE_REVIEWS[stringId] || [
        {
          id: `sample-${stringId}-1`,
          product_id: stringId,
          user_identifier: 'Operator Ghost',
          user_id: 'user-sample-1',
          rating: 5,
          comment: 'Performa hardware ini sangat stabil di lapangan. Siklus mekanisme lancar dan recoil sangat seimbang.',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          thumbs_up: 6,
          thumbs_down: 0,
        },
        {
          id: `sample-${stringId}-2`,
          product_id: stringId,
          user_identifier: 'Sgt. Vance',
          user_id: 'user-sample-2',
          rating: 4,
          comment: 'Material receiver kokoh, akurasi tembakan grouping rapat pada uji balistik.',
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          thumbs_up: 3,
          thumbs_down: 1,
        },
      ]
    }

    // Deduplicate by ID
    const combined = [...localForGun, ...list, ...sampleForGun]
    const seen = new Set()
    const unique = []
    for (const item of combined) {
      if (!seen.has(String(item.id))) {
        seen.add(String(item.id))
        unique.push(item)
      }
    }

    unique.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return {
      success: true,
      data: this.enrichWithReactions(unique, currentUserId),
    }
  }

  /**
   * Submit a new review.
   */
  async createReview(gunId, reviewData) {
    const stringGunId = String(gunId)
    const newReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      product_id: stringGunId,
      user_identifier: reviewData.user_identifier || 'Shooter',
      user_id: reviewData.user_id || reviewData.user_identifier,
      rating: Number(reviewData.rating) || 5,
      comment: reviewData.comment || '',
      created_at: new Date().toISOString(),
      thumbs_up: 0,
      thumbs_down: 0,
    }

    // Try server sync
    try {
      if (IS_SUPABASE) {
        const payload = {
          product_id: Number(gunId),
          user_id: reviewData.user_id || reviewData.user_identifier,
          rating: Number(reviewData.rating),
          comment: reviewData.comment || '',
        }
        const res = await apiClient.post('/rest/v1/reviews', payload, {
          headers: { Prefer: 'return=representation' },
        })
        const created = Array.isArray(res) ? res[0] : res
        if (created?.id) {
          newReview.id = String(created.id)
        }
      } else {
        await apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
      }
    } catch {
      // Graceful offline fallback
    }

    // Always store in local reviews map
    const localMap = this.getLocalReviewsMap()
    if (!localMap[stringGunId]) {
      localMap[stringGunId] = []
    }
    localMap[stringGunId].unshift(newReview)
    this.saveLocalReviewsMap(localMap)

    return { success: true, data: newReview }
  }

  /**
   * Update an existing review (rating and/or comment).
   */
  async updateReview(reviewId, reviewData, gunId) {
    const stringId = String(reviewId)

    // Try server update
    try {
      if (IS_SUPABASE) {
        await apiClient.patch(
          `/rest/v1/reviews?id=eq.${reviewId}`,
          {
            rating: Number(reviewData.rating),
            comment: reviewData.comment,
          },
          { headers: { Prefer: 'return=representation' } },
        )
      } else {
        await apiClient.put(`/api/v1/recipes/${reviewId}`, reviewData)
      }
    } catch {
      // Ignore server failure and update locally
    }

    // Update in local store
    const localMap = this.getLocalReviewsMap()
    let updated = null

    for (const key of Object.keys(localMap)) {
      const idx = localMap[key].findIndex((r) => String(r.id) === stringId)
      if (idx > -1) {
        localMap[key][idx] = {
          ...localMap[key][idx],
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
          updated_at: new Date().toISOString(),
        }
        updated = localMap[key][idx]
      }
    }

    // If not found in localMap (was loaded from server or sample), add it locally
    if (!updated && gunId) {
      const stringGunId = String(gunId)
      if (!localMap[stringGunId]) localMap[stringGunId] = []
      updated = {
        id: stringId,
        product_id: stringGunId,
        user_identifier: reviewData.user_identifier || 'Shooter',
        rating: Number(reviewData.rating),
        comment: reviewData.comment,
        updated_at: new Date().toISOString(),
      }
      localMap[stringGunId].unshift(updated)
    }

    this.saveLocalReviewsMap(localMap)
    return { success: true, data: updated }
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId, _gunId) {
    const stringId = String(reviewId)

    // Try server delete
    try {
      if (IS_SUPABASE) {
        await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      } else {
        await apiClient.delete(`/api/v1/recipes/${reviewId}`)
      }
    } catch {
      // Ignore and proceed with local delete
    }

    // Delete from local store
    const localMap = this.getLocalReviewsMap()
    for (const key of Object.keys(localMap)) {
      localMap[key] = localMap[key].filter((r) => String(r.id) !== stringId)
    }
    this.saveLocalReviewsMap(localMap)

    // Clean up reactions
    const reactions = this.getReactionsMap()
    delete reactions[stringId]
    this.saveReactionsMap(reactions)

    return { success: true }
  }

  /**
   * Toggle thumb up or thumb down reaction for a review.
   * @param {string|number} reviewId
   * @param {'up'|'down'}   reactionType
   * @param {string}        userId
   */
  toggleReaction(reviewId, reactionType, userId, initialThumbsUp = 0, initialThumbsDown = 0) {
    if (!reviewId || !userId) return null
    const stringId = String(reviewId)
    const reactions = this.getReactionsMap()

    if (!reactions[stringId]) {
      reactions[stringId] = {
        thumbs_up: Number(initialThumbsUp) || 0,
        thumbs_down: Number(initialThumbsDown) || 0,
        users: {},
      }
    }

    const item = reactions[stringId]
    if (!item.users) item.users = {}

    const previousReaction = item.users[userId] || null

    if (previousReaction === reactionType) {
      // User tapped the same button: toggle off
      delete item.users[userId]
      if (reactionType === 'up') item.thumbs_up = Math.max(0, item.thumbs_up - 1)
      if (reactionType === 'down') item.thumbs_down = Math.max(0, item.thumbs_down - 1)
    } else {
      // User tapped a different button or voted for first time
      if (previousReaction === 'up') item.thumbs_up = Math.max(0, item.thumbs_up - 1)
      if (previousReaction === 'down') item.thumbs_down = Math.max(0, item.thumbs_down - 1)

      item.users[userId] = reactionType
      if (reactionType === 'up') item.thumbs_up += 1
      if (reactionType === 'down') item.thumbs_down += 1
    }

    this.saveReactionsMap(reactions)
    return {
      thumbs_up: item.thumbs_up,
      thumbs_down: item.thumbs_down,
      user_reaction: item.users[userId] || null,
    }
  }
}

export default new ReviewService()
