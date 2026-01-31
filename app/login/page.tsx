'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [magicLink, setMagicLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMagicLink('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        if (data.magicLink) {
          setMagicLink(data.magicLink);
        }
      } else {
        setMessage(data.error || 'Failed to send magic link');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Product_Mirror</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your living inventory of product screens
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  Send magic link
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-3">Magic link sent. Check console for link (MVP mode)</p>
                  <p className="font-medium mb-2">How to find your magic link:</p>
                  <ol className="space-y-1 list-decimal list-inside mb-3">
                    <li>Right click anywhere on the page</li>
                    <li>Click "Inspect"</li>
                    <li>Click the "Console" tab</li>
                    <li>The magic URL link will be printed there</li>
                  </ol>
                  {magicLink && (
                    <a
                      href={magicLink}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Click here to login (Dev mode)
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-xs text-gray-500">
          We'll send you a magic link to sign in without a password.
        </p>
      </div>
    </div>
  );
}
