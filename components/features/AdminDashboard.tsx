'use client'
import SearchFilter from '../ui/SearchFilter'
import EntryLogsTable from './admin/EntryLogsTable'
import ProfilesTable from './admin/ProfilesTable'
import AdminSidebar from './admin/AdminSidebar'
import { useAdminData } from '@/hooks/useAdminData'

export default function AdminDashboard({ profile }: { profile: any }) {
  // 1. Pull EVERYTHING from our updated Brain
  const {
    loading, blockedUsers,
    
    // Logs State
    searchQuery, setSearchQuery, dateFilter, setDateFilter,
    customStart, setCustomStart, customEnd, setCustomEnd,
    categoryFilter, setCategoryFilter, userTypeFilter, setUserTypeFilter,
    currentPage, setCurrentPage, itemsPerPage, reasonsList,
    filteredData, paginatedData, totalPages, startIndex,
    reasonChartData, trafficChartData,
    
    // Profiles State
    activeTab, setActiveTab,
    profileSearch, setProfileSearch,
    profileTypeFilter, setProfileTypeFilter,
    profileRoleFilter, setProfileRoleFilter,
    filteredProfiles,
    
    // Actions
    toggleBlockStatus
  } = useAdminData(profile)

  if (loading) return <div className="text-black dark:text-white flex justify-center py-20">Loading Administration Data...</div>

  // 2. Render the Command Center
  return (
    <div className="w-full max-w-[95%] mx-auto animate-in fade-in duration-500 flex flex-col lg:flex-row gap-6 mb-12">
      
      {/* === LEFT SIDE: TABS, FILTERS, & TABLES === */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">
        
        {/* TOP FILTERS & TABS */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-5 flex flex-col gap-5">
          
          
          {/* THE TABS */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => setActiveTab('logs')} 
              className={`py-2 px-6 font-bold text-lg border-b-2 transition-colors ${activeTab === 'logs' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Entry Logs
            </button>
            <button 
              onClick={() => setActiveTab('profiles')} 
              className={`py-2 px-6 font-bold text-lg border-b-2 transition-colors ${activeTab === 'profiles' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              User Profiles
            </button>
          </div>

          {/* DYNAMIC FILTERS BASED ON ACTIVE TAB */}
          {activeTab === 'logs' ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-full">
                <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Search logs by name, ID, reason..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="">All Categories</option>
                    {reasonsList.map((r: string) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">User Type</label>
                  <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="">All Users</option>
                    <option value="student">Students</option>
                    <option value="staff">Faculty / Staff</option>
                  </select>
                </div>
                <div className="flex flex-col lg:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Time Range</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 flex-1">
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
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-full">
                <SearchFilter value={profileSearch} onChange={setProfileSearch} placeholder="Search profiles by name, department, ID..." />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">User Type</label>
                  <select value={profileTypeFilter} onChange={(e) => setProfileTypeFilter(e.target.value)} className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white">
                    <option value="">All Types</option>
                    <option value="student">Student</option>
                    <option value="staff">Faculty / Staff</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">System Role</label>
                  <select value={profileRoleFilter} onChange={(e) => setProfileRoleFilter(e.target.value)} className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white">
                    <option value="">All Roles</option>
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                    <option value="superadmin">Super Administrator</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DYNAMIC TABLE RENDERING */}
        {activeTab === 'logs' ? (
          <div className="animate-in fade-in duration-300">
            <EntryLogsTable 
              paginatedData={paginatedData}
              filteredDataLength={filteredData.length}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              dateFilter={dateFilter}
              toggleBlockStatus={toggleBlockStatus}
              viewerProfile={profile} /* <-- 1. ADD THIS HERE */
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <ProfilesTable 
              profiles={filteredProfiles} 
              toggleBlockStatus={toggleBlockStatus} 
              viewerProfile={profile} /* <-- 2. ADD THIS HERE */
            />
          </div>
        )}

      </div>

      {/* === RIGHT SIDE: SIDEBAR CHARTS === */}
      <AdminSidebar 
        blockedUsers={blockedUsers}
        toggleBlockStatus={toggleBlockStatus}
        reasonChartData={reasonChartData}
        trafficChartData={trafficChartData}
      />

    </div>
  )
}