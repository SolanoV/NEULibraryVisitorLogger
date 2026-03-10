'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient' 
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Link from 'next/link'

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)

      // Fetch their specific details from our profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/') 
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center text-black dark:text-white">Loading Profile...</div>

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh] py-8 animate-in fade-in duration-500">
      
      {/* Include the Navbar so they can still access the menu and dark mode toggle! */}
      <Navbar user={user} onSignOut={signOut} />

      <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10">
        
        {/* PROFILE HEADER */}
        <div className="flex flex-col md:flex-row items-center gap-6 border-b border-gray-100 dark:border-gray-800 pb-8 mb-8">
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg object-cover" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-500">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
          )}
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-1">
              {profile?.full_name || 'NEU User'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
            
            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full">
                {profile?.role === 'admin' ? 'Administrator' : 'Standard User'}
              </span>
              {profile?.is_blocked && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-full">
                  Blocked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PROFILE DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">School ID</p>
            <p className="text-lg font-bold text-black dark:text-white">
              {profile?.school_id || <span className="text-gray-400 italic">Not set yet</span>}
            </p>
          </div>

          <div className="p-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1 uppercase tracking-wide">College / Office</p>
            <p className="text-lg font-bold text-black dark:text-white">
              {profile?.college_office || <span className="text-gray-400 italic">Not set yet</span>}
            </p>
          </div>
        </div>

        {/* NAVIGATION BACK */}
        <div className="flex justify-center">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}