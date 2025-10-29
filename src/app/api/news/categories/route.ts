import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const locale = searchParams.get('locale') || 'ka'

  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('post_categories')
    .select(`
      id,
      parent_id,
      post_category_translations!inner(
        name,
        slug,
        language
      )
    `)
    .eq('post_category_translations.language', locale)
    .order('id', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform the data
  const transformedCategories = categories?.map((cat) => ({
    id: cat.id,
    parent_id: cat.parent_id,
    name: cat.post_category_translations[0]?.name || '',
    slug: cat.post_category_translations[0]?.slug || ''
  })) || []

  return NextResponse.json(transformedCategories)
}
