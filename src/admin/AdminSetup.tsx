import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OmSymbol from '../components/OmSymbol';

function AdminSetup() {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError(null);

    try {
      // Use edge function to create admin account with service role key
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes('already exists') || result.error?.includes('duplicate')) {
          setError('This email is already registered. Please use the login page instead.');
        } else {
          setError(result.error || 'Failed to create admin account');
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage.includes('fetch')) {
        setError('Network error: Cannot reach Supabase. Please verify your internet connection and Supabase project URL.');
      } else {
        setError(`Failed to create admin account: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <OmSymbol size={36} className="text-amber-500" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">Admin Setup</h1>
          <p className="text-gray-500 text-sm">Create your admin account</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="Enter password"
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-3 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Create Admin Account
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/admin/login" className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminSetup;
