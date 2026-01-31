'use client';

import { Package, Plus } from 'lucide-react';

type EmptyProductsStateProps = {
  onAddProduct: () => void;
};

export default function EmptyProductsState({ onAddProduct }: EmptyProductsStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Package className="text-gray-400" size={32} />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome to Product Mirror
        </h2>

        <p className="text-gray-600 mb-6">
          Get started by adding your first product. We'll automatically discover and track all screens in your application.
        </p>

        <button
          onClick={onAddProduct}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Add your first product
        </button>
      </div>
    </div>
  );
}
