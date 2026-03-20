'use client'
import { useState } from 'react'
import { Profile } from '@/types'
import UserBadge from '../../ui/UserBadge'

interface ProfileHeaderProps {
  profile: Profile
  user: any
  targetUserId?: string
  isAdminProfile: boolean
  viewerRole: string | null
  onUpdate: (updates: Partial<Profile>) => Promise<void>
}

export default function ProfileHeader({ profile, user, targetUserId, isAdminProfile, viewerRole, onUpdate }: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  // State to hold the form data while editing
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    school_id: profile?.school_id || '',
    position: profile?.position || '',
    college_office: profile?.college_office || '',
    user_type: profile?.user_type || 'student',
    role: profile?.role || 'user'
  })

  // Security Check: Who is looking at this page?
  const isViewerSuperAdmin = viewerRole === 'superadmin'
  const isViewerAdmin = viewerRole === 'admin'
  const isTargetSuperAdmin = profile?.role === 'superadmin'

  // NEW LOGIC: You can only edit if you are a Superadmin, OR if you are an Admin looking at anyone EXCEPT a Superadmin.
  const canEdit = isViewerSuperAdmin || (isViewerAdmin && !isTargetSuperAdmin)
  const isSuperAdmin = isViewerSuperAdmin

  const handleSave = async () => {
    await onUpdate(formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Reset form to original data
    setFormData({
      full_name: profile?.full_name || '',
      school_id: profile?.school_id || '',
      position: profile?.position || '',
      college_office: profile?.college_office || '',
      user_type: profile?.user_type || 'student',
      role: profile?.role || 'user'
    })
    setIsEditing(false)
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
      
      {/* DESKTOP BADGE */}
      <div className="absolute top-6 right-6 hidden sm:block">
        <UserBadge profile={profile} />
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mt-2 sm:mt-0">
        
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile" className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-32 h-32 bg-gray-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-500 shadow-lg">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
        )}
        
        <div className="text-center md:text-left flex-1 mt-2 w-full">
          
          {/* === EDIT MODE UI === */}
          {isEditing ? (
            <div className="flex flex-col gap-3 w-full max-w-xl animate-in fade-in">
              <input 
                type="text" 
                value={formData.full_name} 
                onChange={e => setFormData({...formData, full_name: e.target.value})} 
                className="text-2xl font-bold p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
                placeholder="Full Name"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1">User Type</label>
                  <select 
                    value={formData.user_type || 'student'} 
                    onChange={e => setFormData({...formData, user_type: e.target.value as any})}
                    className="p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-sm text-black dark:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Faculty / Staff</option>
                  </select>
                </div>

                {/* ONLY SUPERADMINS CAN CHANGE THE SYSTEM ROLE */}
                {/* ONLY SUPERADMINS CAN CHANGE THE SYSTEM ROLE */}
                {isSuperAdmin && (() => {
                  // Security Check: Is the Superadmin looking at their own profile?
                  const isSelf = !targetUserId || targetUserId === user?.id;
                  
                  return (
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-purple-500 uppercase mb-1">
                        System Role {isSelf ? '(Locked)' : '(Transfer Power)'}
                      </label>
                      <select 
                        value={formData.role || 'user'} 
                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                        disabled={isSelf}
                        className={`p-2 border rounded text-sm text-black dark:text-white font-bold transition-all ${
                          isSelf 
                            ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed' 
                            : 'border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 cursor-pointer'
                        }`}
                      >
                        <option value="user">Standard User</option>
                        <option value="admin">Administrator</option>
                        <option value="superadmin">Super Administrator</option>
                      </select>
                      {isSelf && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                          You cannot demote yourself. To step down, transfer Superadmin rights to another user.
                        </span>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1">
                    {formData.user_type === 'staff' ? 'Position' : 'School ID'}
                  </label>
                  <input 
                    type="text" 
                    value={formData.user_type === 'staff' ? formData.position : formData.school_id} 
                    onChange={e => formData.user_type === 'staff' ? setFormData({...formData, position: e.target.value}) : setFormData({...formData, school_id: e.target.value})} 
                    className="p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-sm text-black dark:text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1">Department / Office</label>
                  <input 
                    type="text" 
                    value={formData.college_office} 
                    onChange={e => setFormData({...formData, college_office: e.target.value})} 
                    className="p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-sm text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors">
                  Save Changes
                </button>
                <button onClick={handleCancel} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-bold rounded transition-colors">
                  Cancel
                </button>
              </div>
            </div>

          ) : (
            /* === VIEW MODE UI (Standard Profile) === */
            <div className="animate-in fade-in">
              <h1 className="text-3xl font-bold text-black dark:text-white mb-1">{profile?.full_name || 'NEU User'}</h1>
              
              {(!targetUserId || targetUserId === user?.id) && (
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{user?.email}</p>
              )}

              {/* MOBILE BADGE */}
              <div className="sm:hidden mb-4">
                <UserBadge profile={profile} />
              </div>

              {canEdit && (
                <button onClick={() => setIsEditing(true)} className="mt-1 mb-4 text-xs font-bold px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors border border-gray-200 dark:border-gray-700">
                  Edit Profile Information
                </button>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-100 dark:border-gray-800 w-full">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1 uppercase tracking-wider text-xs font-bold">
                    {isAdminProfile || profile?.user_type === 'staff' ? 'Position' : 'School ID'}
                  </span>
                  <span className="font-semibold text-black dark:text-white text-base">
                    {isAdminProfile || profile?.user_type === 'staff' ? (profile?.position || 'Admin Staff') : (profile?.school_id || 'Not set')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1 uppercase tracking-wider text-xs font-bold">Department / Office</span>
                  <span className="font-semibold text-black dark:text-white text-base">{profile?.college_office || 'Not set'}</span>
                </div>
              </div>
              
              {profile?.is_blocked && (
                <div className="mt-4 inline-block px-4 py-1.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm font-bold uppercase tracking-wider rounded-full">
                  Account Blocked
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}