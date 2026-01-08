'use client'

import { Suspense } from 'react'
import SpecialistDashboard from '@/components/specialistdashboard/SpecialistDashboard'

export default function SpecialistDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">იტვირთება...</div>}>
      <SpecialistDashboard />
    </Suspense>
  )
}
