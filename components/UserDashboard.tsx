'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import LogoutButton from './LogoutButton'

export default function UserDashboard({ user, profile, onSignOut }: { user: any, profile: any, onSignOut: () => void }) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isLoadingInit, setIsLoadingInit] = useState(true) 
  const [hasVisitedToday, setHasVisitedToday] = useState(false)
  
  const [schoolId, setSchoolId] = useState('')
  const [college, setCollege] = useState('')
  const [position, setPosition] = useState('')
  const [editableName, setEditableName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
  
  const isFirstTime = !profile?.user_type
  const [newUserType, setNewUserType] = useState<'student' | 'staff' | null>(null)
  const activeUserType = isFirstTime ? newUserType : profile?.user_type

  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const reasonsList = ['Reading', 'Research', 'Use of Computer', 'Studying', 'Wi-Fi', 'Book Borrowing', 'Waiting for Classes', 'Other']

  const displayGreetingName = editableName.split(',')[0].split(' ')[0] || 'User'

  useEffect(() => {
    async function checkLatestVisit() {
      if (!user?.id || profile?.user_type === 'staff' || isFirstTime || profile?.is_blocked) {
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
  }, [user, profile, isFirstTime])

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeUserType === 'student' && selectedReasons.length === 0) return 
    setIsSubmitting(true)

    try {
      if (isFirstTime) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            user_type: activeUserType,
            full_name: editableName,
            college_office: college,
            school_id: activeUserType === 'student' ? schoolId : null,
            position: activeUserType === 'staff' ? position : null
          })
          .eq('id', user.id)
        
        if (profileError) throw profileError
      }

      if (activeUserType === 'student') {
        const formattedReasons = selectedReasons.join(', ')
        const { error: visitError } = await supabase
          .from('visits')
          .insert([{ user_id: user.id, reason: formattedReasons }])

        if (visitError) throw visitError
      }

      setShowSuccess(true)

    } catch (error: any) {
      console.error("Detailed Error:", error)
      alert("Database Error: " + (error.message || JSON.stringify(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingInit) {
    return <div className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading dashboard...</div>
  }

  // === UI: SECURITY INTERCEPTOR (BLOCKED USERS) ===
  if (profile?.is_blocked) {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border-2 border-red-500 rounded-xl text-center animate-in fade-in zoom-in duration-300 shadow-2xl relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-200 dark:border-red-800">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-red-600 dark:text-red-400 mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
          Your account has been restricted by a Library Administrator. You cannot log entries or access the system at this time.
          <br /><br />
          <span className="text-sm font-normal text-gray-500">Please contact the NEU Library staff for assistance.</span>
        </p>
        <LogoutButton onSignOut={onSignOut} className="w-full" />
      </div>
    )
  }

  // === UI: ALREADY VISITED TODAY INTERCEPTOR ===
  if (hasVisitedToday && !showSuccess) {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900/50 rounded-xl text-center animate-in fade-in zoom-in duration-300 shadow-2xl relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">📅</span>
        </div>
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Already Checked In!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          It looks like you have already logged a visit to the library today, <span className="font-semibold text-black dark:text-white">{displayGreetingName}</span>.
        </p>
        
        <button 
          onClick={() => setHasVisitedToday(false)} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-lg transition-all shadow-sm active:scale-[0.98] mb-4"
        >
          Submit Another Entry
        </button>
        <LogoutButton onSignOut={onSignOut} />
      </div>
    )
  }

  // === UI: SUCCESS SCREEN ===
  if (showSuccess) {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border border-green-500 rounded-xl text-center animate-in fade-in zoom-in duration-300 shadow-2xl relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
          {activeUserType === 'staff' ? 'Registration Complete' : 'Welcome to NEU Library!'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {activeUserType === 'staff' 
            ? 'Your staff profile has been created successfully.' 
            : `Your visit has been recorded successfully, ${displayGreetingName}.`}
        </p>
        <LogoutButton onSignOut={onSignOut} className="mb-4" />
        <button 
          onClick={() => {
            setShowSuccess(false)
            setHasVisitedToday(false)
            setSelectedReasons([]) 
          }} 
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white underline transition-colors"
        >
          Submit another entry
        </button>
      </div>
    )
  }

  // === UI: IDENTITY SELECTION (Brand New Users) ===
  if (isFirstTime && !newUserType) {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
        <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight mb-2">Welcome!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Before we continue, please tell us how you are accessing the library today.</p>
        
        <div className="flex flex-col gap-4">
          <button onClick={() => setNewUserType('student')} className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group flex flex-col items-center gap-2">
            <span className="text-4xl mb-2">🎓</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">I am a Student</span>
          </button>
          
          <button onClick={() => setNewUserType('staff')} className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group flex flex-col items-center gap-2">
            <span className="text-4xl mb-2">💼</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">I am a Staff Member</span>
          </button>
        </div>
      </div>
    )
  }

  // === UI: RETURNING STAFF (Not an Admin yet) ===
  if (!isFirstTime && activeUserType === 'staff') {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">💼</span>
        </div>
        <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight mb-2">Staff Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Welcome back, {displayGreetingName}. Staff members are not required to log entries in the visitor system.
          <br /><br />
          If you need access to the Administration Dashboard, please contact the Superadmin.
        </p>
      </div>
    )
  }

  // === UI: THE MAIN FORM ===
  return (
    <div className={`w-full p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 transition-all duration-500 ease-in-out overflow-hidden ${isFirstTime ? 'max-w-4xl' : 'max-w-md'}`}>
      <div className="mb-8 text-center border-b border-gray-100 dark:border-gray-800 pb-6">
        <h1 className="flex flex-col gap-1 mb-2">
          <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">Welcome,</span>
          <span className="text-3xl font-medium text-gray-700 dark:text-gray-300">{displayGreetingName}!</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">
          {activeUserType === 'staff' ? 'Please complete your staff registration.' : 'Please log your visit below.'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className={`grid gap-8 ${isFirstTime ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          
          {isFirstTime && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-8 duration-500">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input required type="text" value={editableName} onChange={(e) => setEditableName(e.target.value)} className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              {activeUserType === 'student' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">School ID</label>
                  <input required type="text" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} placeholder="e.g. 01-2345-6789" className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              )}

              {activeUserType === 'staff' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Position / Job Title</label>
                  <input required type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Professor, IT Support" className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">College / Office</label>
                <select required value={college} onChange={(e) => setCollege(e.target.value)} className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                  <option value="" disabled>Select your college...</option>
                  <option value="College of Informatics and Computing Studies">College of Informatics and Computing Studies</option>
                  <option value="College of Engineering and Architecture">College of Engineering and Architecture</option>
                  <option value="College of Nursing">College of Nursing</option>
                  <option value="College of Law">College of Law</option>
                  <option value="College of Business Administration">College of Business Administration</option>
                  <option value="College of Arts and Sciences">College of Arts and Sciences</option>
                  <option value="College of Education">College of Education</option>
                  <option value="College of Criminology">College of Criminology</option>
                  <option value="Other">Other / Non-Academic Office</option>
                </select>
              </div>
            </div>
          )}

          {activeUserType === 'student' && (
            <div className="flex flex-col justify-center animate-in fade-in">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Reason for Visiting <span className="text-gray-400 font-normal">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {reasonsList.map((reason) => {
                  const isSelected = selectedReasons.includes(reason)
                  return (
                    <button key={reason} type="button" onClick={() => toggleReason(reason)} className={`p-3 rounded-lg border text-sm font-medium transition-all text-left flex items-center justify-between ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'}`}>
                      {reason}
                      {isSelected && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={(activeUserType === 'student' && selectedReasons.length === 0) || isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] mt-2"
        >
          {isSubmitting ? 'Processing...' : (activeUserType === 'staff' ? 'Register Profile' : 'Check In')}
        </button>
      </form>
    </div>
  )
}