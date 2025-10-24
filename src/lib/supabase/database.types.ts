export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: 'USER' | 'AUTHOR' | 'SPECIALIST' | 'COMPANY' | 'SUPER_ADMIN' | 'MODERATOR'
          avatar_url: string | null
          phone_number: string | null
          company_slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: 'USER' | 'AUTHOR' | 'SPECIALIST' | 'COMPANY' | 'SUPER_ADMIN' | 'MODERATOR'
          avatar_url?: string | null
          phone_number?: string | null
          company_slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: 'USER' | 'AUTHOR' | 'SPECIALIST' | 'COMPANY' | 'SUPER_ADMIN' | 'MODERATOR'
          avatar_url?: string | null
          phone_number?: string | null
          company_slug?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      access_requests: {
        Row: {
          id: string
          user_id: string
          request_type: 'SPECIALIST' | 'COMPANY'
          full_name: string
          company_slug: string | null
          phone_number: string
          about: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          request_type: 'SPECIALIST' | 'COMPANY'
          full_name: string
          company_slug?: string | null
          phone_number: string
          about: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: 'SPECIALIST' | 'COMPANY'
          full_name?: string
          company_slug?: string | null
          phone_number?: string
          about?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
