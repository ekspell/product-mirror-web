'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Trash2, Settings } from 'lucide-react';
import EditProductModal from './EditProductModal';

type Product = {
  id: string;
  name: string;
  staging_url?: string | null;
  auth_state?: 'authenticated' | 'public' | null;
};

function getFaviconUrl(product: Product): string | null {
  if (!product.staging_url) return null;
  try {
    const domain = new URL(product.staging_url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

function getAuthBadge(authState: 'authenticated' | 'public' | null | undefined) {
  if (authState === 'authenticated') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        Authenticated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Public
    </span>
  );
}

export default function ProductSwitcher({ products, activeProductId }: { products: Product[]; activeProductId: string | null }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default to first product if no active product
  const activeProduct = products.find(p => p.id === activeProductId) || products[0];
  const faviconUrl = activeProduct ? getFaviconUrl(activeProduct) : null;
  const [imgError, setImgError] = useState(false);

  const hasMultipleProducts = products.length > 1;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleProductSelect(productId: string) {
    setImgError(false);
    setIsOpen(false);
    router.push(`?product=${productId}`);
  }

  function handleEditProduct(product: Product, e: React.MouseEvent) {
    e.stopPropagation(); // Prevent dropdown item click
    setProductToEdit(product);
    setIsEditModalOpen(true);
    setIsOpen(false);
  }

  async function handleDeleteProduct(productId: string, productName: string, e: React.MouseEvent) {
    e.stopPropagation(); // Prevent dropdown item click

    if (!confirm(`Are you sure you want to delete "${productName}"? This will permanently delete all screens, flows, components, and captures.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Refresh the page to update product list
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  }

  function handleProductUpdated() {
    // Refresh the page to show updated product
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-3">
      {/* Logo box with white background */}
      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
        {faviconUrl && !imgError ? (
          <img
            src={faviconUrl}
            alt={activeProduct?.name || ''}
            width={32}
            height={32}
            className="object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-gray-900 text-lg font-bold">
            {activeProduct ? activeProduct.name.charAt(0).toUpperCase() : 'P'}
          </span>
        )}
      </div>

      <div className="relative flex items-center gap-2" ref={dropdownRef}>
        <button
          onClick={() => hasMultipleProducts && setIsOpen(!isOpen)}
          className={`flex items-center gap-2 ${hasMultipleProducts ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-gray-900">
              {activeProduct?.name || 'Select Product'}
            </span>
            {getAuthBadge(activeProduct?.auth_state)}
          </div>
          {hasMultipleProducts && (
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Edit button (visible for single product) */}
        {!hasMultipleProducts && activeProduct && (
          <button
            onClick={(e) => handleEditProduct(activeProduct, e)}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Edit product settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Custom dropdown */}
        {hasMultipleProducts && isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {products.map(product => (
              <div
                key={product.id}
                className={`group w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                  product.id === activeProduct?.id ? 'bg-gray-50' : ''
                }`}
              >
                <button
                  onClick={() => handleProductSelect(product.id)}
                  className="flex items-center gap-2 flex-1"
                >
                  <span className="text-gray-900 font-medium">{product.name}</span>
                  {getAuthBadge(product.auth_state)}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleEditProduct(product, e)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    title="Edit product"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProduct(product.id, product.name, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProductUpdated={handleProductUpdated}
        product={productToEdit}
      />
    </div>
  );
}
