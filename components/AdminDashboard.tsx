'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import SearchFilter from './SearchFilter'
import { useRouter } from 'next/navigation'

export default function AdminDashboard({ profile }: { profile: any }) {
  const [visits, setVisits] = useState<any[]>([])
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const [dateFilter, setDateFilter] = useState('today') 
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('') 

  // --- NEW: PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const reasonsList = ['Reading', 'Research', 'Use of Computer', 'Studying', 'Wi-Fi', 'Book Borrowing', 'Waiting for Classes', 'Other']

  // --- OPTIMIZATION 1: SERVER-SIDE FETCHING ---
  useEffect(() => {
    async function fetchAllData() {
      setLoading(true)

      // 1. Build base query with a hard safety limit
      let query = supabase
        .from('visits')
        .select(`
          id, created_at, reason, user_id,
          profiles ( id, full_name, school_id, college_office, is_blocked, avatar_url )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)

      // 2. Apply Date Filters on the Database level to save bandwidth
      const now = new Date()
      if (dateFilter === 'today') {
        const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString()
        query = query.gte('created_at', startOfToday)
      } else if (dateFilter === '7days') {
        const past7 = new Date(now.setDate(now.getDate() - 7)).toISOString()
        query = query.gte('created_at', past7)
      } else if (dateFilter === 'weeks') {
        const past21 = new Date(now.setDate(now.getDate() - 21)).toISOString()
        query = query.gte('created_at', past21)
      } else if (dateFilter === 'custom' && customStart) {
        query = query.gte('created_at', new Date(customStart).toISOString())
        if (customEnd) {
          const endObj = new Date(customEnd)
          endObj.setHours(23, 59, 59, 999) // Include the whole end day
          query = query.lte('created_at', endObj.toISOString())
        }
      }

      // 3. Execute Query
      const { data: visitsData, error: visitsError } = await query

      if (visitsError) console.error("Visits Query Error:", visitsError.message)
      else if (visitsData) setVisits(visitsData)

      // 4. Fetch Restricted Users
      const { data: blockedData } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_blocked', true)
      
      if (blockedData) setBlockedUsers(blockedData)

      setLoading(false)
    }
    fetchAllData()
  }, [dateFilter, customStart, customEnd])

  const toggleBlockStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const newStatus = !currentStatus
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: newStatus })
      .eq('id', userId)

    if (!error) {
      await supabase.from('admin_logs').insert([{
        admin_id: profile.id, 
        target_user_id: userId,
        target_user_name: userName,
        action: newStatus ? 'Blocked User' : 'Unblocked User'
      }])

      setVisits(visits.map(v => 
        v.user_id === userId 
          ? { ...v, profiles: { ...v.profiles, is_blocked: newStatus } } 
          : v
      ))

      const { data: newBlocked } = await supabase.from('profiles').select('*').eq('is_blocked', true)
      if (newBlocked) setBlockedUsers(newBlocked)
      
    } else {
      console.error(error.message)
      alert("Security Error: Check Supabase RLS policies.")
    }
  }

  // --- LOCAL FILTERING (Now extremely fast) ---
  const filteredData = useMemo(() => {
    return visits.filter(v => {
      const safeReason = v.reason || ''
      
      if (categoryFilter && !safeReason.includes(categoryFilter)) return false

      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase()
        const niceDateStr = new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
        
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
  }, [visits, searchQuery, categoryFilter])

  // --- OPTIMIZATION 2: PAGINATION MATH ---
  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 if they type a new search or change category
  }, [searchQuery, categoryFilter, dateFilter, customStart, customEnd])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  // --- STATS LOGIC ---
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
    <div className="w-full max-w-[95%] mx-auto animate-in fade-in duration-500 flex flex-col lg:flex-row gap-6 mb-12">
      
      {/* ================= LEFT SIDE: ENTRY LOGS & FILTERS (60%) ================= */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">
        
        {/* TOP ROW: FILTERS + TOTAL VISITORS CARD */}
        <div className="flex flex-col sm:flex-row gap-4">
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-5 flex-1 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Entry Logs</h3>
              <div className="w-full sm:w-2/3">
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
                    <option value="today">Current Day</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="weeks">Last Few Weeks</option>
                    <option value="all">All Available</option>
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

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-5 flex flex-col items-center justify-center min-w-[180px]">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Visitors</span>
            <span className="text-6xl font-extrabold text-blue-600 dark:text-blue-400">{filteredData.length}</span>
          </div>

        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-500 flex justify-between items-center">
            <span>Showing records {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredData.length)}</span>
            {dateFilter === 'today' && <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">Today's Logs</span>}
          </div>
          
          <div className="overflow-y-auto max-h-[600px] p-2 sm:p-4 flex-1">
            {paginatedData.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedData.map((visit) => (
                  <li key={visit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-xl relative group hover:z-50">
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-1.5 relative">
                        
                        <div className="relative inline-block">
                          {/* CHANGED: This is now a clickable button that pushes to the profile URL */}
                          <button 
                            onClick={() => router.push(`/profile/${visit.user_id}`)}
                            className="font-extrabold text-left text-black dark:text-white text-lg cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors peer"
                          >
                            {visit.profiles?.full_name || 'Unknown User'}
                          </button>
                          
                          <div className="absolute left-4 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 opacity-0 invisible peer-hover:opacity-100 peer-hover:visible hover:opacity-100 hover:visible transition-all duration-200 z-[9999]">
                            <div className="flex items-center gap-3 mb-3">
                              {visit.profiles?.avatar_url ? (
                                <img src={visit.profiles.avatar_url} alt="avatar" className="w-10 h-10 rounded-full border border-blue-500 object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                  {visit.profiles?.full_name?.charAt(0) || 'U'}
                                </div>
                              )}

                              <div className="overflow-hidden">
                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{visit.profiles?.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{visit.profiles?.college_office}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <button onClick={() => router.push(`/profile/${visit.user_id}`)} className="w-full text-xs font-bold py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors">
                                View Full Profile
                              </button>
                              <button onClick={() => toggleBlockStatus(visit.user_id, visit.profiles?.is_blocked, visit.profiles?.full_name || 'Unknown User')} className={`w-full text-xs font-bold py-2 rounded transition-colors ${visit.profiles?.is_blocked ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'}`}>
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
                        {new Date(visit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(visit.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
                <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                No logs found matching your filters.
              </div>
            )}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-1.5 text-xs font-bold rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-1.5 text-xs font-bold rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT SIDE: STATISTICS & CHARTS (40%) ================= */}
      <div className="w-full lg:w-[40%] flex flex-col gap-6">
        
        <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-xl shadow-xl flex flex-col max-h-[300px] overflow-hidden">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center shrink-0">
            <h2 className="text-red-700 dark:text-red-400 font-bold text-lg">Restricted Access</h2>
            <span className="bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2.5 py-0.5 rounded-full text-xs font-bold">{blockedUsers.length}</span>
          </div>
          <div className="overflow-y-auto p-2">
            {blockedUsers.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {blockedUsers.map(user => (
                  <li key={user.id} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">{user.full_name?.charAt(0) || 'U'}</div>
                        )}
                        <div className="truncate">
                          {/* CHANGED: Name is clickable in the restricted list as well */}
                          <button 
                            onClick={() => router.push(`/profile/${user.id}`)} 
                            className="font-bold text-sm text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                          >
                            {user.full_name}
                          </button>
                          <p className="text-xs text-gray-500 truncate">{user.school_id || 'Staff'}</p>
                        </div>
                    </div>
                    <button onClick={() => toggleBlockStatus(user.id, true, user.full_name)} className="ml-2 text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors whitespace-nowrap">
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-sm text-gray-500 p-8 text-center">
                <svg className="w-8 h-8 mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                No users are currently blocked.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl flex flex-col min-h-[350px]">
          <h2 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-1">Reason Frequency</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">Breakdown of current entry log filter</p>
          
          <div className="flex-1 w-full mt-2">
            {reasonChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 'dataMax']} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'var(--tw-prose-bg)' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="count" position="right" fontSize={11} fill="#888" fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl flex flex-col min-h-[350px]">
          <h2 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-1">Traffic Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">Last 7 days (Affected by Category Filter)</p>
          
          <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 'dataMax']} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                   <LabelList dataKey="count" position="top" fontSize={11} fill="#888" fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}