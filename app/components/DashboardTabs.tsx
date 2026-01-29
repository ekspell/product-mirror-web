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
  // Only use routes referenced by connections
  const connectedIds = new Set<string>();
  for (const conn of connections) {
    connectedIds.add(conn.source_route_id);
    connectedIds.add(conn.destination_route_id);
  }
  const relevantRoutes = routes.filter(r => connectedIds.has(r.id));

  // Group routes by flow_name
  const flowGrouped = new Map<string, Route[]>();
  for (const route of relevantRoutes) {
    const flowName = route.flow_name || 'Ungrouped';
    if (!flowGrouped.has(flowName)) flowGrouped.set(flowName, []);
    flowGrouped.get(flowName)!.push(route);
  }

  // Build adjacency list scoped to same-flow connections only
  const routeFlowMap = new Map<string, string>();
  for (const route of relevantRoutes) {
    routeFlowMap.set(route.id, route.flow_name || 'Ungrouped');
  }

  const childrenOf = new Map<string, string[]>();
  const hasParentInFlow = new Set<string>();
  for (const conn of connections) {
    const srcFlow = routeFlowMap.get(conn.source_route_id);
    const dstFlow = routeFlowMap.get(conn.destination_route_id);
    // Only connect within same flow
    if (!srcFlow || !dstFlow || srcFlow !== dstFlow) continue;
    if (conn.source_route_id === conn.destination_route_id) continue;

    if (!childrenOf.has(conn.source_route_id)) childrenOf.set(conn.source_route_id, []);
    const existing = childrenOf.get(conn.source_route_id)!;
    if (!existing.includes(conn.destination_route_id)) {
      existing.push(conn.destination_route_id);
    }
    hasParentInFlow.add(conn.destination_route_id);
  }

  const routeById = new Map<string, Route>();
  for (const route of relevantRoutes) {
    routeById.set(route.id, route);
  }

  function buildNode(id: string, visited: Set<string>, depth: number): RouteNode | null {
    const route = routeById.get(id);
    if (!route || visited.has(id) || depth > 3) return null;
    visited.add(id);
    const children: RouteNode[] = [];
    for (const childId of (childrenOf.get(id) || [])) {
      const node = buildNode(childId, visited, depth + 1);
      if (node) children.push(node);
    }
    return { ...route, children };
  }

  // Build trees: roots are routes with no parent within their flow
  const trees: Record<string, RouteNode[]> = {};
  for (const [flowName, flowRoutes] of flowGrouped) {
    const roots = flowRoutes.filter(r => !hasParentInFlow.has(r.id));
    // If everything has a parent (cycle), pick the first route as root
    const effectiveRoots = roots.length > 0 ? roots : [flowRoutes[0]];

    trees[flowName] = [];
    for (const root of effectiveRoots) {
      const node = buildNode(root.id, new Set(), 0);
      if (node) trees[flowName].push(node);
    }
  }

  return trees;
}

