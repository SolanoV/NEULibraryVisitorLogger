'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { supabase } from '@/utils/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data || null)
    } else {
      setUser(null)
      setProfile(null)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchAuth()
  }, [pathname])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchAuth()
      }
    })
    return () => { authListener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef])

  async function handleSignOut() {
    setIsOpen(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="w-full px-6 lg:px-10">
        <div className="flex justify-between items-center h-16">
          
          {/* BRANDING WITH FAVICON */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
              <img src="/favicon.ico" alt="Logo" className="w-8 h-8 object-contain" />
              <div className="flex flex-col sm:flex-row sm:gap-1.5 items-start sm:items-baseline">
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-none">NEU Library</span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none">Visitor Logger</span>
              </div>
            </Link>
          </div>

          {/* MAIN ACTIONS & AVATAR */}
          <div className="flex items-center gap-4">
            
            {/* Distinct Dashboard Button with Borders */}
            {user && (
              <Link 
                href="/dashboard" 
                className="hidden sm:flex items-center justify-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
              >
                Dashboard
              </Link>
            )}
            
            {/* Icon-only Theme Toggle with Borders */}
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                className="flex items-center justify-center p-2.5 text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  // Solid Moon Icon for Dark Mode
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  // Outline Sun Icon for Light Mode
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            )}

            {/* AVATAR & DROPDOWN */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button onClick={() => setIsOpen(!isOpen)} className="flex items-center focus:outline-none">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-blue-500 shadow-sm object-cover transition-transform hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 shadow-sm transition-transform hover:scale-105">
                    <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-1 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.full_name || user.user_metadata?.full_name || 'NEU User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">My Profile</Link>
                      <button onClick={handleSignOut} className="w-full text-left block px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Sign Out</button>
                    </>
                  ) : (
                    <Link href="/" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center">Login to System</Link>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </nav>
  )
}