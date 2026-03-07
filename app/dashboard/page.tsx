'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient' // Notice the double dots because we are one folder deeper!
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user) // Store the user data to display it
      } else {
        router.push('/') // SECURITY: Kick them back to login if they have no session
      }
    })
  }, [router])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/') // Send them back to the login page after logging out
  }

  // Prevent flashing the screen while checking auth
  if (!user) return <div className="min-h-screen bg-black text-white flex justify-center items-center">Loading...</div>

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-24">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl text-center space-y-6">
        <h1 className="text-2xl font-bold text-green-400">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, {user.user_metadata?.full_name || 'User'}
        </p>
        
        {user.user_metadata?.avatar_url && (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="Profile" 
            className="w-20 h-20 rounded-full mx-auto border-2 border-green-400"
          />
        )}

        <button 
          onClick={signOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}