import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { Visit, Profile } from '@/types'

export function useAdminData(profile: Profile) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [blockedUsers, setBlockedUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [dateFilter, setDateFilter] = useState('today') 
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('') 

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const reasonsList = ['Reading', 'Research', 'Use of Computer', 'Studying', 'Wi-Fi', 'Book Borrowing', 'Waiting for Classes', 'Other']

  // 1. DATA FETCHING
  useEffect(() => {
    async function fetchAllData() {
      setLoading(true)

      let query = supabase
        .from('visits')
        .select(`
          id, created_at, reason, user_id,
          profiles ( id, full_name, school_id, college_office, is_blocked, avatar_url )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)

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
          endObj.setHours(23, 59, 59, 999) 
          query = query.lte('created_at', endObj.toISOString())
        }
      }

      const { data: visitsData, error: visitsError } = await query
      if (visitsError) console.error("Visits Query Error:", visitsError.message)
      else if (visitsData) setVisits(visitsData as Visit[])

      const { data: blockedData } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_blocked', true)
      
      if (blockedData) setBlockedUsers(blockedData as Profile[])
      setLoading(false)
    }
    fetchAllData()
  }, [dateFilter, customStart, customEnd])

  // 2. ACTIONS
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

  // 3. FILTERING & MATH
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

  useEffect(() => {
    setCurrentPage(1) 
  }, [searchQuery, categoryFilter, dateFilter, customStart, customEnd])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

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

  // 4. RETURN EVERYTHING THE UI NEEDS
  return {
    loading,
    blockedUsers,
    searchQuery, setSearchQuery,
    dateFilter, setDateFilter,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    categoryFilter, setCategoryFilter,
    currentPage, setCurrentPage,
    itemsPerPage,
    reasonsList,
    filteredData, // <--- CHANGED THIS LINE
    paginatedData,
    totalPages,
    startIndex,
    reasonChartData,
    trafficChartData,
    toggleBlockStatus
  }
}