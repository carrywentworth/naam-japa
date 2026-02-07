import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Clock,
  Hash,
  BarChart3,
  LogOut,
  Loader2,
  Trophy,
  Calendar,
} from 'lucide-react';
import Background from '../components/Background';
import OmSymbol from '../components/OmSymbol';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentSessions } from '../lib/sessionService';
import type { UserSessionRecord } from '../types';

function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/home', { replace: true });
      return;
    }
    if (user) {
      refreshProfile();
      fetchRecentSessions(user.id, 20).then(data => {
        setSessions(data);
        setLoadingSessions(false);
      });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-s0 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || !profile) return null;

  async function handleSignOut() {
    await signOut();
    navigate('/home', { replace: true });
  }

  function formatDuration(ms: number): string {
    const totalMinutes = Math.floor(ms / 60000);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  function formatSessionDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const stats = [
    { icon: BarChart3, label: 'Total Sessions', value: profile.total_sessions.toLocaleString() },
    { icon: Hash, label: 'Total Chants', value: profile.total_chants.toLocaleString() },
    { icon: Clock, label: 'Total Time', value: formatDuration(profile.total_duration_ms) },
    { icon: Flame, label: 'Current Streak', value: `${profile.current_streak} day${profile.current_streak !== 1 ? 's' : ''}` },
    { icon: Trophy, label: 'Longest Streak', value: `${profile.longest_streak} day${profile.longest_streak !== 1 ? 's' : ''}` },
    { icon: Calendar, label: 'Member Since', value: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
  ];

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background intensity="subtle" />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col px-5 pt-safe">
        <header className="pt-8 pb-6 animate-fade-in">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-t2 hover:text-t0 transition-colors mb-6 -ml-1 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
        </header>

        <div className="animate-fade-in-up">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-accent\/15 border border-accent\/20 flex items-center justify-center">
              <OmSymbol size={32} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-semibold text-t0 truncate">
                {profile.display_name || profile.email.split('@')[0]}
              </h1>
              <p className="text-t3 text-sm truncate">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {stats.map(s => (
              <div
                key={s.label}
                className="p-4 rounded-xl bg-s2-40 border border-s2"
              >
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className="w-4 h-4 text-accent" />
                  <span className="text-xs text-t3 uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="font-display text-lg font-semibold text-t0">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-medium text-t1 uppercase tracking-wider mb-4">
              Recent Sessions
            </h2>

            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-s2-40 border border-s2">
                <p className="text-t3 text-sm">No sessions yet</p>
                <p className="text-t4 text-xs mt-1">Start chanting to see your history here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-s2-40 border border-s2 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-t0 truncate">{s.chant_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-t3">
                          {s.completed_count.toLocaleString()} reps
                        </span>
                        <span className="text-xs text-t4">
                          {formatSessionDuration(s.duration_ms)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-t4">{formatDate(s.completed_at)}</span>
                      {s.was_completed && (
                        <span className="block text-[10px] text-accent mt-0.5">Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3.5 rounded-xl bg-s2-40 border border-s2 text-red-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-[0.98] mb-10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
