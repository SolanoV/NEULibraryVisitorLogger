'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { useRouter } from 'next/navigation'

export default function AdminSidebar({
  blockedUsers,
  toggleBlockStatus,
  reasonChartData,
  trafficChartData
}: any) {
  const router = useRouter()

  return (
    <div className="w-full lg:w-[40%] flex flex-col gap-6">
      
      {/* RESTRICTED USERS */}
      <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-xl shadow-xl flex flex-col max-h-[300px] overflow-hidden">
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center shrink-0">
          <h2 className="text-red-700 dark:text-red-400 font-bold text-lg">Restricted Access</h2>
          <span className="bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2.5 py-0.5 rounded-full text-xs font-bold">{blockedUsers.length}</span>
        </div>
        <div className="overflow-y-auto p-2">
          {blockedUsers.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {blockedUsers.map((user: any) => (
                <li key={user.id} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">{user.full_name?.charAt(0) || 'U'}</div>
                      )}
                      <div className="truncate">
                        <button onClick={() => router.push(`/profile/${user.id}`)} className="font-bold text-sm text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">
                          {user.full_name}
                        </button>
                        <p className="text-xs text-gray-500 truncate">{user.school_id || 'Staff'}</p>
                      </div>
                  </div>
                  <button onClick={() => toggleBlockStatus(user.id, true, user.full_name)} className="ml-2 text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors whitespace-nowrap">Unblock</button>
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

      {/* REASON CHART */}
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

      {/* TRAFFIC CHART */}
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
  )
}