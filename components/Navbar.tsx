'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import LogoutButton from './LogoutButton'

export default function Navbar({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Theme toggle setup
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent UI mismatch during hydration for the theme toggle
  useEffect(() => setMounted(true), [])

  if (!user) return null

  return (
    <>
      {/* 1. THE TRIGGER BUTTON (Floating Top Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 z-50 p-1 rounded-full border-2 border-green-500 overflow-hidden hover:scale-105 transition-transform shadow-lg bg-white dark:bg-gray-900"
      >
        {user.user_metadata?.avatar_url ? (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">
            {user.user_metadata?.full_name?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      {/* 2. THE BACKGROUND DIMMER (Click to close) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. THE COLLAPSIBLE SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-[#0a0a0a] border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6 overflow-y-auto">
          
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="self-end text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-6 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* User Details */}
          <div className="flex flex-col items-center text-center space-y-3 mb-4">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile Large"
                className="w-24 h-24 rounded-full border-4 border-green-500 shadow-md"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                {user.user_metadata?.full_name || 'NEU User'}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <span className="px-3 py-1 mt-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Standard User
            </span>
          </div>

          {/* === NEW: PROFILE BUTTON === */}
          <Link 
            href="/profile" 
            onClick={() => setIsOpen(false)}
            className="w-full mt-2 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white font-semibold rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </Link>

          {/* === NEW: HORIZONTAL LINE === */}
          <hr className="w-full my-6 border-gray-200 dark:border-gray-800" />

          {/* === NEW: MENU SELECTIONS === */}
          <div className="flex flex-col gap-2">
            
            {/* Dashboard Link */}
            <Link 
              href="/dashboard"
              onClick={() => setIsOpen(false)} 
              className="w-full py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium rounded-lg transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            {/* Light/Dark Mode Toggle */}
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium rounded-lg transition-colors flex items-center gap-3"
              >
                {theme === 'dark' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light Mode
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark Mode
                  </>
                )}
              </button>
            )}

          </div>

          {/* Spacer to push logout button to the absolute bottom */}
          <div className="flex-grow"></div>

          {/* Logout Button */}
          <LogoutButton onSignOut={onSignOut} className="mt-8" />
          
        </div>
      </div>
    </>
  )
}