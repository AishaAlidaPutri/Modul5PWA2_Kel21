import { useState, useEffect, useCallback } from 'react'
import cartService from '../services/cartService'

/**
 * React hook for cart operations.
 */
export function useCart() {
  const [items, setItems] = useState(() => cartService.getItems())
  const [count, setCount] = useState(() => cartService.getCount())
  const [total, setTotal] = useState(() => cartService.getTotal())

  useEffect(() => {
    const unsubscribe = cartService.subscribe((updatedItems) => {
      setItems(updatedItems)
      setCount(cartService.getCount())
      setTotal(cartService.getTotal())
    })
    return unsubscribe
  }, [])

  const addItem = useCallback((gun, quantity = 1) => {
    return cartService.addItem(gun, quantity)
  }, [])

  const updateQuantity = useCallback((gunId, newQuantity) => {
    return cartService.updateQuantity(gunId, newQuantity)
  }, [])

  const removeItem = useCallback((gunId) => {
    return cartService.removeItem(gunId)
  }, [])

  const clearCart = useCallback(() => {
    cartService.clearCart()
  }, [])

  const getWhatsAppUrl = useCallback((options) => {
    return cartService.generateWhatsAppUrl(options)
  }, [])

  return {
    items,
    count,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getWhatsAppUrl,
  }
}

export default useCart
