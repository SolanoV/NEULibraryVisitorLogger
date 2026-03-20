'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient' 
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import UserDashboard from './features/UserDashboard'
import AdminDashboard from './features/AdminDashboard'

export default function DashboardClient() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null) // State to hold the database profile!
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchUserAndProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }

      setUser(session.user)

      // Fetch their specific HOPE profile from the database
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

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

  // GATEWAY CHECK: Is this user blocked by an Admin?
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

  return (
    <div className="w-full flex-1 flex flex-col items-center pt-8 pb-12">
      {profile?.role === 'admin' || profile?.role === 'superadmin' ? (
        <AdminDashboard profile={profile} />
      ) : (
        <UserDashboard user={user} profile={profile} onSignOut={signOut} />
      )}
    </div>
  )
}