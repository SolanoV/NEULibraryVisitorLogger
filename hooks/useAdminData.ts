import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { Visit, Profile } from '@/types'

export function useAdminData(profile: Profile) {
  // --- LOGS STATE ---
  const [visits, setVisits] = useState<Visit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('today') 
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('') 
  const [userTypeFilter, setUserTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // --- PROFILES STATE ---
  const [activeTab, setActiveTab] = useState<'logs' | 'profiles'>('logs')
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [blockedUsers, setBlockedUsers] = useState<Profile[]>([])
  const [profileSearch, setProfileSearch] = useState('')
  const [profileTypeFilter, setProfileTypeFilter] = useState('')
  const [profileRoleFilter, setProfileRoleFilter] = useState('')

  const [loading, setLoading] = useState(true)

  const reasonsList = ['Reading', 'Research', 'Use of Computer', 'Studying', 'Wi-Fi', 'Book Borrowing', 'Waiting for Classes', 'Other']

  // === FILTER MEMORY ===
  // 1. Restore filters from the browser's memory when the dashboard loads
  useEffect(() => {
    const savedFilters = sessionStorage.getItem('adminDashboardFilters')
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters)
      if (parsed.searchQuery) setSearchQuery(parsed.searchQuery)
      if (parsed.dateFilter) setDateFilter(parsed.dateFilter)
      if (parsed.categoryFilter) setCategoryFilter(parsed.categoryFilter)
      if (parsed.userTypeFilter) setUserTypeFilter(parsed.userTypeFilter)
      
      if (parsed.activeTab) setActiveTab(parsed.activeTab)
      if (parsed.profileSearch) setProfileSearch(parsed.profileSearch)
      if (parsed.profileTypeFilter) setProfileTypeFilter(parsed.profileTypeFilter)
      if (parsed.profileRoleFilter) setProfileRoleFilter(parsed.profileRoleFilter)
    }
  }, [])

  // 2. Save filters to memory automatically whenever you type or click a dropdown
  useEffect(() => {
    const filters = { 
      searchQuery, dateFilter, categoryFilter, userTypeFilter,
      activeTab, profileSearch, profileTypeFilter, profileRoleFilter
    }
    sessionStorage.setItem('adminDashboardFilters', JSON.stringify(filters))
  }, [searchQuery, dateFilter, categoryFilter, userTypeFilter, activeTab, profileSearch, profileTypeFilter, profileRoleFilter])


  // === 1. DATA FETCHING ===
  useEffect(() => {
    async function fetchAllData() {
      setLoading(true)

      // A. Fetch Visits
      let query = supabase
        .from('visits')
        .select(`
          id, created_at, reason, user_id,
          profiles ( id, full_name, school_id, college_office, is_blocked, avatar_url, user_type, role ) 
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

      // B. Fetch ALL Profiles (Used for the new tab!)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })
      
      if (profilesData) {
        const typedProfiles = profilesData as Profile[]
        setAllProfiles(typedProfiles)
        // Automatically derive blocked users from the master list
        setBlockedUsers(typedProfiles.filter(p => p.is_blocked))
      }
      
      setLoading(false)
    }
    fetchAllData()
  }, [dateFilter, customStart, customEnd])


  // === 2. ACTIONS ===
  const toggleBlockStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    if (userId === profile.id) {
      alert("Self-harm detected! You cannot block your own account.")
      return
    }

    // Fetch the target user's role to check hierarchy
    const { data: targetUser } = await supabase.from('profiles').select('role').eq('id', userId).single()
    const targetIsAdmin = targetUser?.role === 'admin' || targetUser?.role === 'superadmin'
    
    if (targetIsAdmin && profile.role !== 'superadmin') {
      alert("Permission Denied: Only a Superadmin can modify other Admin accounts.")
      return
    }
    
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

      // Update the Visits table state
      setVisits(visits.map(v => 
        v.user_id === userId 
          ? { ...v, profiles: { ...v.profiles, is_blocked: newStatus } } 
          : v
      ))

      // Update the Profiles table state and Sidebar
      const updatedProfiles = allProfiles.map(p => p.id === userId ? { ...p, is_blocked: newStatus } : p)
      setAllProfiles(updatedProfiles)
      setBlockedUsers(updatedProfiles.filter(p => p.is_blocked))
    } else {
      console.error(error.message)
      alert("Security Error: Check Supabase RLS policies.")
    }
  }


  // === 3. FILTERING & MATH: ENTRY LOGS ===
  const filteredData = useMemo(() => {
    return visits.filter(v => {
      const viewerIsStaffOnly = profile.role === 'user' && profile.user_type === 'staff';
      if (viewerIsStaffOnly && (v.profiles?.role === 'admin' || v.profiles?.role === 'superadmin')) {
        return false;
      }
      
      const safeReason = v.reason || ''
      if (categoryFilter && !safeReason.includes(categoryFilter)) return false

      const actualUserType = v.profiles?.user_type === 'staff' ? 'staff' : 'student'
      if (userTypeFilter && actualUserType !== userTypeFilter) return false

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
  }, [visits, searchQuery, categoryFilter, userTypeFilter, profile])

  useEffect(() => {
    setCurrentPage(1) 
  }, [searchQuery, categoryFilter, userTypeFilter, dateFilter, customStart, customEnd])

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


  // === 4. FILTERING & MATH: PROFILES ===
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(p => {
      const viewerIsStaffOnly = profile.role === 'user' && profile.user_type === 'staff';
      if (viewerIsStaffOnly && (p.role === 'admin' || p.role === 'superadmin')) {
        return false;
      }
      
        // Role Math
      if (profileRoleFilter && p.role !== profileRoleFilter) return false
      
      // User Type Math
      const actualType = p.user_type === 'staff' ? 'staff' : 'student'
      if (profileTypeFilter && actualType !== profileTypeFilter) return false
      
      // Search Math
      if (profileSearch) {
        const lowerQ = profileSearch.toLowerCase()
        const matches = (
          (p.full_name || '').toLowerCase().includes(lowerQ) ||
          (p.school_id || '').toLowerCase().includes(lowerQ) ||
          (p.college_office || '').toLowerCase().includes(lowerQ)
        )
        if (!matches) return false
      }
      return true
    })
  }, [allProfiles, profileSearch, profileTypeFilter, profileRoleFilter])


  // === 5. RETURN EVERYTHING THE UI NEEDS ===
  return {
    loading,
    blockedUsers,
    
    // Logs Tab
    searchQuery, setSearchQuery,
    dateFilter, setDateFilter,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    categoryFilter, setCategoryFilter,
    userTypeFilter, setUserTypeFilter,
    currentPage, setCurrentPage,
    itemsPerPage,
    reasonsList,
    filteredData,
    paginatedData,
    totalPages,
    startIndex,
    reasonChartData,
    trafficChartData,
    
    // Profiles Tab
    activeTab, setActiveTab,
    profileSearch, setProfileSearch,
    profileTypeFilter, setProfileTypeFilter,
    profileRoleFilter, setProfileRoleFilter,
    filteredProfiles,
    
    // Actions
    toggleBlockStatus
  }
}