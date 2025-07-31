'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useBusiness } from '../contexts/BusinessContext'
import Sidebar from './Sidebar'
import Header from './Header'
import StatsCards from './StatsCards'
import RecentActivity from './RecentActivity'
import QuickActions from './QuickActions'
import ChartsSection from './ChartsSection'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { business, loading: businessLoading } = useBusiness()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (authLoading || businessLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Please log in to access the dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen}
      />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page title */}
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                Dashboard
              </h1>

              {!business && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        No Business Selected
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Please select a business from the sidebar to view your dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {business && (
                <>
                  {/* Stats cards */}
                  <StatsCards business={business} />

                  {/* Quick Actions */}
                  <QuickActions business={business} />

                  {/* Charts and Recent Activity */}
                  <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <ChartsSection business={business} />
                    <RecentActivity business={business} />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-700 rounded animate-pulse"></div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header skeleton */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mt-4"></div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Title skeleton */}
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>

              {/* Stats cards skeleton */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts skeleton */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
