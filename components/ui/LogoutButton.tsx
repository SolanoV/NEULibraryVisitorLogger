'use client'

type LogoutButtonProps = {
  onSignOut: () => void;
  className?: string; // Allows us to add extra margins or widths depending on where it's used
}

export default function LogoutButton({ onSignOut, className = "" }: LogoutButtonProps) {
  return (
    <button
      onClick={onSignOut}
      className={`w-full py-3 px-4 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Log Out
    </button>
  )
}