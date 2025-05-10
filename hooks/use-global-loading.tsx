"use client"

import { useAuth } from "./use-auth"

export function useGlobalLoading() {
  const { globalLoading, setGlobalLoading } = useAuth()

  const showLoading = () => setGlobalLoading(true)
  const hideLoading = () => setGlobalLoading(false)

  return {
    loading: globalLoading,
    showLoading,
    hideLoading,
  }
}
