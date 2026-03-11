'use client'
import { use } from 'react'
import ProfileClient from '@/components/ProfileClient'

// Next.js 15 requires params to be a Promise
export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // We use React.use() to unwrap the Promise
  const { id } = use(params)
  
  // Pass the ID straight to your existing component
  return <ProfileClient targetUserId={id} />
}