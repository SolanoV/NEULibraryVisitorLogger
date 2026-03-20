import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { Profile } from '@/types'

export function useCheckIn(user: any, initialProfile: Profile) {
  const [localProfile, setLocalProfile] = useState<Profile>(initialProfile)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingInit, setIsLoadingInit] = useState(true) 
  const [hasVisitedToday, setHasVisitedToday] = useState(false)
  
  const [schoolId, setSchoolId] = useState('')
  const [college, setCollege] = useState('')
  const [position, setPosition] = useState('')
  const [editableName, setEditableName] = useState(localProfile?.full_name || user?.user_metadata?.full_name || '')
  
  const isFirstTime = !localProfile?.user_type
  
  const [selectedRole, setSelectedRole] = useState<'student' | 'staff' | null>(null)
  const [newUserType, setNewUserType] = useState<'student' | 'staff' | null>(null)
  
  const activeUserType = isFirstTime ? newUserType : localProfile?.user_type

  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  
  // NEW: Separate reason lists based on user type
  const studentReasonsList = ['Reading', 'Research', 'Use of Computer', 'Studying', 'Wi-Fi', 'Book Borrowing', 'Waiting for Classes', 'Other']
  const staffReasonsList = ['Research', 'Book Borrowing/Returning', 'Meeting/Consultation', 'Class/Lecture Preparation', 'Library Supervision', 'Use of Facilities', 'Other']
  
  const activeReasonsList = activeUserType === 'staff' ? staffReasonsList : studentReasonsList

  const displayGreetingName = editableName.split(',')[0].split(' ')[0] || 'User'

  // 1. CHECK FOR PREVIOUS VISITS
  useEffect(() => {
    async function checkLatestVisit() {
      // CHANGED: We removed the 'staff' bypass. Everyone gets checked now!
      if (!user?.id || isFirstTime || localProfile?.is_blocked) {
        setIsLoadingInit(false)
        return
      }
      
      const { data, error } = await supabase
        .from('visits')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const lastVisitDate = new Date(data[0].created_at).toLocaleDateString()
        const todayDate = new Date().toLocaleDateString()
        
        if (lastVisitDate === todayDate) {
          setHasVisitedToday(true)
        }
      }
      setIsLoadingInit(false)
    }
    
    checkLatestVisit()
  }, [user, localProfile, isFirstTime])

  // 2. FORM ACTIONS
  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // CHANGED: Both students and staff MUST select a reason to continue
    if (selectedReasons.length === 0) return 
    
    setIsSubmitting(true)

    try {
      // Step A: Save Profile (if first time)
      if (isFirstTime) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            user_type: activeUserType,
            full_name: editableName,
            college_office: college, // We will save the Department in this column to reuse DB space
            school_id: activeUserType === 'student' ? schoolId : null,
            position: activeUserType === 'staff' ? position : null,
            avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture
          })
          .eq('id', user.id)
        
        if (profileError) throw profileError

        setLocalProfile((prev: any) => ({
          ...prev,
          user_type: activeUserType,
          full_name: editableName,
          college_office: college,
          school_id: activeUserType === 'student' ? schoolId : null,
          position: activeUserType === 'staff' ? position : null
        }))
      }

      // Step B: Save Visit Log (CHANGED: Now applies to EVERYONE)
      const formattedReasons = selectedReasons.join(', ')
      const { error: visitError } = await supabase
        .from('visits')
        .insert([{ user_id: user.id, reason: formattedReasons }])

      if (visitError) throw visitError

      setShowSuccess(true)

    } catch (error: any) {
      console.error("Detailed Error:", error)
      alert("Database Error: " + (error.message || JSON.stringify(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetSuccess = () => {
    setShowSuccess(false)
    setHasVisitedToday(false)
    setSelectedReasons([]) 
  }

  return {
    localProfile, showSuccess, isSubmitting, isLoadingInit, hasVisitedToday, setHasVisitedToday,
    schoolId, setSchoolId, college, setCollege, position, setPosition, editableName, setEditableName,
    isFirstTime, selectedRole, setSelectedRole, newUserType, setNewUserType, activeUserType,
    selectedReasons, activeReasonsList, displayGreetingName, toggleReason, handleSubmit, resetSuccess // Changed reasonsList to activeReasonsList
  }
}