'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient' 
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Link from 'next/link'
import SearchFilter from './SearchFilter'

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [visits, setVisits] = useState<any[]>([]) // NEW: State to hold their visit history
  const [searchQuery, setSearchQuery] = useState('') // NEW: State for the search bar
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProfileAndVisits() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)

      // 2. Fetch Visits (Ordered by newest first)
      const { data: visitsData } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setVisits(visitsData || [])

      setLoading(false)
    }

    loadProfileAndVisits()
  }, [router])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/') 
  }

  // FILTER LOGIC: Search through reasons or dates
  const filteredVisits = visits.filter(visit => {
    const searchLower = searchQuery.toLowerCase()
    const dateString = new Date(visit.created_at).toLocaleDateString().toLowerCase()
    return visit.reason.toLowerCase().includes(searchLower) || dateString.includes(searchLower)
  })

  if (loading) return <div className="min-h-screen flex justify-center items-center text-black dark:text-white">Loading Profile...</div>

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh] py-8 animate-in fade-in duration-500">
      
      

      {/* Expanded the max-width to 4xl to give the history table room to breathe */}
      <div className="w-full max-w-4xl p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10">
        
        {/* === SECTION 1: USER INFORMATION HEADER === */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-gray-100 dark:border-gray-800 pb-8 mb-8">
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg object-cover" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-500 shadow-lg">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
          )}
          
          <div className="text-center md:text-left flex-1 mt-2">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-1">
              {profile?.full_name || 'NEU User'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{user.email}</p>
            
            {/* Moved School ID & College directly under the name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-0.5 uppercase tracking-wider text-xs font-bold">School ID</span>
                <span className="font-semibold text-black dark:text-white">{profile?.school_id || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-0.5 uppercase tracking-wider text-xs font-bold">College / Office</span>
                <span className="font-semibold text-black dark:text-white">{profile?.college_office || 'Not set'}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
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

        {/* === SECTION 2: ENTRY HISTORY & SEARCH === */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">Visit History</h2>
          <SearchFilter 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search by reason or date..." 
          />
        </div>

        {/* Scrollable History List */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8 max-h-[400px] overflow-y-auto">
          {filteredVisits.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredVisits.map((visit) => (
                <li key={visit.id} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <p className="font-semibold text-black dark:text-white">{visit.reason}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Entry ID: {visit.id.split('-')[0]}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(visit.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(visit.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No visits found matching your search.' : 'You have not logged any visits yet.'}
            </div>
          )}
        </div>

        {/* NAVIGATION BACK */}
        <div className="flex justify-center pt-4 border-t border-gray-100 dark:border-gray-800">
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