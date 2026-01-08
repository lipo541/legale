'use client'

import { Suspense } from 'react'
import AuthorDashboard from '@/components/authordashboard/AuthorDashboard'

export default function AuthorDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">იტვირთება...</div>}>
      <AuthorDashboard />
    </Suspense>
  )
}
