'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  GlobalMessage, 
  MessageWithStatus, 
  CreateMessageData,
  MessageReadStat
} from '@/lib/types'
import { revalidatePath } from 'next/cache'

// ============================================================================
// SUPERADMIN ACTIONS - Create and Manage Messages
// ============================================================================

/**
 * Create a new global message (SuperAdmin only)
 */
export async function createGlobalMessage(data: CreateMessageData): Promise<{
  success: boolean
  message?: string
  messageId?: string
}> {
  try {
    const supabase = await createClient()

    // Check if user is SuperAdmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized. Only SuperAdmin can create messages.' }
    }

    // Create the message
    const { data: newMessage, error: messageError } = await supabase
      .from('global_messages')
      .insert({
        title_ka: data.title_ka,
        title_en: data.title_en,
        title_ru: data.title_ru,
        content_ka: data.content_ka,
        content_en: data.content_en,
        content_ru: data.content_ru,
        created_by: user.id,
        priority: data.priority || 'normal',
        expires_at: data.expires_at || null,
        is_active: true
      })
      .select()
      .single()

    if (messageError || !newMessage) {
      console.error('Error creating message:', messageError)
      return { success: false, message: 'Failed to create message' }
    }

    // Insert target roles
    const targetRolesData = data.target_roles.map(role => ({
      message_id: newMessage.id,
      target_role: role
    }))

    const { error: rolesError } = await supabase
      .from('message_target_roles')
      .insert(targetRolesData)

    if (rolesError) {
      console.error('Error inserting target roles:', rolesError)
      // Rollback: delete the message
      await supabase.from('global_messages').delete().eq('id', newMessage.id)
      return { success: false, message: 'Failed to set target roles' }
    }

    revalidatePath('/superadmin')
    revalidatePath('/messages')

    return { 
      success: true, 
      message: 'Message created successfully',
      messageId: newMessage.id
    }
  } catch (error) {
    console.error('Error in createGlobalMessage:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Update an existing message (SuperAdmin only)
 */
export async function updateGlobalMessage(
  messageId: string,
  data: Partial<CreateMessageData>
): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const supabase = await createClient()

    // Check if user is SuperAdmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    // Update message content
    const updateData: Partial<CreateMessageData> = {}
    if (data.title_ka) updateData.title_ka = data.title_ka
    if (data.title_en) updateData.title_en = data.title_en
    if (data.title_ru) updateData.title_ru = data.title_ru
    if (data.content_ka) updateData.content_ka = data.content_ka
    if (data.content_en) updateData.content_en = data.content_en
    if (data.content_ru) updateData.content_ru = data.content_ru
    if (data.priority) updateData.priority = data.priority
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at

    const { error: updateError } = await supabase
      .from('global_messages')
      .update(updateData)
      .eq('id', messageId)

    if (updateError) {
      console.error('Error updating message:', updateError)
      return { success: false, message: 'Failed to update message' }
    }

    // Update target roles if provided
    if (data.target_roles) {
      // Delete existing roles
      await supabase
        .from('message_target_roles')
        .delete()
        .eq('message_id', messageId)

      // Insert new roles
      const targetRolesData = data.target_roles.map(role => ({
        message_id: messageId,
        target_role: role
      }))

      const { error: rolesError } = await supabase
        .from('message_target_roles')
        .insert(targetRolesData)

      if (rolesError) {
        console.error('Error updating target roles:', rolesError)
        return { success: false, message: 'Failed to update target roles' }
      }
    }

    revalidatePath('/superadmin')
    revalidatePath('/messages')

    return { success: true, message: 'Message updated successfully' }
  } catch (error) {
    console.error('Error in updateGlobalMessage:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Delete a message (SuperAdmin only)
 */
export async function deleteGlobalMessage(messageId: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const supabase = await createClient()

    // Check if user is SuperAdmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('global_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      return { success: false, message: 'Failed to delete message' }
    }

    revalidatePath('/superadmin')
    revalidatePath('/messages')

    return { success: true, message: 'Message deleted successfully' }
  } catch (error) {
    console.error('Error in deleteGlobalMessage:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Toggle message active status (SuperAdmin only)
 */
export async function toggleMessageStatus(messageId: string): Promise<{
  success: boolean
  message?: string
  isActive?: boolean
}> {
  try {
    const supabase = await createClient()

    // Check if user is SuperAdmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    // Get current status
    const { data: currentMessage } = await supabase
      .from('global_messages')
      .select('is_active')
      .eq('id', messageId)
      .single()

    if (!currentMessage) {
      return { success: false, message: 'Message not found' }
    }

    const newStatus = !currentMessage.is_active

    // Update status
    const { error } = await supabase
      .from('global_messages')
      .update({ is_active: newStatus })
      .eq('id', messageId)

    if (error) {
      console.error('Error toggling message status:', error)
      return { success: false, message: 'Failed to update status' }
    }

    revalidatePath('/superadmin')
    revalidatePath('/messages')

    return { 
      success: true, 
      message: `Message ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus
    }
  } catch (error) {
    console.error('Error in toggleMessageStatus:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Get all messages with their target roles (SuperAdmin only)
 */
export async function getAllMessages(): Promise<{
  success: boolean
  messages?: Array<GlobalMessage & { target_roles: string[] }>
  message?: string
}> {
  try {
    const supabase = await createClient()

    // Check if user is SuperAdmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('global_messages')
      .select(`
        *,
        message_target_roles(target_role)
      `)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return { success: false, message: 'Failed to fetch messages' }
    }

    // Transform data
    const transformedMessages = messages?.map(msg => ({
      ...msg,
      target_roles: msg.message_target_roles?.map((r: { target_role: string }) => r.target_role) || []
    }))

    return { success: true, messages: transformedMessages }
  } catch (error) {
    console.error('Error in getAllMessages:', error)
    return { success: false, message: 'An error occurred' }
  }
}

// ============================================================================
// USER ACTIONS - View and Read Messages
// ============================================================================

/**
 * Get messages for current user based on their role
 */
export async function getMessagesForUser(
  locale: string = 'ka',
  includeRead: boolean = true
): Promise<{
  success: boolean
  messages?: MessageWithStatus[]
  message?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    // Call the database function
    const { data, error } = await supabase.rpc('get_messages_for_user', {
      p_user_id: user.id,
      p_locale: locale,
      p_include_read: includeRead
    })

    if (error) {
      console.error('Error fetching user messages:', error)
      return { success: false, message: 'Failed to fetch messages' }
    }

    return { success: true, messages: data || [] }
  } catch (error) {
    console.error('Error in getMessagesForUser:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Get unread messages count for current user
 */
export async function getUnreadMessagesCount(): Promise<{
  success: boolean
  count?: number
  message?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    // Call the database function
    const { data, error } = await supabase.rpc('get_unread_messages_count', {
      p_user_id: user.id
    })

    if (error) {
      console.error('Error getting unread count:', error)
      return { success: false, message: 'Failed to get count' }
    }

    return { success: true, count: data || 0 }
  } catch (error) {
    console.error('Error in getUnreadMessagesCount:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    // Call the database function
    const { error } = await supabase.rpc('mark_message_as_read', {
      p_user_id: user.id,
      p_message_id: messageId
    })

    if (error) {
      console.error('Error marking message as read:', error)
      return { success: false, message: 'Failed to mark as read' }
    }

    revalidatePath('/messages')

    return { success: true, message: 'Message marked as read' }
  } catch (error) {
    console.error('Error in markMessageAsRead:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Mark all messages as read for current user
 */
export async function markAllMessagesAsRead(): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, message: 'Profile not found' }
    }

    // Get all unread messages for this user's role
    const { data: messages } = await supabase
      .from('global_messages')
      .select(`
        id,
        message_target_roles!inner(target_role)
      `)
      .eq('is_active', true)
      .eq('message_target_roles.target_role', profile.role)

    if (!messages || messages.length === 0) {
      return { success: true, message: 'No messages to mark' }
    }

    // Insert read records for all messages (ignore conflicts)
    const readRecords = messages.map(msg => ({
      user_id: user.id,
      message_id: msg.id,
      read_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('user_read_messages')
      .upsert(readRecords, { onConflict: 'user_id,message_id' })

    if (error) {
      console.error('Error marking all as read:', error)
      return { success: false, message: 'Failed to mark all as read' }
    }

    revalidatePath('/messages')

    return { success: true, message: 'All messages marked as read' }
  } catch (error) {
    console.error('Error in markAllMessagesAsRead:', error)
    return { success: false, message: 'An error occurred' }
  }
}

/**
 * Get read statistics for a message (SuperAdmin only)
 */
export async function getMessageReadStats(messageId: string): Promise<{
  success: boolean
  stats?: {
    read_count: number
    target_count: number
    read_users: Array<{
      user_id: string
      full_name: string | null
      email: string
      role: string
      read_at: string
    }>
  }
  message?: string
}> {
  try {
    const supabase = await createClient()

    // Check if user is SuperAdmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    // Get read users
    const { data: readUsers, error: readError } = await supabase.rpc(
      'get_message_read_stats',
      { p_message_id: messageId }
    )

    if (readError) {
      console.error('Error fetching read stats:', readError)
      return { success: false, message: 'Failed to fetch read stats' }
    }

    // Get target count
    const { data: targetCount, error: countError } = await supabase.rpc(
      'get_message_target_count',
      { p_message_id: messageId }
    )

    if (countError) {
      console.error('Error fetching target count:', countError)
      return { success: false, message: 'Failed to fetch target count' }
    }

    return {
      success: true,
      stats: {
        read_count: readUsers?.length || 0,
        target_count: targetCount || 0,
        read_users: readUsers || []
      }
    }
  } catch (error) {
    console.error('Error in getMessageReadStats:', error)
    return { success: false, message: 'An error occurred' }
  }
}
