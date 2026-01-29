'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';

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

type RouteNode = Route & {
  children: RouteNode[];
};

function buildFlowTrees(routes: Route[], connections: Connection[]): Record<string, RouteNode[]> {
  // Only use routes that are referenced by connections
  const connectedIds = new Set<string>();
  for (const conn of connections) {
    connectedIds.add(conn.source_route_id);
    connectedIds.add(conn.destination_route_id);
  }
  const relevantRoutes = routes.filter(r => connectedIds.has(r.id));

  const routeMap = new Map<string, RouteNode>();
  for (const route of relevantRoutes) {
    routeMap.set(route.id, { ...route, children: [] });
  }

  // Build parent→child from forward-only connections
  const hasParent = new Set<string>();
  for (const conn of connections) {
    const parent = routeMap.get(conn.source_route_id);
    const child = routeMap.get(conn.destination_route_id);
    if (parent && child && parent.id !== child.id) {
      if (!parent.children.some(c => c.id === child.id)) {
        parent.children.push(child);
      }
      hasParent.add(conn.destination_route_id);
    }
  }

  // Root nodes = routes with no incoming forward connections, grouped by flow_name
  const trees: Record<string, RouteNode[]> = {};
  for (const route of relevantRoutes) {
    if (!hasParent.has(route.id)) {
      const flowName = route.flow_name || 'Ungrouped';
      if (!trees[flowName]) trees[flowName] = [];
      trees[flowName].push(routeMap.get(route.id)!);
    }
  }

  return trees;
}

export default function DashboardTabs({ routes, connections }: { routes: Route[] | null; connections: Connection[] | null }) {
  const [activeTab, setActiveTab] = useState('changes');
  const [expandedFlows, setExpandedFlows] = useState<string[]>([]);

  // Fall back to flat grouping if no connections exist yet
  const hasConnections = Array.isArray(connections) && connections.length > 0;

  const flowTrees = hasConnections && routes
    ? buildFlowTrees(routes, connections)
    : null;


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
        <div className="flex">
          <div className="w-64 border-r border-gray-200 p-4">
            {Object.keys(flowTrees || flowGroups).map(flowName => {
              const count = flowTrees
                ? flowTrees[flowName]?.length
                : flowGroups[flowName]?.length;
              return (
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
                    <span className="ml-auto text-xs text-gray-500">{count}</span>
                  </button>

                  {expandedFlows.includes(flowName) && (
                    <div className="ml-4 mt-1">
                      {flowTrees
                        ? flowTrees[flowName]?.map(node => <SidebarTreeNode key={node.id} node={node} depth={0} />)
                        : flowGroups[flowName]?.map(route => (
                            <div key={route.id} className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
                              {route.name}
                            </div>
                          ))
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex-1 p-8">
            {Object.entries(flowTrees || flowGroups).map(([flowName, flowRoutes]) => (
              <div key={flowName} className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{flowName}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {(flowRoutes as RouteNode[] | Route[]).length} {flowTrees ? 'entry points' : 'screens'}
                </p>

                {flowTrees ? (
                  <div className="space-y-4">
                    {(flowRoutes as RouteNode[]).map(node => (
                      <FlowTreeRow key={node.id} node={node} depth={0} />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {(flowRoutes as Route[]).map((route, index) => (
                      <ScreenCard key={route.id} route={route} hasChanges={index === 0} />
                    ))}
                  </div>
                )}
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

function SidebarTreeNode({ node, depth }: { node: RouteNode; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="flex items-center gap-1 w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
        {hasChildren && <span className="ml-auto text-xs text-gray-400">{node.children.length}</span>}
      </button>
      {expanded && node.children.map(child => (
        <SidebarTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function FlowTreeRow({ node, depth }: { node: RouteNode; depth: number }) {
  return (
    <div>
      <div className="flex items-center gap-3" style={{ marginLeft: `${depth * 40}px` }}>
        {depth > 0 && <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />}
        <ScreenCard route={node} hasChanges={false} />
      </div>
      {node.children.map(child => (
        <FlowTreeRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
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