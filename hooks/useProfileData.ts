import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { useRouter } from 'next/navigation'
import { Profile, Visit } from '@/types'

export function useProfileData(targetUserId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [visits, setVisits] = useState<Visit[]>([])
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
      
      setProfile(profileData as Profile)

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
        setVisits(visitsData as Visit[] || [])
      }
      
      setLoading(false)
    }
    loadData()
  }, [targetUserId, router])

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

  const isAdminProfile = profile?.role === 'admin' || profile?.role === 'superadmin'

  return {
    profile, user, visits, adminLogs, loading, viewerRole, reasonChartData, isAdminProfile, targetUserId
  }
}