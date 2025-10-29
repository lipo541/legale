import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const locale = searchParams.get('locale') || 'ka'
  const status = searchParams.get('status') || 'published'

  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      category_id,
      featured_image_url,
      published_at,
      post_translations!inner(
        title,
        excerpt,
        slug,
        language
      )
    `)
    .eq('status', status)
    .eq('post_translations.language', locale)
    .order('published_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(posts || [])
}
