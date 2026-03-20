'use client'
import SearchFilter from '../ui/SearchFilter'
import EntryLogsTable from './admin/EntryLogsTable'
import AdminSidebar from './admin/AdminSidebar'
import { useAdminData } from '@/hooks/useAdminData'

export default function AdminDashboard({ profile }: { profile: any }) {
  // 1. Get the data from our separated logic file (The Brain)
  const {
    loading, blockedUsers, searchQuery, setSearchQuery, dateFilter, setDateFilter,
    customStart, setCustomStart, customEnd, setCustomEnd, categoryFilter, setCategoryFilter,
    currentPage, setCurrentPage, itemsPerPage, reasonsList, 
    filteredData, paginatedData, totalPages, startIndex, reasonChartData, trafficChartData, toggleBlockStatus
  } = useAdminData(profile)

  if (loading) return <div className="text-black dark:text-white flex justify-center py-20">Loading Administration Data...</div>

  // 2. Render the layout (The Face)
  return (
    <div className="w-full max-w-[95%] mx-auto animate-in fade-in duration-500 flex flex-col lg:flex-row gap-6 mb-12">
      
      {/* LEFT SIDE */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">
        
        {/* TOP FILTERS */}
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
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="">All Categories</option>
                  {reasonsList.map((r: string) => <option key={r} value={r}>{r}</option>)}
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

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-5 flex flex-col items-center justify-center min-w-[180px]">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Visitors</span>
            <span className="text-6xl font-extrabold text-blue-600 dark:text-blue-400">{filteredData.length}</span>
          </div>
        </div>

        {/* INJECT OUR NEW TABLE COMPONENT */}
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
        />

      </div>

      {/* INJECT OUR NEW SIDEBAR COMPONENT */}
      <AdminSidebar 
        blockedUsers={blockedUsers}
        toggleBlockStatus={toggleBlockStatus}
        reasonChartData={reasonChartData}
        trafficChartData={trafficChartData}
      />

    </div>
  )
}