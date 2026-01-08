import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Service role client for admin operations (bypasses RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify the requesting user is SUPER_ADMIN
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is SUPER_ADMIN
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only SUPER_ADMIN can delete users' },
        { status: 403 }
      )
    }

    // Get the user ID to delete
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Use service role client for deletion
    const adminClient = createAdminClient()

    // Get user info before deletion for storage cleanup
    const { data: targetUser } = await adminClient
      .from('profiles')
      .select('id, role, avatar_url, company_id')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 1. Delete related data in correct order (respecting foreign keys)
    
    // Delete specialist translations
    await adminClient
      .from('specialist_translations')
      .delete()
      .eq('specialist_id', userId)

    // Delete company translations (if company)
    if (targetUser.role === 'COMPANY') {
      await adminClient
        .from('company_translations')
        .delete()
        .eq('company_id', userId)
    }

    // Delete specialist cities
    await adminClient
      .from('specialist_cities')
      .delete()
      .eq('specialist_id', userId)

    // Delete specialist services
    await adminClient
      .from('specialist_services')
      .delete()
      .eq('specialist_id', userId)

    // Delete access requests (as requester)
    await adminClient
      .from('access_requests')
      .delete()
      .eq('user_id', userId)

    // Nullify access requests reviewed by this user
    await adminClient
      .from('access_requests')
      .update({ reviewed_by: null })
      .eq('reviewed_by', userId)

    // Delete posts by this user (or set author to null)
    await adminClient
      .from('posts')
      .update({ author_id: null })
      .eq('author_id', userId)

    // Delete global messages created by this user
    await adminClient
      .from('global_messages')
      .delete()
      .eq('created_by', userId)

    // Delete message read status
    await adminClient
      .from('message_read_status')
      .delete()
      .eq('user_id', userId)

    // 2. Delete profile picture from storage
    if (targetUser.avatar_url) {
      try {
        // Extract file path from URL
        const urlParts = targetUser.avatar_url.split('/storage/v1/object/public/')
        if (urlParts.length > 1) {
          const [bucket, ...pathParts] = urlParts[1].split('/')
          const filePath = pathParts.join('/')
          await adminClient.storage.from(bucket).remove([filePath])
        }
      } catch (storageError) {
        console.error('Error deleting avatar:', storageError)
        // Continue with user deletion even if storage cleanup fails
      }
    }

    // 3. Finally delete the profile
    const { error: deleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Profile delete error:', deleteError)
      return NextResponse.json(
        { 
          error: deleteError.message,
          code: deleteError.code,
          details: deleteError.details
        },
        { status: 400 }
      )
    }

    // 4. Optionally delete the auth user as well
    try {
      await adminClient.auth.admin.deleteUser(userId)
    } catch (authDeleteError) {
      console.error('Auth user delete error (non-critical):', authDeleteError)
      // Profile is already deleted, auth cleanup failure is non-critical
    }

    return NextResponse.json({ 
      success: true,
      message: 'User and all related data deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
