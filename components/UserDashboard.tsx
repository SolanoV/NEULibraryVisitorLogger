'use client'
import { useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import LogoutButton from './LogoutButton'

export default function UserDashboard({ user, profile, onSignOut }: { user: any, profile: any, onSignOut: () => void }) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  
  // Real Database Form States
  const [schoolId, setSchoolId] = useState('')
  const [college, setCollege] = useState('')
  
  // NEW: Pre-fill the editable name state with their Google Name
  const [editableName, setEditableName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')

  // Use the editable name for the UI greeting if they change it, otherwise default to Google's
  const displayGreetingName = editableName.split(',')[0].split(' ')[0] || 'User'
  const reasonsList = [
    'Reading', 
    'Research', 
    'Use of Computer', 
    'Studying', 
    'Wi-Fi', 
    'Book Borrowing', 
    'Waiting for Classes', 
    'Other'
  ]

  const isFirstTime = !profile?.school_id

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedReasons.length === 0) return 
    setIsSubmitting(true)

    try {
      // 1. If First Time, save their ID, College, AND their corrected Name
      if (isFirstTime) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            school_id: schoolId,
            college_office: college,
            full_name: editableName // Pushes the corrected name to the database!
          })
          .eq('id', user.id)
        
        if (profileError) throw profileError
      }

      // 2. Log the Visit
      const formattedReasons = selectedReasons.join(', ')
      const { error: visitError } = await supabase
        .from('visits')
        .insert([{ 
          user_id: user.id, 
          reason: formattedReasons 
        }])

      if (visitError) throw visitError

      setShowSuccess(true)

    } catch (error) {
      console.error("Error logging visit:", error)
      alert("Something went wrong saving your visit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border border-green-500 rounded-xl text-center animate-in fade-in zoom-in duration-300 shadow-2xl relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Welcome to NEU Library!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your visit has been recorded successfully, <span className="font-semibold text-black dark:text-white">{editableName}</span>.
        </p>
        <LogoutButton onSignOut={onSignOut} className="mb-4" />
        <button 
          onClick={() => {
            setShowSuccess(false)
            setSelectedReasons([]) 
            window.location.reload()
          }} 
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white underline transition-colors"
        >
          Submit another entry
        </button>
      </div>
    )
  }

  return (
    <div className={`w-full p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 transition-all duration-500 ease-in-out overflow-hidden ${isFirstTime ? 'max-w-4xl' : 'max-w-md'}`}>
      <div className="mb-8 text-center border-b border-gray-100 dark:border-gray-800 pb-6">
        <h1 className="flex flex-col gap-1 mb-2">
          <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">Welcome,</span>
          <span className="text-3xl font-medium text-gray-700 dark:text-gray-300">{displayGreetingName}!</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">Please log your visit below.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className={`grid gap-8 ${isFirstTime ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          
          {isFirstTime && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-8 duration-500">
              
              {/* NEW: Editable Name Field pre-filled with their Google Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name <span className="text-gray-400 font-normal">(Edit if formatted incorrectly)</span>
                </label>
                <input 
                  required
                  type="text" 
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">School ID</label>
                <input 
                  required
                  type="text" 
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  placeholder="e.g. 01-2345-6789"
                  className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">College / Office</label>
                <select 
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>Select your college...</option>
                  <option value="College of Informatics and Computing Studies">College of Informatics and Computing Studies</option>
                  <option value="College of Engineering and Architecture">College of Engineering and Architecture</option>
                  <option value="College of Nursing">College of Nursing</option>
                  <option value="College of Law">College of Law</option>
                  <option value="College of Business Administration">College of Business Administration</option>
                  <option value="College of Arts and Sciences">College of Arts and Sciences</option>
                  <option value="College of Education">College of Education</option>
                  <option value="College of Criminology">College of Criminology</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col justify-center">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Reason for Visiting <span className="text-gray-400 font-normal">(Select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reasonsList.map((reason) => {
                const isSelected = selectedReasons.includes(reason)
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => toggleReason(reason)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all text-left flex items-center justify-between ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {reason}
                    {isSelected && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={selectedReasons.length === 0 || isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none mt-2 flex justify-center items-center"
        >
          {isSubmitting ? (
             <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : 'Check In'}
        </button>
      </form>
    </div>
  )
}