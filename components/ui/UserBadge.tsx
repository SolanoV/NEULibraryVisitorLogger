'use client'
import { Profile } from '@/types'

export default function UserBadge({ profile }: { profile: Partial<Profile> }) {
  let text = 'Student'
  let colorClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'

  if (profile?.role === 'superadmin') {
    text = 'Admin' // Keeps 'Admin' text, but purple color
    colorClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  } else if (profile?.role === 'admin') {
    text = 'Admin'
    colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  } else if (profile?.user_type === 'staff') {
    text = 'Faculty / Staff'
    colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }

  return (
    <span className={`px-2.5 py-0.5 text-xs rounded-md font-bold uppercase tracking-wider ${colorClass}`}>
      {text}
    </span>
  )
}