// types/index.ts

export interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  school_id?: string
  college_office?: string
  position?: string
  is_blocked?: boolean
  
  // CHANGED: These now perfectly reflect our new security hierarchy!
  user_type?: 'student' | 'staff' | null
  role?: 'user' | 'admin' | 'superadmin' | null
}

export interface Visit {
  id: string;
  created_at: string;
  reason: string;
  user_id: string;
  profiles: Partial<Profile>; // Partial means it might not fetch every single profile column
}