export default function DashboardTabs({ routes, connections }: { routes: Route[] | null; connections: Connection[] | null }) {
  const [activeTab, setActiveTab] = useState('changes');
  const [expandedFlows, setExpandedFlows] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

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
            <button
              onClick={() => {
                const keys = Object.keys(flowTrees || flowGroups);
                if (allExpanded) {
                  setExpandedFlows([]);
                } else {
                  setExpandedFlows(keys);
                }
                setAllExpanded(!allExpanded);
                setExpandKey(k => k + 1);
              }}
              className="mb-3 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
            {Object.keys(flowTrees || flowGroups).map((flowName, flowIndex, flowKeys) => {
              const count = flowTrees
                ? flowTrees[flowName]?.length
                : flowGroups[flowName]?.length;
              const isExpanded = expandedFlows.includes(flowName);
              const isLastFlow = flowIndex === flowKeys.length - 1;
              return (
                <div key={flowName} className="relative">
                  {/* Vertical connector line between flow nodes */}
                  {flowIndex > 0 && (
                    <div className="absolute border-l-2 border-gray-300"
                      style={{ left: '8px', top: 0, height: '14px' }} />
                  )}
                  {!isLastFlow && (
                    <div className="absolute border-l-2 border-gray-300"
                      style={{ left: '8px', top: '14px', height: 'calc(100% - 14px)' }} />
                  )}

                  <button
                    onClick={() => toggleFlow(flowName)}
                    className="relative flex items-center gap-1.5 w-full text-left py-1.5 text-sm hover:bg-gray-100 rounded cursor-pointer"
                    style={{ paddingLeft: '4px' }}
                  >
                    <span className="w-4 h-4 flex items-center justify-center bg-gray-900 text-white rounded-full text-xs flex-shrink-0">
                      {isExpanded ? '−' : '+'}
                    </span>
                    <span className="font-medium text-gray-900 truncate">{flowName}</span>
                    <span className="ml-auto text-xs text-gray-500">{count}</span>
                  </button>

                  {isExpanded && (
                    <div className="relative">
                      {flowTrees
                        ? flowTrees[flowName]?.map((node, i, arr) => (
                            <SidebarTreeNode key={`${node.id}-${expandKey}`} node={node} depth={1} isLast={i === arr.length - 1} defaultExpanded={allExpanded} />
                          ))
                        : flowGroups[flowName]?.map((route, i, arr) => (
                            <div key={route.id} className="relative">
                              <div className="absolute border-l-2 border-gray-300"
                                style={{ left: '8px', top: 0, height: i === arr.length - 1 ? '14px' : '100%' }} />
                              <div className="absolute border-t-2 border-gray-300"
                                style={{ left: '8px', top: '14px', width: '12px' }} />
                              <div className="py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                                style={{ paddingLeft: '24px' }}>
                                {route.name}
                              </div>
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
                      <FlowTreeRow key={node.id} node={node} />
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

function SidebarTreeNode({ node, depth, isLast = false, defaultExpanded }: { node: RouteNode; depth: number; isLast?: boolean; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? depth === 0);
  const hasChildren = node.children.length > 0;
  const indent = depth * 20;

  return (
    <div className="relative">
      {/* Vertical connector line from parent */}
      {depth > 0 && (
        <div
          className="absolute border-l-2 border-gray-300"
          style={{ left: `${indent - 12}px`, top: 0, height: isLast ? '14px' : '100%' }}
        />
      )}
      {/* Horizontal connector branch */}
      {depth > 0 && (
        <div
          className="absolute border-t-2 border-gray-300"
          style={{ left: `${indent - 12}px`, top: '14px', width: '12px' }}
        />
      )}
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="relative flex items-center gap-1.5 w-full text-left py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
        style={{ paddingLeft: `${indent + 4}px` }}
      >
        {hasChildren ? (
          <span className="w-4 h-4 flex items-center justify-center bg-gray-900 text-white rounded-full text-xs flex-shrink-0">
            {expanded ? '−' : '+'}
          </span>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {expanded && hasChildren && (
        <div className="relative">
          {node.children.map((child, i) => (
            <SidebarTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.length - 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FlowTreeRow({ node }: { node: RouteNode }) {
  // Flatten the tree into a horizontal chain: root → child → grandchild...
  const chain: Route[] = [];
  let current: RouteNode | undefined = node;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    chain.push(current);
    current = current.children[0]; // follow first child for main flow
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 overflow-x-auto pb-4">
        {chain.map((route, i) => (
          <div key={route.id} className="flex items-center gap-3 flex-shrink-0">
            {i > 0 && <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />}
            <ScreenCard route={route} hasChanges={false} />
          </div>
        ))}
      </div>
      {/* Show branching children below if a node has multiple children */}
      {node.children.length > 1 && (
        <div className="ml-8 mt-2 pl-4 border-l-2 border-gray-200 space-y-2">
          {node.children.slice(1).map(child => (
            <FlowTreeRow key={child.id} node={child} />
          ))}
        </div>
      )}
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