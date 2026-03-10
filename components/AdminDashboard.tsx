'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SearchFilter from './SearchFilter' // Importing your clean search bar!

export default function AdminDashboard({ profile }: { profile: any }) {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') // The unified search state

  const todayStr = new Date().toLocaleDateString('en-CA')

  useEffect(() => {
    async function fetchAllData() {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id, created_at, reason,
          profiles ( full_name, school_id, college_office )
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setVisits(data)
      }
      setLoading(false)
    }
    fetchAllData()
  }, [])

  // --- UNIFIED FILTER LOGIC ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return visits
    
    const lowerQ = searchQuery.toLowerCase()
    return visits.filter(v => {
      const dateStr = new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
      
      return (
        v.profiles?.full_name?.toLowerCase().includes(lowerQ) ||
        v.profiles?.school_id?.toLowerCase().includes(lowerQ) ||
        v.profiles?.college_office?.toLowerCase().includes(lowerQ) ||
        v.reason.toLowerCase().includes(lowerQ) ||
        dateStr.includes(lowerQ) ||
        v.id.toLowerCase().includes(lowerQ) // Allows searching by Entry No!
      )
    })
  }, [visits, searchQuery])

  // --- STATISTICS CALCULATIONS ---
  const todayLogsCount = visits.filter(v => new Date(v.created_at).toLocaleDateString('en-CA') === todayStr).length

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    visits.forEach(v => {
      const date = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      counts[date] = (counts[date] || 0) + 1
    })
    return Object.entries(counts).map(([date, count]) => ({ date, count })).slice(0, 7).reverse()
  }, [visits])

  if (loading) return <div className="text-black dark:text-white flex justify-center py-20">Loading Administration Data...</div>

  return (
    // Removed the top margin (mt-4) to tighten up the spacing under the Navbar
    <div className="w-full max-w-[95%] mx-auto animate-in fade-in duration-500 flex flex-col gap-6">
      
      {/* HEADER & SUPERADMIN CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">Library Administration</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage entry logs and monitor library traffic.</p>
        </div>
        
        {profile?.role === 'superadmin' && (
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-md active:scale-95">
            Staff Management
          </button>
        )}
      </div>

      {/* TOP ROW: STATISTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <h2 className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Today's Total Entries</h2>
          <p className="text-7xl font-extrabold text-blue-600 dark:text-blue-400">{todayLogsCount}</p>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl h-64">
          <h2 className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">Traffic Overview (Last 7 Active Days)</h2>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM SECTION: UNIFIED SEARCH & LIST HISTORY */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl flex flex-col mb-8">
        
        {/* Search Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Entry Logs</h3>
          <div className="w-full sm:w-auto flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {filteredData.length} {filteredData.length === 1 ? 'entry' : 'entries'} found
            </span>
            {/* Unified Search Bar */}
            <div className="w-full sm:w-72">
              <SearchFilter 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search by name, ID, reason, date..." 
              />
            </div>
          </div>
        </div>

        {/* Scrollable History List */}
        <div className="overflow-auto max-h-[600px] p-2 sm:p-4">
          {filteredData.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.map((visit) => (
                <li key={visit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-xl">
                  
                  {/* Left Side: Name, ID, Reason, Entry No */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                      <span className="font-extrabold text-black dark:text-white text-lg">
                        {visit.profiles?.full_name || 'Unknown User'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md font-mono border border-gray-200 dark:border-gray-700 tracking-wider">
                        {visit.profiles?.school_id || 'STAFF'}
                      </span>
                    </div>
                    
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {visit.reason}
                    </p>
                    
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider">
                      Entry No: {visit.id.split('-')[0]}
                    </p>
                  </div>

                  {/* Right Side: Timestamp */}
                  <div className="text-left sm:text-right bg-white dark:bg-gray-900 sm:bg-transparent p-3 sm:p-0 rounded-lg border border-gray-100 dark:border-none sm:border-none shadow-sm sm:shadow-none">
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
              No logs found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}