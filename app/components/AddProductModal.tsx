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
