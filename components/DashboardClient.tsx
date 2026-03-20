'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient' 
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import UserDashboard from './features/UserDashboard'
import AdminDashboard from './features/AdminDashboard'

export default function DashboardClient() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // NEW: State to remember which page the staff member wants to look at
  const [staffViewMode, setStaffViewMode] = useState<'checkin' | 'logs'>('checkin')
  
  const router = useRouter()

  useEffect(() => {
    async function fetchUserAndProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }

      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      const authAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture  
      
      if (!profileData.avatar_url && authAvatar) {
        // 1. Save it to the database for next time
        await supabase.from('profiles').update({ avatar_url: authAvatar }).eq('id', session.user.id)
        // 2. Attach it to the current session so it loads instantly
        profileData.avatar_url = authAvatar
      }

      setProfile(profileData)
      setLoading(false)
    }

    fetchUserAndProfile()
  }, [router])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/') 
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center text-black dark:text-white">Loading NEU Library Visitor Logger...</div>

  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-6">
        <div className="p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-center max-w-md shadow-2xl">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-700 dark:text-gray-300">Your account has been blocked from accessing the NEU Library system. Please contact the administration.</p>
        </div>
      </div>
    )
  }

  // Define our roles for easier reading
  const isStaffUser = profile?.role === 'user' && profile?.user_type === 'staff'
  const isAdminOrSuper = profile?.role === 'admin' || profile?.role === 'superadmin'

  return (
    <div className="w-full flex-1 flex flex-col items-center pt-8 pb-12">
      
      {/* NEW: The Staff Toggle Switch */}
      {isStaffUser && (
        <div className="mb-6 flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner animate-in fade-in slide-in-from-top-4">
          <button 
            onClick={() => setStaffViewMode('checkin')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${staffViewMode === 'checkin' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Log a Visit
          </button>
          <button 
            onClick={() => setStaffViewMode('logs')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${staffViewMode === 'logs' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            View Library Logs
          </button>
        </div>
      )}

      {/* RENDER LOGIC */}
      {isAdminOrSuper || (isStaffUser && staffViewMode === 'logs') ? (
        <AdminDashboard profile={profile} />
      ) : (
        <UserDashboard user={user} profile={profile} onSignOut={signOut} />
      )}
    </div>
  )
}