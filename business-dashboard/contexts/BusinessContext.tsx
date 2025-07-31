'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface Business {
  id: string
  name: string
  type: 'automotive' | 'parking' | 'lounge' | 'corporate' | 'residential' | 'education'
  address: string
  phone: string
  email: string
  logo?: string
  settings: {
    timezone: string
    currency: string
    language: string
    notifications: boolean
  }
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise'
    status: 'active' | 'canceled' | 'past_due'
    currentPeriodEnd: string
  }
  stats: {
    totalVehicles: number
    activeVehicles: number
    revenue: number
    customers: number
  }
}

interface BusinessContextType {
  business: Business | null
  businesses: Business[]
  selectedBusinessId: string | null
  selectBusiness: (businessId: string) => void
  updateBusiness: (business: Partial<Business>) => Promise<void>
  refreshBusiness: () => Promise<void>
  loading: boolean
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBusinesses()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (selectedBusinessId && businesses.length > 0) {
      const selectedBusiness = businesses.find(b => b.id === selectedBusinessId)
      setBusiness(selectedBusiness || null)
    }
  }, [selectedBusinessId, businesses])

  const fetchBusinesses = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBusinesses(data)
        
        // Auto-select first business if user has only one
        if (data.length === 1) {
          setSelectedBusinessId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId)
    localStorage.setItem('selected_business_id', businessId)
  }

  const updateBusiness = async (updates: Partial<Business>) => {
    if (!business) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/businesses/${business.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedBusiness = await response.json()
        setBusiness(updatedBusiness)
        
        // Update in businesses array
        setBusinesses(prev => 
          prev.map(b => b.id === business.id ? updatedBusiness : b)
        )
      }
    } catch (error) {
      console.error('Failed to update business:', error)
      throw error
    }
  }

  const refreshBusiness = async () => {
    if (!selectedBusinessId) return

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/businesses/${selectedBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const updatedBusiness = await response.json()
        setBusiness(updatedBusiness)
        
        // Update in businesses array
        setBusinesses(prev => 
          prev.map(b => b.id === selectedBusinessId ? updatedBusiness : b)
        )
      }
    } catch (error) {
      console.error('Failed to refresh business:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <BusinessContext.Provider value={{
      business,
      businesses,
      selectedBusinessId,
      selectBusiness,
      updateBusiness,
      refreshBusiness,
      loading
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
