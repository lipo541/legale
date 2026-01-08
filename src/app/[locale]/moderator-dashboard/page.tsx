'use client'

import { Suspense } from 'react'
import ModeratorDashboard from '@/components/moderatordashboard/ModeratorDashboard'

export default function ModeratorDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">იტვირთება...</div>}>
      <ModeratorDashboard />
    </Suspense>
  )
}
