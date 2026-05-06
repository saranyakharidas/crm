'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getStoredAccessToken, TOKEN_STORAGE_KEY } from './auth'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationsContextType {
  notifications: Notification[]
  isLoading: boolean
  error: string | null
  unreadCount: number
  refreshNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000'

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiRequest = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = getStoredAccessToken()
    if (!token) {
      throw new Error(`No auth token found.`)
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        window.location.assign('/login')
      }
      throw new Error(`API error: ${response.statusText}`)
    }

    if (response.status === 204) return null
    return response.json()
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest('/notifications')
      setNotifications(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    void fetchNotifications()
    
    // Optional: Poll for new notifications every 60 seconds
    const interval = setInterval(() => {
      void fetchNotifications()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markNotificationRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err: any) {
      console.error('Failed to delete notification:', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider value={{
      notifications,
      isLoading,
      error,
      unreadCount,
      refreshNotifications: fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
