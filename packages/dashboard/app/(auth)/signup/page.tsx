'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast';
import { Bot, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      toast('error', error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: 'bg-gray-700', width: 'w-0' };
    if (password.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (password.length < 8) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card-static w-full max-w-md animate-fade-in text-center">
          {/* Success icon */}
          <div className="flex justify-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
              <CheckCircle size={32} className="text-green-400" />
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-100">Check your email</h1>
          <p className="text-sm text-gray-400 mb-1">
            We sent a confirmation link to
          </p>
          <p className="text-sm font-medium text-brand-400 mb-6">{email}</p>
          <p className="text-xs text-gray-500 mb-6">
            Click the link in your email to activate your account. It may take a minute to arrive.
          </p>

          <a
            href="/login"
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card-static w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/20">
            <Bot size={28} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-1 text-center text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          ClawFree
        </h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Create your account to get started
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 animate-slide-up rounded-lg bg-red-900/50 border border-red-800 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Signup form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input w-full"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-gray-400">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input w-full pr-10"
                minLength={6}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${strength.color} transition-all duration-300 ${strength.width}`}
                  />
                </div>
                <p className={`mt-1 text-[11px] ${
                  strength.label === 'Weak' ? 'text-red-400' :
                  strength.label === 'Fair' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Sign in link */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            Sign in
          </a>
        </p>

        {/* Powered by */}
        <p className="mt-4 text-center text-[11px] text-gray-600">
          Powered by Claude
        </p>
      </div>
    </div>
  );
}
