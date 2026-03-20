// types/index.ts

export interface Profile {
  id: string;
  full_name: string | null;
  school_id: string | null;
  college_office: string | null;
  is_blocked: boolean;
  avatar_url: string | null;
  role: 'student' | 'staff' | 'admin' | 'superadmin';
  user_type: 'student' | 'staff';
}

export interface Visit {
  id: string;
  created_at: string;
  reason: string;
  user_id: string;
  profiles: Partial<Profile>; // Partial means it might not fetch every single profile column
}