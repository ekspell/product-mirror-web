import { supabase } from './supabase';

export default async function Home() {
  const { data: routes } = await supabase
    .from('routes')
    .select(`
      id,
      name,
      path,
      flow_name,
      products (name),
      captures (screenshot_url, captured_at)
    `)
    .order('captured_at', { referencedTable: 'captures', ascending: false });

  return (
    <div>
      <div className="p-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">T</span>
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

      <div className="border-t border-b border-gray-200 py-4">
        <div className="px-8 flex items-center justify-between">
          <div className="flex items-center">
            <button className="flex items-center gap-2 text-base text-gray-500 pr-6 border-r border-gray-200">
              Latest
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className="flex items-center gap-6 pl-6">
              <button className="text-base font-medium text-gray-900 border-b-2 border-gray-900 pb-1">
                Changes
                <span className="ml-2 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">10</span>
              </button>
              <button className="text-base text-gray-500">Flows</button>
              <button className="text-base text-gray-500">Components</button>
            </div>
          </div>
          
          <input 
            type="text" 
            placeholder="Search" 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 placeholder-gray-500"
          />
        </div>
      </div>
      
      <div className="p-8 grid grid-cols-2 gap-6">
        {routes?.map((route, index) => {
          const latestCapture = route.captures?.[0];
          const hasChanges = index % 2 === 0;
          const changeCount = (index % 5) + 2;
          
          return (
            <div key={route.id} className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer">
              <div className="relative aspect-video bg-gray-200 overflow-hidden">
                {latestCapture?.screenshot_url ? (
                  <img 
                    src={latestCapture.screenshot_url} 
                    alt={route.name || ''}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No capture yet
                  </div>
                )}
                
                {hasChanges && (
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {changeCount} changes • 1hr ago
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{route.name}</p>
                    <p className="text-sm text-gray-500">{route.products?.name}</p>
                  </div>
                  
                  {route.flow_name && (
                    <span className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
                      {route.flow_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
