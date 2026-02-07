import { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  BarChart3,
  Heart,
  Bell,
  Flame,
  Eye,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import OmSymbol from './OmSymbol';

type AuthView = 'benefits' | 'signup' | 'login';

function AuthModal({
  onClose,
  onSuccess,
  showGuestOption,
  onGuest,
}: {
  onClose: () => void;
  onSuccess: () => void;
  showGuestOption?: boolean;
  onGuest?: () => void;
}) {
  const { signUp, signIn } = useAuth();
  const [view, setView] = useState<AuthView>('benefits');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    setError(null);
    const err = await signUp(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      onSuccess();
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setError(null);
    const err = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-overlay backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md sm:mx-4 animate-fade-in-up">
        <div className="glass-card rounded-t-3xl sm:rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--s1)' }}>
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="w-8" />
            <div className="flex items-center gap-2">
              <OmSymbol size={20} className="text-accent" />
              <span className="font-display text-base font-medium text-t0">Naam Japa</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-s2-40 flex items-center justify-center text-t3 hover:text-t0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {view === 'benefits' && (
            <BenefitsView
              onSignUp={() => setView('signup')}
              onLogin={() => setView('login')}
              showGuestOption={showGuestOption}
              onGuest={onGuest}
            />
          )}

          {view === 'signup' && (
            <AuthForm
              mode="signup"
              email={email}
              password={password}
              error={error}
              submitting={submitting}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleSignUp}
              onSwitch={() => { setView('login'); setError(null); }}
            />
          )}

          {view === 'login' && (
            <AuthForm
              mode="login"
              email={email}
              password={password}
              error={error}
              submitting={submitting}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleSignIn}
              onSwitch={() => { setView('signup'); setError(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const BENEFITS = [
  { icon: BarChart3, title: 'Track Your Practice', desc: 'See total sessions, repetitions, and time spent' },
  { icon: Flame, title: 'Streak Tracking', desc: 'Build daily consistency with streak counts' },
  { icon: Heart, title: 'Save Favorites', desc: 'Favorite chants synced across all your devices' },
  { icon: Bell, title: 'Chanting Reminders', desc: 'Get notified at your preferred practice time' },
  { icon: Eye, title: 'Session History', desc: 'Review all your past chanting sessions' },
];

function BenefitsView({
  onSignUp,
  onLogin,
  showGuestOption,
  onGuest,
}: {
  onSignUp: () => void;
  onLogin: () => void;
  showGuestOption?: boolean;
  onGuest?: () => void;
}) {
  return (
    <div className="px-6 pb-8">
      <div className="text-center mb-6 mt-2">
        <h2 className="font-display text-xl font-semibold text-t0 mb-1">
          Create Your Free Account
        </h2>
        <p className="text-t3 text-sm">
          Unlock the full experience and track your spiritual journey
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {BENEFITS.map(b => (
          <div key={b.title} className="flex items-start gap-3 p-3 rounded-xl bg-s2-40 border border-s2">
            <div className="w-9 h-9 rounded-lg bg-accent\/10 border border-accent\/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <b.icon className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-t0">{b.title}</p>
              <p className="text-xs text-t3 mt-0.5">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onSignUp}
        className="w-full py-3.5 rounded-xl bg-accent font-medium text-sm flex items-center justify-center gap-2 hover:bg-accent-light transition-all active:scale-[0.98] shadow-accent mb-3"
        style={{ color: 'var(--s0)' }}
      >
        <UserPlus className="w-4 h-4" />
        Sign Up Free
      </button>

      <button
        onClick={onLogin}
        className="w-full py-3 rounded-xl bg-s2-40 border border-s2 text-t1 font-medium text-sm hover:bg-s2-60 transition-all active:scale-[0.98] mb-3"
      >
        Already have an account? Sign In
      </button>

      {showGuestOption && onGuest && (
        <button
          onClick={onGuest}
          className="w-full py-2.5 text-t4 text-xs hover:text-t2 transition-colors"
        >
          Try one session as guest
        </button>
      )}
    </div>
  );
}

function AuthForm({
  mode,
  email,
  password,
  error,
  submitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSwitch,
}: {
  mode: 'signup' | 'login';
  email: string;
  password: string;
  error: string | null;
  submitting: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitch: () => void;
}) {
  const isSignUp = mode === 'signup';

  return (
    <div className="px-6 pb-8">
      <div className="text-center mb-6 mt-2">
        <h2 className="font-display text-xl font-semibold text-t0 mb-1">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-t3 text-sm">
          {isSignUp ? 'Start tracking your chanting journey' : 'Sign in to continue your practice'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs text-t3 mb-1.5 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t4" />
            <input
              type="email"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-s2-40 border border-s2 text-t0 text-sm placeholder-t4 focus:outline-none focus:border-accent-med focus:ring-1 focus:ring-accent-subtle transition-all"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-t3 mb-1.5 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t4" />
            <input
              type="password"
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-s2-40 border border-s2 text-t0 text-sm placeholder-t4 focus:outline-none focus:border-accent-med focus:ring-1 focus:ring-accent-subtle transition-all"
              placeholder={isSignUp ? 'Min 6 characters' : 'Enter password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="w-full py-3.5 rounded-xl bg-accent font-medium text-sm hover:bg-accent-light transition-all active:scale-[0.98] shadow-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ color: 'var(--s0)' }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isSignUp ? 'Creating account...' : 'Signing in...'}
            </>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>

      <div className="text-center mt-4">
        <button onClick={onSwitch} className="text-accent text-sm hover:text-accent-light transition-colors">
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
