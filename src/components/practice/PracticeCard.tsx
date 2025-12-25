'use client'

import type { PracticeCardProps } from './types'
import PracticeCardGrid from './components/PracticeCardGrid'
import PracticeCardList from './components/PracticeCardList'

export default function PracticeCard({
  id,
  hero_image_url,
  translation,
  locale,
  viewMode = 'grid',
}: PracticeCardProps) {
  if (viewMode === 'list') {
    return (
      <PracticeCardList
        id={id}
        hero_image_url={hero_image_url}
        translation={translation}
        locale={locale}
      />
    )
  }

  return (
    <PracticeCardGrid
      id={id}
      hero_image_url={hero_image_url}
      translation={translation}
      locale={locale}
    />
  )
}
