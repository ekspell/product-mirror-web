'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, ChevronRight, X, Search } from 'lucide-react';

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

type Component = {
  id: string;
  name: string;
  image_url: string;
  instance_count: number;
  screen_count: number;
};

type RouteNode = Route & {
  children: RouteNode[];
};

function buildFlowTrees(routes: Route[], connections: Connection[]): Record<string, RouteNode[]> {
  const connectedIds = new Set<string>();
  for (const conn of connections) {
    connectedIds.add(conn.source_route_id);
    connectedIds.add(conn.destination_route_id);
  }
  const relevantRoutes = routes.filter(r => connectedIds.has(r.id));

  const flowGrouped = new Map<string, Route[]>();
  for (const route of relevantRoutes) {
    const flowName = route.flow_name || 'Ungrouped';
    if (!flowGrouped.has(flowName)) flowGrouped.set(flowName, []);
    flowGrouped.get(flowName)!.push(route);
  }

  const routeFlowMap = new Map<string, string>();
  for (const route of relevantRoutes) {
    routeFlowMap.set(route.id, route.flow_name || 'Ungrouped');
  }

  const childrenOf = new Map<string, string[]>();
  const hasParentInFlow = new Set<string>();
  for (const conn of connections) {
    const srcFlow = routeFlowMap.get(conn.source_route_id);
    const dstFlow = routeFlowMap.get(conn.destination_route_id);
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

  const trees: Record<string, RouteNode[]> = {};
  for (const [flowName, flowRoutes] of flowGrouped) {
    const roots = flowRoutes.filter(r => !hasParentInFlow.has(r.id));
    const effectiveRoots = roots.length > 0 ? roots : [flowRoutes[0]];
    trees[flowName] = [];
    for (const root of effectiveRoots) {
      const node = buildNode(root.id, new Set(), 0);
      if (node) trees[flowName].push(node);
    }
  }

  return trees;
}

type FlowSection = {
  key: string;
  label: string;
  parentLabel: string | null;
  routes: Route[];
};

function cleanScreenName(name: string, flowName: string): string {
  // Strip flow name suffix from screen name
  // Handles patterns like "Calendar Settings-Availability", "Calendar Settings - Availability",
  // "Calendar Settings | Availability", "Availability - Calendar Settings"
  const flow = flowName.toLowerCase();
  let cleaned = name;

  // Remove trailing flow name with various separators: " - Flow", "-Flow", " | Flow"
  const trailPattern = new RegExp(`\\s*[-–—|]\\s*${flow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
  cleaned = cleaned.replace(trailPattern, '');

  // Remove leading flow name: "Flow - Name", "Flow | Name"
  const leadPattern = new RegExp(`^\\s*${flow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—|]\\s*`, 'i');
  cleaned = cleaned.replace(leadPattern, '');

  return cleaned.trim() || name;
}

function flattenFlowTrees(flowTrees: Record<string, RouteNode[]>, flowGroups: Record<string, Route[]>): FlowSection[] {
  const sections: FlowSection[] = [];

  for (const flowName of Object.keys(flowGroups)) {
    const trees = flowTrees[flowName];
    if (!trees || trees.length === 0) {
      // No tree data — show as flat section
      sections.push({ key: flowName, label: flowName, parentLabel: null, routes: flowGroups[flowName] });
      continue;
    }

    // Walk the tree: each node becomes its own section with a cleaned label
    function walkNode(node: RouteNode, parentName: string | null, flowName: string) {
      const cleanedLabel = cleanScreenName(node.name, flowName);
      sections.push({
        key: node.id,
        label: cleanedLabel,
        parentLabel: parentName,
        routes: [node],
      });

      for (const child of node.children) {
        walkNode(child, cleanedLabel, flowName);
      }
    }

    // Root nodes belong to the flow — group all roots together as the flow section
    const rootRoutes = trees.map(t => t as Route);
    sections.push({
      key: flowName,
      label: flowName,
      parentLabel: null,
      routes: rootRoutes,
    });

    // Then walk each root's children
    for (const root of trees) {
      for (const child of root.children) {
        walkNode(child, flowName, flowName);
      }
    }
  }

  return sections;
}

export default function DashboardTabs({ routes, connections, components }: { routes: Route[] | null; connections: Connection[] | null; components: Component[] | null }) {
  const [activeTab, setActiveTab] = useState('changes');
  const [visibleFlow, setVisibleFlow] = useState<string | null>(null);
  const [expandedFlows, setExpandedFlows] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [treeNavWidth, setTreeNavWidth] = useState(320); // Default 320px
  const [isResizing, setIsResizing] = useState(false);
  const [localComponents, setLocalComponents] = useState<Component[]>(components || []);
  const [flowScrollStates, setFlowScrollStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const flowScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingTo = useRef(false);

  // Update local components when props change
  useEffect(() => {
    setLocalComponents(components || []);
  }, [components]);

  // Filter data based on search query
  const filteredRoutes = routes?.filter(route => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesScreenName = route.name?.toLowerCase().includes(query);
    const matchesFlowName = route.flow_name?.toLowerCase().includes(query);
    return matchesScreenName || matchesFlowName;
  }) || [];

  const filteredComponents = localComponents.filter(component => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return component.name.toLowerCase().includes(query);
  });

  // Delete component handler
  const handleDeleteComponent = async (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    if (!confirm('Are you sure you want to delete this component? This will also delete all instances.')) {
      return;
    }

    try {
      const response = await fetch(`/api/components/${componentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete component');
      }

      // Update local state to remove the deleted component
      setLocalComponents(prev => prev.filter(c => c.id !== componentId));
    } catch (error) {
      console.error('Error deleting component:', error);
      alert('Failed to delete component. Please try again.');
    }
  };

  const hasConnections = Array.isArray(connections) && connections.length > 0;
  const flowTrees = hasConnections && filteredRoutes
    ? buildFlowTrees(filteredRoutes, connections)
    : null;

  const flowGroups = filteredRoutes?.reduce((acc, route) => {
    const flowName = route.flow_name || 'Ungrouped';
    if (!acc[flowName]) {
      acc[flowName] = [];
    }
    acc[flowName].push(route);
    return acc;
  }, {} as Record<string, Route[]>) || {};

  const flowNames = Object.keys(flowGroups).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return 0;
  });

  const flowSections: FlowSection[] = flowTrees
    ? flattenFlowTrees(flowTrees, flowGroups)
    : Object.entries(flowGroups).map(([flowName, routes]) => ({
        key: flowName,
        label: flowName,
        parentLabel: null,
        routes,
      }));

  // Count screens per flow based on what's actually shown in the main content
  const flowScreenCounts: Record<string, number> = {};
  for (const section of flowSections) {
    // Find which top-level flow this section belongs to
    const flow = flowNames.includes(section.key) ? section.key
      : flowNames.find(f => section.parentLabel === f || routes?.find(r => r.id === section.key)?.flow_name === f)
      || section.parentLabel || section.label;
    flowScreenCounts[flow] = (flowScreenCounts[flow] || 0) + section.routes.length;
  }

  // Map section keys back to their parent flow name for sidebar highlighting
  const sectionKeyToFlow = new Map<string, string>();
  for (const section of flowSections) {
    // Root sections use flowName as key; child sections use route ID
    // Find which flow this section belongs to by checking if key matches a flowName
    if (flowNames.includes(section.key)) {
      sectionKeyToFlow.set(section.key, section.key);
    } else {
      // Child section — derive flow from label hierarchy
      sectionKeyToFlow.set(section.key, section.parentLabel || section.label);
    }
  }

  // Scroll-linked highlighting via IntersectionObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || activeTab !== 'flows') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        let topEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
              topEntry = entry;
            }
          }
        }
        if (topEntry) {
          const sectionKey = (topEntry.target as HTMLElement).dataset.flow;
          if (sectionKey) {
            // Resolve to the root flow name for sidebar highlighting
            const flowName = sectionKeyToFlow.get(sectionKey) || sectionKey;
            setVisibleFlow(flowName);
          }
        }
      },
      {
        root: container,
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0,
      }
    );

    for (const section of flowSections) {
      const el = sectionRefs.current[section.key];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [activeTab, flowSections.map(s => s.key).join(',')]);

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

  // Handle tree nav resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      // Constrain between 200px and 600px
      if (newWidth >= 200 && newWidth <= 600) {
        setTreeNavWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);


  return (
    <>
      <div className="border-t border-b border-gray-200">
        <div className="px-8 flex items-center justify-between h-16">
          <div className="flex items-center h-full">
            <button className="flex items-center gap-2 text-base text-gray-500 pr-6 h-full relative">
              Latest
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Full-height divider */}
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-200"></div>
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-200 rounded-lg pl-10 pr-8 py-2 text-sm w-64 placeholder-gray-500 bg-white text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'changes' && (
        <div className="p-8">
          {filteredRoutes.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500 mb-2">No results for "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {filteredRoutes.map((route, index) => {
            const latestCapture = route.captures?.[0];
            const hasChanges = index % 2 === 0;
            const changeCount = (index % 5) + 2;

            return (
              <div key={route.id} className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="relative aspect-video bg-gray-200">
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
              </div>
            );
          })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'flows' && (
        <div className="flex" style={{ height: 'calc(100vh - 160px)' }}>
          {/* Resizable Tree Navigation */}
          <div
            className="py-2 overflow-y-auto flex-shrink-0 relative"
            style={{ width: `${treeNavWidth}px` }}
          >
            <button
              onClick={() => {
                if (allExpanded) {
                  setExpandedFlows([]);
                  setAllExpanded(false);
                } else {
                  setExpandedFlows([...flowNames]);
                  setAllExpanded(true);
                }
                setExpandKey(k => k + 1);
              }}
              className="px-3 py-1.5 mb-1 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
            {flowNames.map(flowName => {
              const screens = flowGroups[flowName];
              const isActive = visibleFlow === flowName;
              const isExpanded = expandedFlows.includes(flowName);
              const treeNodes = flowTrees?.[flowName];
              const hasChildren = treeNodes && treeNodes.length > 0;

              return (
                <div key={flowName}>
                  <button
                    onClick={() => {
                      scrollToFlow(flowName);
                      if (hasChildren) {
                        setExpandedFlows(prev =>
                          prev.includes(flowName)
                            ? prev.filter(f => f !== flowName)
                            : [...prev, flowName]
                        );
                      }
                    }}
                    className={`flex items-center gap-1.5 w-full text-left px-3 py-2 text-base transition-colors ${isActive ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {hasChildren ? (
                      <svg
                        width="12" height="12" viewBox="0 0 12 12"
                        className={`text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    ) : (
                      <span className="w-3 flex-shrink-0" />
                    )}
                    <span className="truncate">{flowName}</span>
                    <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{flowScreenCounts[flowName] || screens.length}</span>
                  </button>
                  {isExpanded && hasChildren && (
                    <div className="relative">
                      {treeNodes.map((node, i) => (
                        <SidebarTreeNode
                          key={`${node.id}-${expandKey}`}
                          node={node}
                          depth={1}
                          isLast={i === treeNodes.length - 1}
                          visibleFlow={visibleFlow}
                          onScrollTo={scrollToFlow}
                          flowName={flowName}
                          defaultExpanded={allExpanded}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Resize handle */}
            <div
              onMouseDown={handleMouseDown}
              className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-500' : ''}`}
            />
          </div>

          {/* Main content area with horizontal scrolling flows */}
          <div ref={scrollContainerRef} className="flex-1 py-8 overflow-y-auto">
            {flowNames.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-gray-500 mb-2">No results for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              flowNames.map(flowName => {
              const screens = flowGroups[flowName];
              const showScrollButton = flowScrollStates[flowName] ?? true;

              const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
                const target = e.currentTarget;
                const hasMore = target.scrollWidth > target.clientWidth + target.scrollLeft + 10;
                if (hasMore !== showScrollButton) {
                  setFlowScrollStates(prev => ({ ...prev, [flowName]: hasMore }));
                }
              };

              const handleScrollClick = () => {
                const scrollContainer = flowScrollRefs.current[flowName];
                if (scrollContainer) {
                  scrollContainer.scrollBy({ left: 396, behavior: 'smooth' }); // 380px card + 16px gap
                }
              };

              return (
                <div
                  key={flowName}
                  className="mb-12 px-8"
                  ref={el => { sectionRefs.current[flowName] = el; }}
                  data-flow={flowName}
                >
                  {/* Horizontal scroll container with gradient */}
                  <div className="relative">
                    <div
                      ref={el => { flowScrollRefs.current[flowName] = el; }}
                      className="flex overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide"
                      onScroll={handleScroll}
                      style={{
                        gap: '16px',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {screens.map(route => (
                        <FlowScreenCard key={route.id} route={route} />
                      ))}
                    </div>

                    {/* Right gradient fade with arrow button */}
                    {showScrollButton && (
                      <div
                        className="absolute right-0 top-0 bottom-2 flex items-center justify-end pr-4 pointer-events-none"
                        style={{
                          width: '80px',
                          background: 'linear-gradient(to left, white 0%, white 50%, transparent 100%)'
                        }}
                      >
                        <button
                          onClick={handleScrollClick}
                          className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center pointer-events-auto hover:bg-gray-800 transition-colors shadow-lg"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Flow header below the cards */}
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">{flowName}</h3>
                    <p className="text-sm text-gray-500">{screens.length} {screens.length === 1 ? 'screen' : 'screens'}</p>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

     {activeTab === 'components' && (
        <div className="p-8">
          {filteredComponents.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-6">
                {filteredComponents.length} UI components {searchQuery ? `matching "${searchQuery}"` : 'extracted across screens'}
              </p>
              <div className="grid grid-cols-4 gap-6">
                {filteredComponents
                  .sort((a, b) => b.instance_count - a.instance_count)
                  .map(component => (
                    <div key={component.id} className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer transition-colors group relative">
                      <div className="relative aspect-square bg-white overflow-hidden flex items-center justify-center p-4">
                        <img
                          src={component.image_url}
                          alt={component.name}
                          className="max-w-full max-h-full object-contain"
                        />
                        <button
                          onClick={(e) => handleDeleteComponent(component.id, e)}
                          className="absolute top-2 right-2 p-2 bg-white text-red-600 rounded-lg hover:shadow-md hover:bg-red-50 hover:text-red-700 transition-all"
                          title="Delete component"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-gray-900 text-sm">{component.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {component.instance_count} {component.instance_count === 1 ? 'instance' : 'instances'} across {component.screen_count} {component.screen_count === 1 ? 'screen' : 'screens'}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500 mb-2">No results for "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500 mb-4">No components extracted yet</p>
              <p className="text-xs text-gray-400 max-w-md">
                Run component extraction to automatically identify and catalog UI components from your screenshots
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Component examples function removed - now using AI-extracted components from database

function SidebarTreeNode({ node, depth, isLast, visibleFlow, onScrollTo, flowName, defaultExpanded }: {
  node: RouteNode;
  depth: number;
  isLast: boolean;
  visibleFlow: string | null;
  onScrollTo: (flowName: string) => void;
  flowName: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const hasChildren = node.children.length > 0;
  const indent = depth * 16;
  const displayName = cleanScreenName(node.name, flowName);

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div
        className="absolute border-l border-gray-200"
        style={{ left: `${indent + 6}px`, top: 0, height: isLast ? '16px' : '100%' }}
      />
      {/* Horizontal connector branch */}
      <div
        className="absolute border-t border-gray-200"
        style={{ left: `${indent + 6}px`, top: '16px', width: '8px' }}
      />
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          if (node.flow_name) onScrollTo(node.flow_name);
        }}
        className="relative flex items-center gap-1 w-full text-left py-1.5 text-base text-gray-600 hover:bg-gray-50 rounded transition-colors"
        style={{ paddingLeft: `${indent + 18}px` }}
      >
        {hasChildren ? (
          <svg
            width="10" height="10" viewBox="0 0 12 12"
            className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        ) : (
          <span className="w-2.5 flex-shrink-0" />
        )}
        <span className="truncate text-base">{displayName}</span>
      </button>
      {expanded && hasChildren && (
        <div className="relative">
          {node.children.map((child, i) => (
            <SidebarTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.length - 1}
              visibleFlow={visibleFlow}
              onScrollTo={onScrollTo}
              flowName={flowName}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FlowScreenCard({ route }: { route: Route }) {
  const latestCapture = route.captures?.[0];

  return (
    <div className="flex-shrink-0 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
         style={{ width: '380px', height: '232px' }}>
      <div className="relative w-full h-full bg-gray-200">
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
      </div>
    </div>
  );
}

function ScreenCard({ route, hasChanges, hideLabel, large }: { route: Route; hasChanges: boolean; hideLabel?: boolean; large?: boolean }) {
  const latestCapture = route.captures?.[0];

  // For large cards on 1440px desktop, use most of viewport width minus tree nav and padding
  // This will make each screenshot fill ~90% of visible area with ~50% of next one visible
  const cardClass = large
    ? "w-full bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer"
    : "flex-shrink-0 w-72 bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer";

  return (
    <div className={cardClass}>
      <div className="relative aspect-video bg-gray-200 overflow-hidden rounded-lg">
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
      {!hideLabel && (
        <div className="p-3">
          <p className="font-medium text-gray-900 text-sm">{route.name}</p>
        </div>
      )}
    </div>
  );
}