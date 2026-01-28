'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Route = {
  id: string;
  name: string;
  path: string;
  flow_name?: string | null;
  products: { name: string } | null;
  captures: { screenshot_url: string; captured_at: string }[] | null;
};

export default function DashboardTabs({ routes }: { routes: Route[] | null }) {
  const [activeTab, setActiveTab] = useState('changes');
  const [expandedFlows, setExpandedFlows] = useState<string[]>([]);

  // Group routes by flow_name
  const flowGroups = routes?.reduce((acc, route) => {
    const flowName = route.flow_name || 'Ungrouped';
    if (!acc[flowName]) {
      acc[flowName] = [];
    }
    acc[flowName].push(route);
    return acc;
  }, {} as Record<string, Route[]>) || {};

  const toggleFlow = (flowName: string) => {
    setExpandedFlows(prev => 
      prev.includes(flowName) 
        ? prev.filter(f => f !== flowName)
        : [...prev, flowName]
    );
  };

  return (
    <>
      {/* Tabs */}
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
              <button 
                onClick={() => setActiveTab('changes')}
                className={`text-base pb-1 ${activeTab === 'changes' ? 'font-medium text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
              >
                Changes
                <span className="ml-2 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">10</span>
              </button>
              <button 
                onClick={() => setActiveTab('flows')}
                className={`text-base pb-1 ${activeTab === 'flows' ? 'font-medium text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
              >
                Flows
              </button>
              <button 
                onClick={() => setActiveTab('components')}
                className={`text-base pb-1 ${activeTab === 'components' ? 'font-medium text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
              >
                Components
              </button>
            </div>
          </div>
          
          <input 
            type="text" 
            placeholder="Search" 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Changes View */}
      {activeTab === 'changes' && (
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
                  <p className="font-medium text-gray-900">{route.name}</p>
                  <p className="text-sm text-gray-500">{route.products?.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flows View */}
      {activeTab === 'flows' && (
        <div className="flex">
          {/* Flow Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4">
            {Object.keys(flowGroups).map(flowName => (
              <div key={flowName} className="mb-2">
                <button
                  onClick={() => toggleFlow(flowName)}
                  className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg hover:bg-gray-100"
                >
                  {expandedFlows.includes(flowName) ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">{flowName}</span>
                  <span className="ml-auto text-xs text-gray-500">{flowGroups[flowName].length}</span>
                </button>
                
                {expandedFlows.includes(flowName) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {flowGroups[flowName].map(route => (
                      <div key={route.id} className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
                        {route.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Flow Content */}
          <div className="flex-1 p-8">
            {Object.entries(flowGroups).map(([flowName, flowRoutes]) => (
              <div key={flowName} className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{flowName}</h3>
                <p className="text-sm text-gray-500 mb-4">{flowRoutes.length} screens</p>
                
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {flowRoutes.map((route, index) => {
                    const latestCapture = route.captures?.[0];
                    const hasChanges = index === 0;
                    
                    return (
                      <div key={route.id} className="flex-shrink-0 w-72 bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer">
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
                              5 changes • 1hr ago
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3">
                          <p className="font-medium text-gray-900 text-sm">{route.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Components View */}
      {activeTab === 'components' && (
        <div className="p-8 grid grid-cols-2 gap-6">
          {/* Placeholder component cards */}
          <div className="bg-gray-50 rounded-lg p-8 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              </div>
              <p className="text-sm text-emerald-600 font-medium">Avatar profile</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-8 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-emerald-500 rounded"></div>
                ))}
              </div>
              <p className="text-sm text-emerald-600 font-medium">Checkbox base</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-8 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-4">
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full"></div>
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full"></div>
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full"></div>
              </div>
              <p className="text-sm text-emerald-600 font-medium">Control handle</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-8 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                <div className="px-3 py-1 bg-gray-900 text-white text-xs rounded">App Store</div>
                <div className="px-3 py-1 bg-gray-900 text-white text-xs rounded">Google Play</div>
              </div>
              <p className="text-sm text-emerald-600 font-medium">Mobile app store badge</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}