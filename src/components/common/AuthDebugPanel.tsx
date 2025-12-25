/**
 * Auth Debug Component
 * ეს კომპონენტი აჩვენებს რეალურ დროში რა ხდება auth-თან და database-თან
 * 
 * გამოყენება: დაამატე ნებისმიერ გვერდზე <AuthDebugPanel />
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { getClientSingleton } from '@/lib/supabase/client'

interface LogEntry {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  data?: unknown
}

export default function AuthDebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<{
    hasSession: boolean
    userId?: string
    expiresAt?: string
    accessToken?: string
  } | null>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [localStorage, setLocalStorage] = useState<string[]>([])
  const [tabState, setTabState] = useState<'visible' | 'hidden'>('visible')
  const supabase = getClientSingleton()
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (type: LogEntry['type'], message: string, data?: unknown) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      type,
      message,
      data
    }
    setLogs(prev => [...prev.slice(-50), entry]) // Keep last 50 logs
  }

  // Initial check
  useEffect(() => {
    addLog('info', '🔄 Debug panel initialized')
    checkSession()
    checkStorage()
  }, [])

  // Check session
  const checkSession = async () => {
    addLog('info', '📡 Checking session...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        addLog('error', `❌ getSession error: ${error.message}`)
        setSessionInfo({ hasSession: false })
        return
      }

      if (session) {
        const expiresAt = session.expires_at 
          ? new Date(session.expires_at * 1000).toLocaleString()
          : 'unknown'
        
        setSessionInfo({
          hasSession: true,
          userId: session.user.id,
          expiresAt,
          accessToken: session.access_token.substring(0, 20) + '...'
        })
        addLog('success', `✅ Session valid - expires: ${expiresAt}`)
      } else {
        setSessionInfo({ hasSession: false })
        addLog('warning', '⚠️ No session found')
      }
    } catch (err) {
      addLog('error', `❌ Exception: ${err}`)
    }
  }

  // Check storage
  const checkStorage = () => {
    // Cookies
    const allCookies = document.cookie.split(';').map(c => c.trim())
    const supabaseCookies = allCookies.filter(c => 
      c.includes('supabase') || c.includes('sb-')
    )
    setCookies(supabaseCookies)
    addLog('info', `🍪 Found ${supabaseCookies.length} Supabase cookies`)

    // LocalStorage
    const supabaseKeys = Object.keys(window.localStorage).filter(k => 
      k.includes('supabase') || k.includes('sb-')
    )
    setLocalStorage(supabaseKeys)
    addLog('info', `💾 Found ${supabaseKeys.length} Supabase localStorage keys`)
  }

  // Database connection test with timeout
  const testDatabaseConnection = async () => {
    addLog('info', '🔌 Testing database connection...')
    
    const startTime = Date.now()
    const timeoutMs = 5000 // 5 second timeout
    
    try {
      const queryPromise = supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 5s')), timeoutMs)
      )
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>
      
      const duration = Date.now() - startTime
      
      if (error) {
        addLog('error', `❌ DB Error (${duration}ms): ${error.message}`, error)
      } else {
        addLog('success', `✅ DB Connected (${duration}ms)`, data)
      }
    } catch (err) {
      const duration = Date.now() - startTime
      addLog('error', `❌ DB Exception (${duration}ms): ${err}`)
    }
  }

  // Test raw fetch to Supabase (bypassing client) - uses USER's access token
  const testRawFetch = async () => {
    addLog('info', '🔗 Testing RAW fetch with USER token...')
    
    const startTime = Date.now()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    try {
      // Get current session's access token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token || key
      const tokenType = session?.access_token ? 'USER' : 'ANON'
      
      addLog('info', `Using ${tokenType} token`)
      
      const response = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      })
      
      const duration = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        addLog('success', `✅ RAW Fetch (${tokenType}) OK (${duration}ms)`, data)
      } else {
        const text = await response.text()
        addLog('error', `❌ RAW Fetch Error (${duration}ms): ${response.status} - ${text}`)
      }
    } catch (err) {
      const duration = Date.now() - startTime
      addLog('error', `❌ RAW Fetch Exception (${duration}ms): ${err}`)
    }
  }

  // Test profile fetch (exactly like AuthContext does)
  const testProfileFetch = async () => {
    addLog('info', '👤 Testing fetchProfile (like AuthContext)...')
    
    const startTime = Date.now()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        addLog('warning', '⚠️ No session - cannot fetch profile')
        return
      }
      
      const userId = session.user.id
      addLog('info', `Fetching profile for user: ${userId.substring(0, 8)}...`)
      
      // This is exactly what AuthContext does in fetchProfile()
      const [profileRes, requestRes] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', userId).single(),
        supabase.from('access_requests')
          .select('id, status')
          .eq('user_id', userId)
          .eq('status', 'PENDING')
          .maybeSingle()
      ])
      
      const duration = Date.now() - startTime
      
      if (profileRes.error) {
        addLog('error', `❌ Profile error (${duration}ms): ${profileRes.error.message}`)
      } else {
        addLog('success', `✅ Profile OK (${duration}ms): role=${profileRes.data?.role}`)
      }
      
      if (requestRes.error) {
        addLog('error', `Request error: ${requestRes.error.message}`)
      } else {
        addLog('info', `Access request: ${requestRes.data ? 'PENDING' : 'none'}`)
      }
    } catch (err) {
      const duration = Date.now() - startTime
      addLog('error', `❌ Profile Exception (${duration}ms): ${err}`)
    }
  }

  // Test refresh API
  const testRefreshAPI = async () => {
    addLog('info', '🔄 Testing refresh API...')
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.success) {
        addLog('success', `✅ Refresh API OK - refreshed: ${data.refreshed}`, data)
      } else {
        addLog('error', `❌ Refresh API failed: ${data.error}`, data)
      }
    } catch (err) {
      addLog('error', `❌ Refresh API exception: ${err}`)
    }
  }

  // Full diagnostic test - runs all tests in sequence
  const runFullDiagnostic = async () => {
    addLog('warning', '🔬 STARTING FULL DIAGNOSTIC...')
    
    // 1. Check session
    addLog('info', '--- Step 1: Session Check ---')
    await checkSession()
    
    // 2. Raw fetch (bypasses Supabase client)
    addLog('info', '--- Step 2: Raw Fetch (native) ---')
    await testRawFetch()
    
    // 3. DB test with Supabase client
    addLog('info', '--- Step 3: DB via Supabase Client ---')
    await testDatabaseConnection()
    
    // 4. Profile fetch (AuthContext pattern)
    addLog('info', '--- Step 4: Profile Fetch (AuthContext) ---')
    await testProfileFetch()
    
    // 5. Server-side refresh
    addLog('info', '--- Step 5: Server-side Refresh API ---')
    await testRefreshAPI()
    
    addLog('warning', '🔬 DIAGNOSTIC COMPLETE')
  }

  // Visibility change listener - only logs, no auto-tests to avoid interference
  useEffect(() => {
    const handleVisibility = () => {
      const state = document.visibilityState
      setTabState(state as 'visible' | 'hidden')
      
      if (state === 'visible') {
        addLog('warning', '👁️ TAB BECAME VISIBLE - click [Full Test] to diagnose')
      } else {
        addLog('warning', '🙈 TAB HIDDEN')
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        addLog('info', `🔔 Auth Event: ${event}`, { 
          hasSession: !!session,
          userId: session?.user?.id 
        })
        
        if (event === 'SIGNED_OUT') {
          setSessionInfo({ hasSession: false })
        } else if (session) {
          checkSession()
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [supabase])

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
      >
        🔧 Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="bg-gray-800 px-3 py-2 flex justify-between items-center border-b border-gray-700">
        <span className="font-bold">🔧 Auth Debug Panel</span>
        <div className="flex gap-2">
          <span className={`px-2 py-0.5 rounded ${tabState === 'visible' ? 'bg-green-600' : 'bg-red-600'}`}>
            {tabState === 'visible' ? '👁️ Visible' : '🙈 Hidden'}
          </span>
          <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      </div>

      {/* Session Info */}
      <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        <div className="text-gray-400 mb-1">Session Status:</div>
        {sessionInfo?.hasSession ? (
          <div className="text-green-400">
            ✅ Active | User: {sessionInfo.userId?.substring(0, 8)}... | Exp: {sessionInfo.expiresAt}
          </div>
        ) : (
          <div className="text-red-400">❌ No Session</div>
        )}
      </div>

      {/* Storage Info */}
      <div className="px-3 py-2 bg-gray-800/30 border-b border-gray-700">
        <div className="text-gray-400">🍪 Cookies: {cookies.length} | 💾 LS: {localStorage.length}</div>
      </div>

      {/* Action Buttons - Row 1 */}
      <div className="px-3 py-2 flex gap-2 border-b border-gray-700 flex-wrap">
        <button onClick={runFullDiagnostic} className="bg-red-600 px-2 py-1 rounded hover:bg-red-700 font-bold">
          🔬 Full Test
        </button>
        <button onClick={checkSession} className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700">
          Session
        </button>
        <button onClick={testDatabaseConnection} className="bg-green-600 px-2 py-1 rounded hover:bg-green-700">
          DB
        </button>
        <button onClick={testProfileFetch} className="bg-cyan-600 px-2 py-1 rounded hover:bg-cyan-700">
          Profile
        </button>
        <button onClick={testRawFetch} className="bg-orange-600 px-2 py-1 rounded hover:bg-orange-700">
          Raw
        </button>
        <button onClick={testRefreshAPI} className="bg-purple-600 px-2 py-1 rounded hover:bg-purple-700">
          API
        </button>
      </div>

      {/* Logs */}
      <div className="h-64 overflow-y-auto p-2 space-y-1">
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`px-2 py-1 rounded ${
              log.type === 'error' ? 'bg-red-900/50 text-red-300' :
              log.type === 'success' ? 'bg-green-900/50 text-green-300' :
              log.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300' :
              'bg-gray-800/50 text-gray-300'
            }`}
          >
            <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
            {log.data !== undefined && (
              <pre className="text-[10px] mt-1 text-gray-400 overflow-hidden">
                {String(JSON.stringify(log.data, null, 2)).substring(0, 200)}
              </pre>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Clear Button */}
      <div className="px-3 py-2 border-t border-gray-700">
        <button 
          onClick={() => setLogs([])} 
          className="text-gray-400 hover:text-white text-xs"
        >
          Clear Logs
        </button>
      </div>
    </div>
  )
}
