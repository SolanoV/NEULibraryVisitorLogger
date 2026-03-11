'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient' 
import { useRouter } from 'next/navigation'
import SearchFilter from './SearchFilter'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [visits, setVisits] = useState<any[]>([]) 
  const [adminLogs, setAdminLogs] = useState<any[]>([]) // NEW: Stores admin audit logs
  const [searchQuery, setSearchQuery] = useState('') 
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
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

      // 2. Conditional Fetching based on Role
      if (profileData?.role === 'admin' || profileData?.role === 'superadmin') {
        // Fetch Admin Actions
        const { data: logsData } = await supabase
          .from('admin_logs')
          .select('*')
          .eq('admin_id', session.user.id)
          .order('created_at', { ascending: false })
        setAdminLogs(logsData || [])
      } else {
        // Fetch Student Visits
        const { data: visitsData } = await supabase
          .from('visits')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        setVisits(visitsData || [])
      }

      setLoading(false)
    }
    loadData()
  }, [router])

  // --- FILTER: ADMIN LOGS ---
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return adminLogs
    const searchLower = searchQuery.toLowerCase()
    return adminLogs.filter(log => {
      const dateString = new Date(log.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase()
      return (
        log.target_user_name.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        dateString.includes(searchLower)
      )
    })
  }, [adminLogs, searchQuery])

  // --- FILTER: STUDENT VISITS ---
  const filteredVisits = useMemo(() => {
    if (!searchQuery) return visits
    const searchLower = searchQuery.toLowerCase()
    return visits.filter(visit => {
      const dateString = new Date(visit.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase()
      return (
        visit.reason.toLowerCase().includes(searchLower) || 
        dateString.includes(searchLower) ||
        visit.id.toLowerCase().includes(searchLower) 
      )
    })
  }, [visits, searchQuery])

  // --- CHART: STUDENT REASONS ---
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    visits.forEach(v => {
      v.reason.split(', ').forEach((r: string) => {
        counts[r] = (counts[r] || 0) + 1
      })
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [visits])

  if (loading) return <div className="min-h-screen flex justify-center items-center text-black dark:text-white">Loading Profile...</div>

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
  const roleLabel = isAdmin ? 'Administrator' : (profile?.user_type === 'staff' ? 'Staff Member' : 'Student')

  return (
    <div className="w-full max-w-[95%] mx-auto py-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= LEFT COLUMN: PROFILE & DATA LIST ================= */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl p-8 relative z-10 flex flex-col h-full">
          
          {/* USER INFORMATION HEADER */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-gray-100 dark:border-gray-800 pb-8 mb-8">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-32 h-32 bg-gray-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-500 shadow-lg">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            
            <div className="text-center md:text-left flex-1 mt-2">
              <h1 className="text-3xl font-bold text-black dark:text-white mb-1">{profile?.full_name || 'NEU User'}</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{user.email}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                {/* DYNAMIC FIELD: Shows Position for Admins/Staff, School ID for Students */}
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-0.5 uppercase tracking-wider text-xs font-bold">
                    {isAdmin || profile?.user_type === 'staff' ? 'Position' : 'School ID'}
                  </span>
                  <span className="font-semibold text-black dark:text-white">
                    {isAdmin || profile?.user_type === 'staff' ? (profile?.position || 'Administrator') : (profile?.school_id || 'Not set')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-0.5 uppercase tracking-wider text-xs font-bold">College / Office</span>
                  <span className="font-semibold text-black dark:text-white">{profile?.college_office || 'Not set'}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full">
                  {roleLabel}
                </span>
                {profile?.is_blocked && (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-full">Blocked</span>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC LIST HEADER & SEARCH */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              {isAdmin ? 'Administrative Actions' : 'Visit History'}
            </h2>
            <div className="w-full sm:w-72">
              <SearchFilter 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder={isAdmin ? "Search actions, names, dates..." : "Search reason, ID, or date..."} 
              />
            </div>
          </div>

          {/* DYNAMIC SCROLLABLE LIST */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <div className="overflow-y-auto max-h-[500px] p-2 flex-1">
              
              {/* === ADMIN LOG VIEW === */}
              {isAdmin ? (
                filteredLogs.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredLogs.map((log) => (
                      <li key={log.id} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-lg">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-white mb-1">
                            Target: <span className="text-blue-600 dark:text-blue-400">{log.target_user_name}</span>
                          </p>
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md border ${log.action.includes('Blocked User') ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'}`}>
                            {log.action}
                          </span>
                        </div>
                        <div className="text-left sm:text-right bg-white dark:bg-gray-900 sm:bg-transparent p-3 sm:p-0 rounded-lg border border-gray-100 dark:border-none sm:border-none shadow-sm sm:shadow-none">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {new Date(log.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {searchQuery ? 'No actions found matching your search.' : 'You have not made any administrative changes yet.'}
                  </div>
                )
              ) : 
              
              /* === STUDENT VISITS VIEW === */
              (
                filteredVisits.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredVisits.map((visit) => (
                      <li key={visit.id} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-lg">
                        <div className="flex-1">
                          <p className="font-bold text-blue-600 dark:text-blue-400 mb-1">{visit.reason}</p>
                          <p className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">ID: {visit.id.split('-')[0]}</p>
                        </div>
                        <div className="text-left sm:text-right bg-white dark:bg-gray-900 sm:bg-transparent p-3 sm:p-0 rounded-lg border border-gray-100 dark:border-none sm:border-none shadow-sm sm:shadow-none">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {new Date(visit.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(visit.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {searchQuery ? 'No visits found matching your search.' : 'You have not logged any visits yet.'}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STATISTICS & CHART ================= */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* DYNAMIC TOTALS CARD */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
            <h2 className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-3">
              {isAdmin ? 'Total System Actions' : 'Total Lifetime Visits'}
            </h2>
            <p className="text-7xl font-extrabold text-blue-600 dark:text-blue-400 drop-shadow-sm">
              {isAdmin ? adminLogs.length : visits.length}
            </p>
          </div>

          {/* STUDENT ONLY: REASON FREQUENCY CHART */}
          {!isAdmin && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-2xl flex-1 min-h-[400px] flex flex-col">
              <h2 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-1">Visit Reasons</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Frequency of your library activities</p>
              
              <div className="flex-1 w-full min-h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-prose-bg)' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">No data to display yet.</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}