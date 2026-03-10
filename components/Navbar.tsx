'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { supabase } from '@/utils/supabaseClient'
import { useRouter, usePathname } from 'next/navigation' // <-- Added usePathname!

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname() // <-- Tracks the current URL
  const dropdownRef = useRef<HTMLDivElement>(null)

  // We moved the fetch logic into a reusable function
  const fetchAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      // Safely fetch profile, ignoring errors if it takes a split second to generate
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data || null)
    } else {
      setUser(null)
      setProfile(null)
    }
  }

  // 1. Run whenever the page URL changes (e.g. redirecting after login)
  useEffect(() => {
    setMounted(true)
    fetchAuth()
  }, [pathname])

  // 2. Fallback listener for background auth changes
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
          
          <div className="flex-shrink-0 flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex flex-col sm:flex-row sm:gap-1.5 items-start sm:items-baseline">
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-none">NEU Library</span>
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none">Visitor Logger</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <Link href="/dashboard" className="text-sm font-bold text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors hidden sm:block">
                Dashboard
              </Link>
            )}
            
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                {theme === 'dark' ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> <span className="hidden sm:inline">Light</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> <span className="hidden sm:inline">Dark</span></>
                )}
              </button>
            )}

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