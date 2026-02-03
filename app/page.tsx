'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from './supabase';
import { useAuth } from './components/AuthProvider';
import Sidebar from './components/Sidebar';
import DashboardTabs from './components/DashboardTabs';
import ProductSwitcher from './components/ProductSwitcher';
import AddProductModal from './components/AddProductModal';
import EmptyProductsState from './components/EmptyProductsState';
import RecordingMode from './components/RecordingMode';
import { Plus, Circle } from 'lucide-react';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function Home() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const activeProductId = searchParams?.get('product') || null;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any>(null);
  const [connections, setConnections] = useState<any>(null);
  const [components, setComponents] = useState<any>([]);
  const [latestCapture, setLatestCapture] = useState<any>(null);
  const [changesCount, setChangesCount] = useState(0);
  const [flows, setFlows] = useState<string[]>([]);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get all teams for this user
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('user_id', user.id);

      if (!teams || teams.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch products for all user's teams
      const teamIds = teams.map(t => t.id);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, staging_url, auth_state')
        .in('team_id', teamIds)
        .order('name');

      setProducts(productsData || []);

      // If no products, show empty state
      if (!productsData || productsData.length === 0) {
        setLoading(false);
        return;
      }

      // Determine which product to show
      const displayProductId = activeProductId || (productsData.length > 0 ? productsData[0].id : null);

      // Find the latest completed recording session for this product
      let latestSessionId: string | null = null;
      if (displayProductId) {
        const { data: latestSession } = await supabase
          .from('recording_sessions')
          .select('id')
          .eq('product_id', displayProductId)
          .eq('status', 'completed')
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        latestSessionId = latestSession?.id || null;
      }

      // Routes query — filter by product and latest session
      let routesQuery = supabase
        .from('routes')
        .select(`
          id,
          name,
          path,
          flow_name,
          product_id,
          products (name),
          captures (screenshot_url, captured_at, has_changes, change_summary)
        `)
        .order('captured_at', { referencedTable: 'captures', ascending: false });

      if (displayProductId) {
        routesQuery = routesQuery.eq('product_id', displayProductId);
      }

      if (latestSessionId) {
        routesQuery = routesQuery.eq('session_id', latestSessionId);
      }

      const { data: routesData } = await routesQuery;
      setRoutes(routesData);

      // Connections query
      let connectionsQuery = supabase
        .from('page_connections')
        .select('source_route_id, destination_route_id');

      if (displayProductId) {
        connectionsQuery = connectionsQuery.eq('product_id', displayProductId);
      }

      const { data: connectionsData } = await connectionsQuery;
      setConnections(connectionsData);

      // Components query
      let componentsQuery = supabase
        .from('components')
        .select(`
          id,
          name,
          image_url,
          component_instances (
            id,
            route_id
          )
        `)
        .order('created_at', { ascending: false });

      if (displayProductId) {
        componentsQuery = componentsQuery.eq('product_id', displayProductId);
      }

      const { data: componentsRaw } = await componentsQuery;

      const componentsData = componentsRaw?.map(comp => ({
        id: comp.id,
        name: comp.name,
        image_url: comp.image_url,
        instance_count: comp.component_instances?.length || 0,
        screen_count: new Set(comp.component_instances?.map((i: any) => i.route_id)).size || 0,
      })) || [];

      setComponents(componentsData);

      // Latest capture
      let latestCaptureQuery = supabase
        .from('captures')
        .select('captured_at, routes!inner(product_id)')
        .order('captured_at', { ascending: false })
        .limit(1);

      if (displayProductId) {
        latestCaptureQuery = latestCaptureQuery.eq('routes.product_id', displayProductId);
      }

      const { data: latestCaptureData } = await latestCaptureQuery;
      setLatestCapture(latestCaptureData?.[0]);

      // Changes count
      let changesQuery = supabase
        .from('captures')
        .select('*, routes!inner(product_id)', { count: 'exact', head: true })
        .eq('has_changes', true);

      if (displayProductId) {
        changesQuery = changesQuery.eq('routes.product_id', displayProductId);
      }

      const { count } = await changesQuery;
      setChangesCount(count || 0);

      // Get unique flow names
      const flowsData = routesData
        ? Array.from(new Set(routesData.map(r => r.flow_name).filter(Boolean))) as string[]
        : [];
      setFlows(flowsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, activeProductId]);

  const handleProductAdded = () => {
    fetchData(); // Refresh products list
  };

  const displayProductId = activeProductId || (products.length > 0 ? products[0]?.id : null);

  const handleStartRecording = async () => {
    if (!displayProductId) return;
    setRecordingLoading(true);

    try {
      const res = await fetch('/api/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: displayProductId }),
      });
      const data = await res.json();
      if (data.success) {
        setRecordingSessionId(data.sessionId);
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
    }

    setRecordingLoading(false);
  };

  const handleEndRecording = () => {
    setRecordingSessionId(null);
    fetchData(); // Refresh to show new screenshots
  };

  if (!user) {
    return null; // AuthGuard will redirect
  }

  if (loading) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: '#F2F2F2' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </main>
      </div>
    );
  }

  // Show empty state if no products
  if (products.length === 0) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: '#F2F2F2' }}>
        <Sidebar />
        <main className="flex-1">
          <EmptyProductsState onAddProduct={() => setIsAddProductModalOpen(true)} />
          <AddProductModal
            isOpen={isAddProductModalOpen}
            onClose={() => setIsAddProductModalOpen(false)}
            onProductAdded={handleProductAdded}
            userId={user.id}
          />
        </main>
      </div>
    );
  }

  const activeProduct = products.find((p: any) => p.id === displayProductId);
  const activeProductName = activeProduct?.name || 'Product';

  const lastSweep = latestCapture?.captured_at
    ? timeAgo(new Date(latestCapture.captured_at))
    : 'Never';

  // Recording mode
  if (recordingSessionId) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: '#F2F2F2' }}>
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <RecordingMode
            sessionId={recordingSessionId}
            productName={activeProductName}
            onEndRecording={handleEndRecording}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F2F2F2' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div>
          <div className="p-8 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <ProductSwitcher products={products} activeProductId={activeProductId} />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartRecording}
                  disabled={recordingLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
                >
                  <Circle size={14} fill="currentColor" />
                  {recordingLoading ? 'Starting...' : 'Start Recording'}
                </button>
                <button
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus size={18} />
                  Add product
                </button>
              </div>
            </div>

            <div className="flex items-center gap-8 mb-4">
              <div>
                <p className="text-sm text-gray-500">Last recording</p>
                <p className="text-lg font-medium text-gray-900">{lastSweep}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Changes</p>
                <p className="text-lg font-medium text-gray-900">{changesCount} detected</p>
              </div>
            </div>
          </div>

          <DashboardTabs
            routes={routes}
            connections={connections}
            components={components}
            productId={displayProductId}
          />
        </div>

        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          onProductAdded={handleProductAdded}
          userId={user.id}
        />
      </main>
    </div>
  );
}
