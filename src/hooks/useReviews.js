import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'
import { getUserIdentifier } from '../services/userService'

// ---------------------------------------------------------------------------
// useReviews — full CRUD and reaction hook for product reviews.
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const currentUserId = getUserIdentifier()

  const fetchReviews = useCallback(async () => {
    if (!gunId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.getReviews(gunId, currentUserId)

      if (response.success) {
        setReviews(response.data || [])
      } else {
        setError(response.message || 'Failed to fetch reviews.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching reviews.')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [gunId, currentUserId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const createReview = async (reviewData) => {
    const res = await reviewService.createReview(gunId, reviewData)
    if (res.success) {
      await fetchReviews()
      return res.data
    }
    return null
  }

  const updateReview = async (reviewId, reviewData) => {
    const res = await reviewService.updateReview(reviewId, reviewData, gunId)
    if (res.success) {
      await fetchReviews()
      return res.data
    }
    return null
  }

  const deleteReview = async (reviewId) => {
    const res = await reviewService.deleteReview(reviewId, gunId)
    if (res.success) {
      await fetchReviews()
      return true
    }
    return false
  }

  const toggleReaction = (reviewId, type, initialThumbsUp = 0, initialThumbsDown = 0) => {
    const updatedReaction = reviewService.toggleReaction(
      reviewId,
      type,
      currentUserId,
      initialThumbsUp,
      initialThumbsDown,
    )
    if (updatedReaction) {
      setReviews((prev) =>
        prev.map((r) =>
          String(r.id) === String(reviewId)
            ? {
                ...r,
                thumbs_up: updatedReaction.thumbs_up,
                thumbs_down: updatedReaction.thumbs_down,
                user_reaction: updatedReaction.user_reaction,
              }
            : r,
        ),
      )
    }
    return updatedReaction
  }

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    toggleReaction,
    currentUserId,
  }
}

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await reviewService.createReview(gunId, reviewData)

      if (response.success) {
        setSuccess(true)
        return response.data
      } else {
        setError(response.message || 'Failed to submit review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}
