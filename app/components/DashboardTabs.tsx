'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Route = {
  id: string;
  name: string;
  path: string;
  flow_name?: string | null;
  products: { name: string } | { name: string }[] | null;
  captures: { screenshot_url: string; captured_at: string }[] | null;
};

type Connection = {
  source_route_id: string;
  destination_route_id: string;
};

function buildFlowBreadcrumbs(routes: Route[], connections: Connection[]): Record<string, string> {
  // For each flow, find if it has a "parent" flow via connections
  // A parent flow is one where a route in flow A links to a route in flow B
  const routeFlowMap = new Map<string, string>();
  for (const route of routes) {
    routeFlowMap.set(route.id, route.flow_name || 'Ungrouped');
  }

  // Count cross-flow connections: source_flow → dest_flow
  const crossFlowCounts = new Map<string, Map<string, number>>();
  for (const conn of connections) {
    const srcFlow = routeFlowMap.get(conn.source_route_id);
    const dstFlow = routeFlowMap.get(conn.destination_route_id);
    if (!srcFlow || !dstFlow || srcFlow === dstFlow) continue;
    if (!crossFlowCounts.has(dstFlow)) crossFlowCounts.set(dstFlow, new Map());
    const counts = crossFlowCounts.get(dstFlow)!;
    counts.set(srcFlow, (counts.get(srcFlow) || 0) + 1);
  }

  // For each flow with incoming cross-flow connections, pick the most common source as parent
  const breadcrumbs: Record<string, string> = {};
  for (const [flowName, sources] of crossFlowCounts) {
    let maxCount = 0;
    let parentFlow = '';
    for (const [srcFlow, count] of sources) {
      if (count > maxCount) {
        maxCount = count;
        parentFlow = srcFlow;
      }
    }
    if (parentFlow) {
      breadcrumbs[flowName] = parentFlow;
    }
  }

  return breadcrumbs;
}

export default function DashboardTabs({ routes, connections }: { routes: Route[] | null; connections: Connection[] | null }) {
  const [activeTab, setActiveTab] = useState('changes');
  const [visibleFlow, setVisibleFlow] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingTo = useRef(false);

  const flowGroups = routes?.reduce((acc, route) => {
    const flowName = route.flow_name || 'Ungrouped';
    if (!acc[flowName]) {
      acc[flowName] = [];
    }
    acc[flowName].push(route);
    return acc;
  }, {} as Record<string, Route[]>) || {};

  const flowNames = Object.keys(flowGroups);

  const flowBreadcrumbs = routes && connections && connections.length > 0
    ? buildFlowBreadcrumbs(routes, connections)
    : {};

  // Scroll-linked highlighting via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || activeTab !== 'flows') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        // Find the topmost visible section
        let topEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
              topEntry = entry;
            }
          }
        }
        if (topEntry) {
          const flowName = (topEntry.target as HTMLElement).dataset.flow;
          if (flowName) setVisibleFlow(flowName);
        }
      },
      {
        root: container,
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0,
      }
    );

    for (const flowName of flowNames) {
      const el = sectionRefs.current[flowName];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [activeTab, flowNames.join(',')]);

  const scrollToFlow = useCallback((flowName: string) => {
    const el = sectionRefs.current[flowName];
    const container = scrollContainerRef.current;
    if (!el || !container) return;

    isScrollingTo.current = true;
    setVisibleFlow(flowName);

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Re-enable scroll observation after animation
    setTimeout(() => {
      isScrollingTo.current = false;
    }, 800);
  }, []);


  return (
    <>
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
                    <div className="absolute top-3 left-3 bg-black/40 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
                      {changeCount} changes • 1hr ago
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <p className="font-medium text-gray-900">{route.name}</p>
                  <p className="text-sm text-gray-500">{Array.isArray(route.products) ? route.products[0]?.name : route.products?.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'flows' && (
        <div className="flex" style={{ height: 'calc(100vh - 160px)' }}>
          <div className="w-64 border-r border-gray-200 py-2 overflow-y-auto flex-shrink-0">
            {flowNames.map(flowName => {
              const screens = flowGroups[flowName];
              const isActive = visibleFlow === flowName;
              return (
                <button
                  key={flowName}
                  onClick={() => scrollToFlow(flowName)}
                  className={`flex items-center justify-between w-full text-left px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="truncate">{flowName}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{screens.length}</span>
                </button>
              );
            })}
          </div>

          <div ref={scrollContainerRef} className="flex-1 p-8 overflow-y-auto">
            {Object.entries(flowGroups).map(([flowName, screens]) => (
              <div
                key={flowName}
                ref={el => { sectionRefs.current[flowName] = el; }}
                data-flow={flowName}
                className="mb-10"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  {flowName}
                  {flowBreadcrumbs[flowName] && (
                    <span className="font-normal text-gray-400">
                      {' '}from <span className="font-medium text-gray-500">{flowBreadcrumbs[flowName]}</span>
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{screens.length} screens</p>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {screens.map(route => (
                    <ScreenCard key={route.id} route={route} hasChanges={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

     {activeTab === 'components' && (
        <div className="p-8 grid grid-cols-2 gap-6">
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

function ScreenCard({ route, hasChanges }: { route: Route; hasChanges: boolean }) {
  const latestCapture = route.captures?.[0];
  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer">
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
          <div className="absolute top-3 left-3 bg-black/40 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
            5 changes &bull; 1hr ago
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-gray-900 text-sm">{route.name}</p>
      </div>
    </div>
  );
}