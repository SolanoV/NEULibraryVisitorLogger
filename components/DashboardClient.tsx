'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient' 
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import UserDashboard from './UserDashboard'

export default function DashboardClient() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user) 
      } else {
        router.push('/') 
      }
    })
  }, [router])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/') 
  }

  if (!user) return <div className="min-h-screen flex justify-center items-center text-white">Loading...</div>

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh]">
      
      {/* The Collapsible Sidebar */}
      <Navbar user={user} onSignOut={signOut} />

      {/* Pass the signOut function into UserDashboard here! */}
      <UserDashboard user={user} onSignOut={signOut} />

    </div>
  )
}