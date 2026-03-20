'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import ProfileHeader from './profile/ProfileHeader'

export default function ProfileClient({ targetUserId }: { targetUserId?: string } = {}) {
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [visits, setVisits] = useState<any[]>([])
  const [adminLogs, setAdminLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerRole, setViewerRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      setViewerRole(myProfile?.role)

      const activeId = targetUserId || session.user.id

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeId)
        .single()
      setProfile(profileData)

      if (profileData?.role === 'admin' || profileData?.role === 'superadmin') {
        const { data: logsData } = await supabase
          .from('admin_logs')
          .select('*')
          .eq('admin_id', activeId)
          .order('created_at', { ascending: false })
        setAdminLogs(logsData || [])
      } else {
        const { data: visitsData } = await supabase
          .from('visits')
          .select('*')
          .eq('user_id', activeId)
          .order('created_at', { ascending: false })
        setVisits(visitsData || [])
      }
      
      setLoading(false)
    }
    loadData()
  }, [targetUserId, router])

  // === DATABASE UPDATE FUNCTION ===
  // === DATABASE UPDATE FUNCTION ===
  const handleUpdateProfile = async (updatedFields: any) => {
    
    // 1. 🚨 THE SUPERADMIN TRANSFER PROTOCOL 🚨
    if (updatedFields.role === 'superadmin' && profile.id !== user.id) {
      const confirmTransfer = window.confirm(
        "🚨 CRITICAL SECURITY ACTION 🚨\n\nAre you sure you want to TRANSFER your Superadmin rights to this user?\n\nYou will be demoted to a standard Admin and will lose the ability to assign Admin roles or block other Admins."
      )
      if (!confirmTransfer) return

      // Step A: Promote the Target User
      const { error: targetError } = await supabase.from('profiles').update(updatedFields).eq('id', profile.id)
      if (targetError) {
        alert("Failed to transfer profile: " + targetError.message)
        return
      }

      // Step B: Demote the Current User
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)

      // Step C: Log the historical event
      await supabase.from('admin_logs').insert([{
        admin_id: user.id,
        target_user_id: profile.id,
        target_user_name: updatedFields.full_name || profile.full_name,
        action: 'Transferred Superadmin Rights'
      }])

      alert("Superadmin rights successfully transferred. You are now an Admin.")
      // Force a hard reload to kick them back to the main dashboard and refresh their security token
      window.location.href = '/' 
      return
    }

    // 2. NORMAL UPDATE LOGIC (For name changes, regular admin promotions, etc.)
    const { error } = await supabase
      .from('profiles')
      .update(updatedFields)
      .eq('id', profile.id)

    if (error) {
      alert("Failed to update profile: " + error.message)
      return
    }

    if (viewerRole === 'admin' || viewerRole === 'superadmin') {
      await supabase.from('admin_logs').insert([{
        admin_id: user.id,
        target_user_id: profile.id,
        target_user_name: updatedFields.full_name || profile.full_name,
        action: 'Updated Profile Information'
      }])
    }

    setProfile({ ...profile, ...updatedFields })
  }

  const reasonChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    visits.forEach(v => {
      const safeReason = v.reason || 'Unknown'
      safeReason.split(', ').forEach((r: string) => {
        counts[r] = (counts[r] || 0) + 1
      })
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [visits])

  if (loading) return <div className="p-20 text-center text-black dark:text-white">Loading Profile...</div>
  if (!profile) return <div className="p-20 text-center text-black dark:text-white">Profile not found.</div>

  const isAdminProfile = profile?.role === 'admin' || profile?.role === 'superadmin'

  return (
    <div className="w-full max-w-[95%] mx-auto py-8 animate-in fade-in duration-500 flex flex-col gap-6">

      {/* HEADER SECTION (Now receives the update function & roles) */}
      <ProfileHeader 
        profile={profile} 
        user={user} 
        targetUserId={targetUserId} 
        isAdminProfile={isAdminProfile}
        viewerRole={viewerRole}
        onUpdate={handleUpdateProfile}
      />

      {/* DYNAMIC CONTENT (Admin Logs OR Student Visits) */}
      {isAdminProfile ? (
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
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                No administrative actions recorded yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Entry Logs */}
          <div className="w-full lg:flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
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
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{new Date(visit.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(visit.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-16 text-center text-gray-500 dark:text-gray-400">No visits recorded yet.</div>
              )}
            </div>
          </div>

          {/* RIGHT: Stats & Charts */}
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-6">
            
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
      )}
    </div>
  )
}