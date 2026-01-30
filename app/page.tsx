import { supabase } from './supabase';
import DashboardTabs from './components/DashboardTabs';
import RunSweepButton from './components/RunSweepButton';
import ProductSwitcher from './components/ProductSwitcher';

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

export default async function Home({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams;
  const activeProductId = params.product || null;

  const { data: products } = await supabase
    .from('products')
    .select('id, name, staging_url, auth_state')
    .order('name');

  // Routes query — filter by product if selected
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

  if (activeProductId) {
    routesQuery = routesQuery.eq('product_id', activeProductId);
  }
  const { data: routes } = await routesQuery;

  // Connections query — filter by product if selected
  let connectionsQuery = supabase
    .from('page_connections')
    .select('source_route_id, destination_route_id');

  if (activeProductId) {
    connectionsQuery = connectionsQuery.eq('product_id', activeProductId);
  }
  const { data: connections } = await connectionsQuery;

  // Components query — fetch with instance counts
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

  if (activeProductId) {
    componentsQuery = componentsQuery.eq('product_id', activeProductId);
  }
  const { data: componentsRaw } = await componentsQuery;

  // Transform components data to include counts
  const components = componentsRaw?.map(comp => ({
    id: comp.id,
    name: comp.name,
    image_url: comp.image_url,
    instance_count: comp.component_instances?.length || 0,
    screen_count: new Set(comp.component_instances?.map((i: any) => i.route_id)).size || 0,
  })) || [];

  // Latest capture — filter by product via route join if selected
  let latestCaptureQuery = supabase
    .from('captures')
    .select('captured_at, routes!inner(product_id)')
    .order('captured_at', { ascending: false })
    .limit(1);

  if (activeProductId) {
    latestCaptureQuery = latestCaptureQuery.eq('routes.product_id', activeProductId);
  }
  const { data: latestCaptureData } = await latestCaptureQuery;
  const latestCapture = latestCaptureData?.[0];

  // Changes count — filter by product via route join if selected
  let changesQuery = supabase
    .from('captures')
    .select('*, routes!inner(product_id)', { count: 'exact', head: true })
    .eq('has_changes', true);

  if (activeProductId) {
    changesQuery = changesQuery.eq('routes.product_id', activeProductId);
  }
  const { count: changesCount } = await changesQuery;

  const lastSweep = latestCapture?.captured_at
    ? timeAgo(new Date(latestCapture.captured_at))
    : 'Never';

  // Get unique flow names for the sweep settings modal
  const flows = routes
    ? Array.from(new Set(routes.map(r => r.flow_name).filter(Boolean))) as string[]
    : [];

  return (
    <div>
      <div className="p-8 pb-6">
        <div className="mb-4">
          <ProductSwitcher products={products || []} activeProductId={activeProductId} />
        </div>

        <div className="flex items-center gap-8 mb-4">
          <div>
            <p className="text-sm text-gray-500">Last sweep</p>
            <p className="text-lg font-medium text-gray-900">{lastSweep}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Changes</p>
            <p className="text-lg font-medium text-gray-900">{changesCount ?? 0} detected</p>
          </div>
        </div>

        <RunSweepButton flows={flows} />
      </div>

      <DashboardTabs routes={routes} connections={connections} components={components} />
    </div>
  );
}
