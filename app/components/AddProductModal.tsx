'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  userId: string;
};

export default function AddProductModal({ isOpen, onClose, onProductAdded, userId }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    stagingUrl: '',
    loginEmail: '',
    loginPassword: '',
    authState: 'public' as 'authenticated' | 'public'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId })
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          name: '',
          stagingUrl: '',
          loginEmail: '',
          loginPassword: '',
          authState: 'public'
        });
        onClose();
        onProductAdded();
      } else {
        setError(data.error || 'Failed to add product');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  const handleAuthStateChange = (state: 'authenticated' | 'public') => {
    setFormData(prev => ({
      ...prev,
      authState: state,
      // Clear login fields if switching to public
      loginEmail: state === 'public' ? '' : prev.loginEmail,
      loginPassword: state === 'public' ? '' : prev.loginPassword
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
              Product name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Calendly"
            />
          </div>

          {/* Product URL */}
          <div>
            <label htmlFor="stagingUrl" className="block text-sm font-medium text-gray-900 mb-2">
              Product URL
            </label>
            <input
              id="stagingUrl"
              type="url"
              value={formData.stagingUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, stagingUrl: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          {/* Auth State Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Authentication required?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="authState"
                  checked={formData.authState === 'public'}
                  onChange={() => handleAuthStateChange('public')}
                  className="w-4 h-4 text-gray-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Public</div>
                  <div className="text-xs text-gray-500">No login required to access</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="authState"
                  checked={formData.authState === 'authenticated'}
                  onChange={() => handleAuthStateChange('authenticated')}
                  className="w-4 h-4 text-gray-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Authenticated</div>
                  <div className="text-xs text-gray-500">Login credentials required</div>
                </div>
              </label>
            </div>
          </div>

          {/* Login Credentials (conditional) */}
          {formData.authState === 'authenticated' && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Provide login credentials for the crawler to authenticate
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-900 mb-2">
                    Login email
                  </label>
                  <input
                    id="loginEmail"
                    type="email"
                    value={formData.loginEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, loginEmail: e.target.value }))}
                    required={formData.authState === 'authenticated'}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-900 mb-2">
                    Login password
                  </label>
                  <input
                    id="loginPassword"
                    type="password"
                    value={formData.loginPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, loginPassword: e.target.value }))}
                    required={formData.authState === 'authenticated'}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Adding...' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  );
}
