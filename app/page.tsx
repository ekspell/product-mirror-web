import { supabase } from './supabase';
import DashboardTabs from './components/DashboardTabs';
import RunSweepButton from './components/RunSweepButton';

export default async function Home() {
  const { data: routes } = await supabase
    .from('routes')
    .select(`
      id,
      name,
      path,
      flow_name,
      products (name),
      captures (screenshot_url, captured_at, has_changes, change_summary)
    `)
    .order('captured_at', { referencedTable: 'captures', ascending: false });

  const { data: connections } = await supabase
    .from('page_connections')
    .select('source_route_id, destination_route_id');

  return (
    <div>
      <div className="p-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">P</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Production status</h1>
        </div>
        
        <div className="flex items-center gap-8 mb-4">
          <div>
            <p className="text-sm text-gray-500">Last sweep</p>
            <p className="text-lg font-medium text-gray-900">2 hours ago</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Changes</p>
            <p className="text-lg font-medium text-gray-900">114 detected</p>
          </div>
        </div>

        <RunSweepButton />
      </div>

      <DashboardTabs routes={routes} connections={connections} />
    </div>
  );
}