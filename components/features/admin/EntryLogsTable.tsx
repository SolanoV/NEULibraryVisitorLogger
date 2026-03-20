'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Visit } from '@/types'
import UserBadge from '../../ui/UserBadge'

export default function EntryLogsTable({
  paginatedData,
  filteredDataLength,
  startIndex,
  itemsPerPage,
  currentPage,
  totalPages,
  setCurrentPage,
  dateFilter,
  toggleBlockStatus,
  viewerProfile // NEW: We need to know who is viewing the table!
}: any) {
  const router = useRouter()

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-500 flex justify-between items-center">
        <span>Showing records {filteredDataLength > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredDataLength)}</span>
        {dateFilter === 'today' && <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">Today's Logs</span>}
      </div>
      
      <div className="overflow-y-auto max-h-[600px] p-2 sm:p-4 flex-1">
        {paginatedData.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.map((visit: Visit) => {
              
              // === SECURITY LOGIC FOR THE HOVER CARD ===
              const isSelf = viewerProfile?.id === visit.user_id
              const targetIsAdminOrHigher = visit.profiles?.role === 'admin' || visit.profiles?.role === 'superadmin'
              const viewerIsSuper = viewerProfile?.role === 'superadmin'
              const viewerIsAdmin = viewerProfile?.role === 'admin'
              
              // 1. Must be Admin or Superadmin to block
              // 2. Cannot block yourself
              // 3. Regular admins cannot block other admins
              const canBlock = (viewerIsAdmin || viewerIsSuper) && !isSelf && (viewerIsSuper || !targetIsAdminOrHigher)

              return (
                <li key={visit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-xl relative group hover:z-50">
                  <div className="flex-1">
                    
                    {/* TOP ROW: Name, Badges, Hover Card */}
                    <div className="flex flex-wrap items-center gap-3 mb-1.5 relative">
                      <div className="relative inline-block">
                        
                        {/* THE LINK */}
                        <Link href={`/profile/${visit.user_id}`} className="font-extrabold text-left text-black dark:text-white text-lg cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors peer">
                          {visit.profiles?.full_name || 'Unknown User'}
                        </Link>
                        
                        {/* HOVER CARD */}
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
                            {/* 2. THE BUTTON (Changed window.open back to router.push) */}
                            <button onClick={() => router.push(`/profile/${visit.user_id}`)} className="w-full text-xs font-bold py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors">
                              View Full Profile
                            </button>
                            
                            {/* NEW: RBAC Protected Block Button */}
                            {canBlock && (
                              <button onClick={() => toggleBlockStatus(visit.user_id, visit.profiles?.is_blocked || false, visit.profiles?.full_name || 'Unknown User')} className={`w-full text-xs font-bold py-2 rounded transition-colors ${visit.profiles?.is_blocked ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {visit.profiles?.is_blocked ? 'Unblock Access' : 'Block from Access'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* BADGES */}
                      <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md font-mono border border-gray-200 dark:border-gray-700 tracking-wider">
                        {visit.profiles?.school_id || 'STAFF'}
                      </span>
                      
                      {/* OUR UNIFIED BADGE */}
                      <UserBadge profile={visit.profiles || {}} />

                      {visit.profiles?.is_blocked && <span className="px-2.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] rounded-md font-bold uppercase tracking-wider">Blocked</span>}
                    </div>
                    
                    {/* BOTTOM ROW: Reason and ID */}
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{visit.reason}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider">Entry No: {visit.id.split('-')[0]}</p>
                  </div>

                  {/* TIMESTAMP */}
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{new Date(visit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(visit.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
            <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            No logs found matching your filters.
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-1.5 text-xs font-bold rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors shadow-sm">Prev</button>
            <button onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-1.5 text-xs font-bold rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors shadow-sm">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}