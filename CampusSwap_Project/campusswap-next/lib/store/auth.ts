import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export interface UserProfile {
  id: string;
  name: string;
  campus: string;
  course: string | null;
  year: string | null;
  bio: string | null;
  meetup: string | null;
  rating: number | null;
  trades: number | null;
  verified: boolean | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true,
      setUser: (user) => set({ user, loading: !user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      clear: () => set({ user: null, profile: null, loading: false }),
    }),
    {
      name: 'campusswap-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
);