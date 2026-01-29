'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Product = {
  id: string;
  name: string;
  staging_url?: string | null;
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

export default function ProductSwitcher({ products, activeProductId }: { products: Product[]; activeProductId: string | null }) {
  const router = useRouter();
  const activeProduct = products.find(p => p.id === activeProductId);
  const faviconUrl = activeProduct ? getFaviconUrl(activeProduct) : null;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
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
          <span className="text-white text-lg font-bold">
            {activeProduct ? activeProduct.name.charAt(0).toUpperCase() : 'P'}
          </span>
        )}
      </div>
      <div>
        <div className="relative">
          <select
            value={activeProductId || ''}
            onChange={(e) => {
              setImgError(false);
              const productId = e.target.value;
              if (productId) {
                router.push(`?product=${productId}`);
              } else {
                router.push('/');
              }
            }}
            className="text-2xl font-semibold text-gray-900 bg-transparent appearance-none cursor-pointer pr-8 focus:outline-none"
          >
            <option value="">All products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-sm text-gray-500">Production status</p>
      </div>
    </div>
  );
}
