'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SearchFilter from './SearchFilter'
import { useRouter } from 'next/navigation'

export default function AdminDashboard({ profile }: { profile: any }) {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const [dateFilter, setDateFilter] = useState('today') // We can safely change this back to 'today' now!
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('') 

  const reasonsList = ['Reading', 'Research', 'Use of Computer', 'Studying', 'Wi-Fi', 'Book Borrowing', 'Waiting for Classes', 'Other']

  // === BULLETPROOF DATE FORMATTER ===
  // This guarantees YYYY-MM-DD output regardless of browser or OS timezone quirks
  const formatYMD = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  useEffect(() => {
    async function fetchAllData() {
      // FIX 1: Removed 'avatar_url' from the query because it doesn't exist in the profiles table!
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id, created_at, reason, user_id,
          profiles ( id, full_name, school_id, college_office, is_blocked )
        `)
        .order('created_at', { ascending: false })

      // Added a console error so if Supabase ever fails again, you can see exactly why in the browser console!
      if (error) {
        console.error("Supabase Query Error:", error.message)
      } else if (data) {
        setVisits(data)
      }
      setLoading(false)
    }
    fetchAllData()
  }, [])

  const toggleBlockStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const newStatus = !currentStatus
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: newStatus })
      .eq('id', userId)

    if (!error) {
      // SUCCESS! Now log this action into our new admin_logs table
      await supabase.from('admin_logs').insert([{
        admin_id: profile.id, 
        target_user_id: userId,
        target_user_name: userName,
        action: newStatus ? 'Blocked User' : 'Unblocked User'
      }])

      // Update the UI instantly
      setVisits(visits.map(v => 
        v.user_id === userId 
          ? { ...v, profiles: { ...v.profiles, is_blocked: newStatus } } 
          : v
      ))
    } else {
      alert("Failed to update user status.")
    }
  }

  // --- FILTER LOGIC (Category & Date) ---
  const filteredData = useMemo(() => {
    const now = new Date()
    const todayYMD = formatYMD(now)
    
    const past7 = new Date(now)
    past7.setDate(now.getDate() - 7)
    past7.setHours(0, 0, 0, 0)
    
    const pastFewWeeks = new Date(now)
    pastFewWeeks.setDate(now.getDate() - 21)
    pastFewWeeks.setHours(0, 0, 0, 0)

    return visits.filter(v => {
      // 1. Apply Category Filter 
      const safeReason = v.reason || ''
      if (categoryFilter && !safeReason.includes(categoryFilter)) return false

      // 2. Apply Date Filter
      const vDateObj = new Date(v.created_at)
      const vDateYMD = formatYMD(vDateObj)

      if (dateFilter === 'today' && vDateYMD !== todayYMD) return false
      if (dateFilter === '7days' && vDateObj < past7) return false
      if (dateFilter === 'weeks' && vDateObj < pastFewWeeks) return false
      if (dateFilter === 'custom') {
        if (customStart && vDateYMD < customStart) return false
        if (customEnd && vDateYMD > customEnd) return false
      }

      // 3. Apply Unified Search
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase()
        const niceDateStr = new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
        
        // FIX 2: Added ( || '') fallbacks so the search bar doesn't crash if a profile is missing a name or ID
        const matchesSearch = (
          (v.profiles?.full_name || '').toLowerCase().includes(lowerQ) ||
          (v.profiles?.school_id || '').toLowerCase().includes(lowerQ) ||
          (v.profiles?.college_office || '').toLowerCase().includes(lowerQ) ||
          safeReason.toLowerCase().includes(lowerQ) ||
          niceDateStr.includes(lowerQ) ||
          (v.id || '').toLowerCase().includes(lowerQ)
        )
        if (!matchesSearch) return false
      }

      return true
    })
  }, [visits, searchQuery, dateFilter, customStart, customEnd, categoryFilter])


  // --- STATS LOGIC ---
  const todayLogsCount = visits.filter(v => formatYMD(new Date(v.created_at)) === formatYMD(new Date())).length

  // Reason Chart Data (Added safety for null reasons)
  const reasonChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredData.forEach(v => {
      const safeReason = v.reason || 'Unknown'
      safeReason.split(', ').forEach((r: string) => {
        counts[r] = (counts[r] || 0) + 1
      })
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredData])

  // Traffic Overview (Added safety for null reasons)
  const trafficChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    
    const categoryFilteredVisits = categoryFilter 
      ? visits.filter(v => (v.reason || '').includes(categoryFilter))
      : visits

    categoryFilteredVisits.forEach(v => {
      const date = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      counts[date] = (counts[date] || 0) + 1
    })
    
    return Object.entries(counts).map(([date, count]) => ({ date, count })).slice(0, 7).reverse()
  }, [visits, categoryFilter])


  if (loading) return <div className="text-black dark:text-white flex justify-center py-20">Loading Administration Data...</div>

  return (
    <div className="w-full max-w-[95%] mx-auto animate-in fade-in duration-500 flex flex-col lg:flex-row gap-6">
      
      {/* ================= LEFT SIDE: ENTRY LOGS & FILTERS (60%) ================= */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-5 flex flex-col gap-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Entry Logs</h3>
            <div className="w-full sm:w-1/2">
              <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, ID, reason..." />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {reasonsList.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex flex-col lg:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Time Range</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 flex-1"
                >
                  <option value="all">All Time</option>
                  <option value="today">Current Day</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="weeks">Last Few Weeks</option>
                  <option value="custom">Specific Range</option>
                </select>

                {dateFilter === 'custom' && (
                  <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-left-2">
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full p-2.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white" />
                    <span className="text-gray-400">-</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full p-2.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex-1 min-h-[500px] flex flex-col">
          <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-500 flex justify-between items-center">
            <span>Showing {filteredData.length} records</span>
            {dateFilter === 'today' && <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">Today's Logs</span>}
          </div>
          
          <div className="overflow-y-auto max-h-[700px] p-2 sm:p-4">
            {filteredData.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredData.map((visit) => (
                  <li key={visit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-xl relative group">
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-1.5 relative">
                        
                        <div className="relative inline-block">
                          <span className="font-extrabold text-black dark:text-white text-lg cursor-help border-b border-dashed border-gray-400 dark:border-gray-600 peer">
                            {visit.profiles?.full_name || 'Unknown User'}
                          </span>
                          
                          <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 opacity-0 invisible peer-hover:opacity-100 peer-hover:visible hover:opacity-100 hover:visible transition-all duration-200 z-50">
                            <div className="flex items-center gap-3 mb-3">
                              {visit.profiles?.avatar_url ? (
                                <img src={visit.profiles.avatar_url} alt="avatar" className="w-10 h-10 rounded-full border border-blue-500" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{visit.profiles?.full_name?.charAt(0) || 'U'}</div>
                              )}
                              <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{visit.profiles?.full_name}</p>
                                <p className="text-xs text-gray-500">{visit.profiles?.college_office}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <button onClick={() => router.push(`/admin/user/${visit.user_id}`)} className="w-full text-xs font-bold py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors">
                                Go to Profile
                              </button>
                              
                              <button 
                                onClick={() => toggleBlockStatus(visit.user_id, visit.profiles?.is_blocked, visit.profiles?.full_name || 'Unknown User')}
                                className={`w-full text-xs font-bold py-2 rounded transition-colors ${visit.profiles?.is_blocked ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'}`}
                              >
                                {visit.profiles?.is_blocked ? 'Unblock Access' : 'Block from Access'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md font-mono border border-gray-200 dark:border-gray-700 tracking-wider">
                          {visit.profiles?.school_id || 'STAFF'}
                        </span>
                        {visit.profiles?.is_blocked && (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-md font-bold uppercase tracking-wider">Blocked</span>
                        )}
                      </div>
                      
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {visit.reason}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider">
                        Entry No: {visit.id.split('-')[0]}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
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
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                No logs found matching your filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: STATISTICS & CHARTS (40%) ================= */}
      <div className="w-full lg:w-[40%] flex flex-col gap-6">
        
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
          <h2 className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Visitors</h2>
          <p className="text-7xl font-extrabold text-blue-600 dark:text-blue-400">{filteredData.length}</p>
          <p className="text-xs text-gray-400 mt-2">Based on current filters</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl flex-1 min-h-[300px] flex flex-col">
          <h2 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-1">Reason Frequency</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Breakdown of current entry log filter</p>
          
          <div className="flex-1 w-full h-[250px]">
            {reasonChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'var(--tw-prose-bg)' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl flex-1 min-h-[300px] flex flex-col">
          <h2 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-1">Traffic Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Last 7 days (Affected by Category Filter)</p>
          
          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}