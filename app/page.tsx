import { supabase } from './supabase';

export default async function Home() {
  // Get routes with their most recent capture
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
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Product Mirror</h1>
        <p className="text-gray-400 mb-8">Your living inventory of product screens</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {routes?.map((route) => {
            const latestCapture = route.captures?.[0];
            return (
              <div key={route.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 cursor-pointer">
                <div className="aspect-video bg-gray-800 rounded mb-3 overflow-hidden">
                  {latestCapture?.screenshot_url ? (
                    <img 
                      src={latestCapture.screenshot_url} 
                      alt={route.name || ''}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      No capture yet
                    </div>
                  )}
                </div>
                <p className="font-medium">{route.name}</p>
                <p className="text-sm text-gray-500">{route.products?.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}