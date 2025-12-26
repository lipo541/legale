'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Snowfall from 'react-snowfall'

export default function ChristmasEffects() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const effects = (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Snow */}
      <Snowfall
        color="#ffffff"
        snowflakeCount={120}
        speed={[0.5, 1.5]}
        wind={[-0.5, 1.0]}
        radius={[0.5, 2.0]}
      />
    </div>
  )

  return createPortal(effects, document.body)
}
