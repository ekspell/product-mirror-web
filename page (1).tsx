import { supabase } from './supabase';
import DashboardTabs from './components/DashboardTabs';

export default async function Home() {
  const { data: routes } = await supabase
    .from('routes')
    .select(`
      id,
      name,
      path,
      products (name),
      captures (screenshot_url, captured_at)
    `)
    .order('captured_at', { referencedTable: 'captures', ascending: false });

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

        <div className="flex items-center gap-4">
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
            Run sweep
          </button>
          <span className="text-sm text-gray-500">Next sweep: 2 PM</span>
        </div>
      </div>

      <DashboardTabs routes={routes} />
    </div>
  );
}
