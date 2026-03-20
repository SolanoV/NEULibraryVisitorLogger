'use client'
import Link from 'next/link'
import { Profile } from '@/types'
import UserBadge from '../../ui/UserBadge'

export default function ProfilesTable({ 
  profiles, 
  toggleBlockStatus, 
  viewerProfile 
}: any) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-500 flex justify-between items-center">
        <span>Total Users: {profiles.length}</span>
      </div>
      
      <div className="overflow-y-auto max-h-[600px] p-2 sm:p-4 flex-1">
        {profiles.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {profiles.map((targetProfile: Profile) => {
              
              // === STRICT SECURITY MATH ===
              const isSelf = viewerProfile?.id === targetProfile.id
              const targetIsAdminOrHigher = targetProfile.role === 'admin' || targetProfile.role === 'superadmin'
              const viewerIsSuper = viewerProfile?.role === 'superadmin'
              const viewerIsAdmin = viewerProfile?.role === 'admin'
              
              // 1. You MUST be an Admin or Superadmin to see action buttons
              // 2. You cannot block yourself
              // 3. Regular admins cannot block other admins
              const canAction = (viewerIsAdmin || viewerIsSuper) && !isSelf && (viewerIsSuper || !targetIsAdminOrHigher)

              return (
                <li key={targetProfile.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    {targetProfile.avatar_url ? (
                      <img src={targetProfile.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                        {targetProfile.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {/* THE LINK (Removed target="_blank") */}
                        <Link href={`/profile/${targetProfile.id}`} className="font-extrabold text-black dark:text-white text-lg hover:text-blue-600 transition-colors">
                          {targetProfile.full_name || 'Unknown User'}
                        </Link>
                        <UserBadge profile={targetProfile} />
                        {targetProfile.is_blocked && <span className="px-2.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-md font-bold uppercase tracking-wider">Blocked</span>}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {targetProfile.school_id || targetProfile.position || 'No ID'} • {targetProfile.college_office || 'No Department'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {/* ONLY SHOW BUTTON IF THEY HAVE ADMIN RIGHTS */}
                    {canAction ? (
                      <button 
                        onClick={() => toggleBlockStatus(targetProfile.id, targetProfile.is_blocked || false, targetProfile.full_name || 'Unknown User')} 
                        className={`text-xs font-bold px-4 py-2 rounded transition-all active:scale-95 ${targetProfile.is_blocked ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {targetProfile.is_blocked ? 'Unblock Access' : 'Block Access'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 border border-gray-100 dark:border-gray-800 rounded">
                        {isSelf ? "You" : "View Only"}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500">No profiles found matching your filters.</div>
        )}
      </div>
    </div>
  )
}