import { useState, useEffect, useCallback } from 'react'
import softDeleteService from '../services/softDeleteService'

/**
 * React hook for soft delete state and actions.
 */
export function useSoftDelete() {
  const [deletedGuns, setDeletedGuns] = useState(() => softDeleteService.getDeletedGuns())
  const [count, setCount] = useState(() => softDeleteService.getCount())

  useEffect(() => {
    const unsubscribe = softDeleteService.subscribe((list) => {
      setDeletedGuns(list)
      setCount(list.length)
    })
    return unsubscribe
  }, [])

  const isDeleted = useCallback((gunId) => {
    return softDeleteService.isDeleted(gunId)
  }, [])

  const softDeleteGun = useCallback((gun) => {
    return softDeleteService.softDeleteGun(gun)
  }, [])

  const restoreGun = useCallback((gunId) => {
    return softDeleteService.restoreGun(gunId)
  }, [])

  const restoreAll = useCallback(() => {
    return softDeleteService.restoreAll()
  }, [])

  const permanentDeleteGun = useCallback((gunId) => {
    return softDeleteService.permanentDeleteGun(gunId)
  }, [])

  const emptyTrash = useCallback(() => {
    softDeleteService.emptyTrash()
  }, [])

  return {
    deletedGuns,
    count,
    isDeleted,
    softDeleteGun,
    restoreGun,
    restoreAll,
    permanentDeleteGun,
    emptyTrash,
  }
}

export default useSoftDelete
