'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

type Flow = {
  id: string;
  name: string;
  level: number;
  screenCount: number;
  children: Flow[];
};

type FlowTreeViewProps = {
  productId: string | null;
  onFlowSelect?: (flowId: string, flowName: string) => void;
  selectedFlowId?: string | null;
};

export default function FlowTreeView({ productId, onFlowSelect, selectedFlowId }: FlowTreeViewProps) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!productId) {
      setFlows([]);
      setLoading(false);
      return;
    }

    fetchFlows();
  }, [productId]);

  async function fetchFlows() {
    if (!productId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/flows?productId=${productId}`);
      const data = await response.json();

      if (data.success && data.flows) {
        setFlows(data.flows);
        // Auto-expand all root flows
        const rootIds = data.flows.map((f: Flow) => f.id);
        setExpandedFlows(new Set(rootIds));
      }
    } catch (error) {
      console.error('Failed to fetch flows:', error);
    }
    setLoading(false);
  }

  function toggleExpand(flowId: string) {
    setExpandedFlows(prev => {
      const next = new Set(prev);
      if (next.has(flowId)) {
        next.delete(flowId);
      } else {
        next.add(flowId);
      }
      return next;
    });
  }

  function handleFlowClick(flow: Flow) {
    // Toggle expand if has children
    if (flow.children && flow.children.length > 0) {
      toggleExpand(flow.id);
    }

    // Notify parent of selection
    if (onFlowSelect) {
      onFlowSelect(flow.id, flow.name);
    }
  }

  function renderFlow(flow: Flow, depth: number = 0) {
    const isExpanded = expandedFlows.has(flow.id);
    const hasChildren = flow.children && flow.children.length > 0;
    const isSelected = selectedFlowId === flow.id;

    return (
      <div key={flow.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => handleFlowClick(flow)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Folder Icon */}
          <div className="flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )
            ) : (
              <div className="w-1 h-1 rounded-full bg-gray-400" />
            )}
          </div>

          {/* Flow Name */}
          <span className={`flex-1 text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
            {flow.name}
          </span>

          {/* Screen Count */}
          {flow.screenCount > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              {flow.screenCount}
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {flow.children.map(child => renderFlow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="animate-pulse">Loading flows...</div>
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Select a product to view flows
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="mb-2">No flows found</p>
        <p className="text-sm">Run a sweep to categorize screens into flows</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Flow Hierarchy</h3>
        <p className="text-xs text-gray-500">
          {flows.length} root flow{flows.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-1">
        {flows.map(flow => renderFlow(flow, 0))}
      </div>
    </div>
  );
}
