'use client'
import { useState } from 'react'
import LogoutButton from './LogoutButton'

export default function UserDashboard({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [isFirstTime, setIsFirstTime] = useState(true) 
  const [showSuccess, setShowSuccess] = useState(false)

  // Use the full name exactly as requested
  const fullName = user?.user_metadata?.full_name || 'NEU User'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuccess(true) 
  }

  // 1. THE SUCCESS SCREEN
  if (showSuccess) {
    return (
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border border-green-500 rounded-xl text-center animate-in fade-in zoom-in duration-300 shadow-2xl relative z-10 flex flex-col items-center">
        
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
          Welcome to NEU Library!
        </h2>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your visit has been recorded successfully, <span className="font-semibold text-black dark:text-white">{fullName}</span>.
        </p>
        
        {/* Drop in the new Reusable Logout Button */}
        <LogoutButton onSignOut={onSignOut} className="mb-4" />

        <button 
          onClick={() => setShowSuccess(false)} 
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white underline transition-colors"
        >
          Submit another entry
        </button>
      </div>
    )
  }

  // 2. THE MAIN CHECK-IN FORM
  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* UPDATED STACKED HEADER */}
      <div className="mb-8 text-center border-b border-gray-100 dark:border-gray-800 pb-6">
        <h1 className="flex flex-col gap-1 mb-2">
          {/* Welcome is now highlighted and larger */}
          <span className="text-3xl font-medium text-gray-700 dark:text-gray-300">
            Welcome,
          </span>
          {/* Username is slightly smaller and uses a neutral color */}
          <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
            {fullName}!
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">
          Please log your visit below.
        </p>
      </div>
      
      {/* TEMPORARY DEV CONTROLS */}
      <div className="mb-6 flex items-center justify-center gap-2 text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-900/50">
        <input type="checkbox" id="firstTimeCheck" checked={isFirstTime} onChange={(e) => setIsFirstTime(e.target.checked)} />
        <label htmlFor="firstTimeCheck" className="font-semibold uppercase tracking-wider">Simulate First-Time Visit</label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* COLLEGE DROPDOWN */}
        {isFirstTime && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              College / Office
            </label>
            <select 
              required
              defaultValue=""
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
        )}

        {/* REASON INPUT */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Reason for Visiting
          </label>
          <select 
            required
            defaultValue=""
            className="w-full p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
          >
            <option value="" disabled>Select your reason...</option>
            <option value="reading">Reading</option>
            <option value="research">Research</option>
            <option value="use_of_computer">Use of Computer</option>
            <option value="studying">Studying</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button 
          type="submit"
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          Check In
        </button>
      </form>
    </div>
  )
}