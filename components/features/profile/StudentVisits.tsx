'use client'
import { Visit } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'

export default function StudentVisits({ visits, reasonChartData }: { visits: Visit[], reasonChartData: any[] }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* LEFT: Entry Logs */}
      <div className="w-full lg:w-[65%] xl:w-[75%] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Entry Logs</h2>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-full text-xs">
            {visits.length} Visits
          </span>
        </div>
        
        <div className="p-2 sm:p-4 overflow-y-auto max-h-[600px]">
          {visits.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {visits.map(visit => (
                <li key={visit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg mb-1">{visit.reason}</p>
                    <p className="text-xs text-gray-500 font-mono tracking-wider">Entry No: {visit.id.split('-')[0]}</p>
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
            <div className="p-16 text-center text-gray-500 dark:text-gray-400">
              No visits recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Stats & Charts */}
      <div className="w-full lg:w-[35%] xl:w-[25%] flex flex-col gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[200px]">
          <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-3 block">Total Visits</span>
          <span className="text-7xl font-extrabold text-blue-600 dark:text-blue-400">{visits.length}</span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl flex flex-col min-h-[350px]">
          <h2 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-1">Reason Frequency</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">Breakdown of personal visits</p>
          <div className="flex-1 w-full mt-2">
            {reasonChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 'dataMax']} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'var(--tw-prose-bg)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="count" position="right" fontSize={11} fill="#888" fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}