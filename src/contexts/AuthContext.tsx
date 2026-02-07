import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

const GUEST_SESSION_KEY = 'naam-japa-guest-sessions';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  guestSessionsUsed: number;
  canPlayAsGuest: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  consumeGuestSession: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  guestSessionsUsed: 0,
  canPlayAsGuest: true,
  isAuthenticated: false,
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => {},
  refreshProfile: async () => {},
  consumeGuestSession: () => {},
});

const MAX_GUEST_SESSIONS = 1;

function getGuestSessions(): number {
  try {
    return parseInt(localStorage.getItem(GUEST_SESSION_KEY) ?? '0', 10);
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestSessionsUsed, setGuestSessionsUsed] = useState(getGuestSessions);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        (async () => {
          await fetchProfile(u.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: email.split('@')[0] } },
    });
    if (error) return error.message;
    return null;
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  function consumeGuestSession() {
    const next = guestSessionsUsed + 1;
    setGuestSessionsUsed(next);
    try {
      localStorage.setItem(GUEST_SESSION_KEY, String(next));
    } catch {}
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        guestSessionsUsed,
        canPlayAsGuest: guestSessionsUsed < MAX_GUEST_SESSIONS,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        consumeGuestSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
