'use client'

export default function AdminAuditLogs({ adminLogs }: { adminLogs: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col w-full">
      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Administrative Actions</h2>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-full text-xs">
          {adminLogs.length} Records
        </span>
      </div>
      
      <div className="p-2 sm:p-4">
        {adminLogs.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {adminLogs.map(log => (
              <li key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-xl">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg mb-1">{log.action}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    Target: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700">{log.target_user_name || log.target_user_id}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            No administrative actions recorded yet.
          </div>
        )}
      </div>
    </div>
  )
}