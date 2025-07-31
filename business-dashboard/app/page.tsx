import { Suspense } from 'react'
import { Dashboard } from '../components/Dashboard'
import { DashboardSkeleton } from '../components/DashboardSkeleton'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  )
}
