'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import FlowChecklist from './FlowChecklist';

type Flow = {
  id: string;
  name: string;
  status: 'pending' | 'recording' | 'completed';
  screenCount: number;
};

type SessionStatus = {
  sessionId: string;
  status: string;
  startedAt: string;
  browserConnected: boolean;
  activeFlow: { id: string; name: string; screenCount: number } | null;
  flows: Flow[];
  totalScreens: number;
};

type RecordingModeProps = {
  sessionId: string;
  productName: string;
  onEndRecording: () => void;
};

export default function RecordingMode({ sessionId, productName, onEndRecording }: RecordingModeProps) {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null); // tracks which action is loading
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/recording/status?sessionId=${sessionId}`);
      if (!res.ok) return;
      const data: SessionStatus = await res.json();
      setStatus(data);
      setActiveFlowId(data.activeFlow?.id || null);

      // If browser disconnected and session still in_progress, show warning
      if (!data.browserConnected && data.status === 'in_progress') {
        setError('Browser disconnected. End recording or restart.');
      } else {
        setError('');
      }
    } catch {
      // Silent fail on poll — will retry
    }
  }, [sessionId]);

  useEffect(() => {
    // Initial fetch
    pollStatus();

    // Poll every 1.5 seconds
    pollRef.current = setInterval(pollStatus, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollStatus]);

  const handleStartFlow = async (flowId: string) => {
    if (activeFlowId) return; // Already have an active flow
    setLoading('flow-start');

    try {
      const res = await fetch('/api/recording/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, flowId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to start flow');
      } else {
        setActiveFlowId(data.flowId);
        await pollStatus();
      }
    } catch {
      setError('Failed to start flow');
    }

    setLoading(null);
  };

  const handleAddCustomFlow = async (name: string) => {
    setLoading('flow-add');

    try {
      const res = await fetch('/api/recording/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, flowName: name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to add flow');
      } else {
        setActiveFlowId(data.flowId);
        await pollStatus();
      }
    } catch {
      setError('Failed to add flow');
    }

    setLoading(null);
  };

  const handleEndFlow = async () => {
    if (!activeFlowId) return;
    setLoading('flow-end');

    try {
      const res = await fetch('/api/recording/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', sessionId, flowId: activeFlowId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to end flow');
      } else {
        setActiveFlowId(null);
        await pollStatus();
      }
    } catch {
      setError('Failed to end flow');
    }

    setLoading(null);
  };

  const handleEndRecording = async () => {
    // Confirm if there's an active flow
    if (activeFlowId) {
      const confirmed = window.confirm('You have an unfinished flow. End recording anyway?');
      if (!confirmed) return;
    }

    setLoading('end');

    try {
      const res = await fetch('/api/recording/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        if (pollRef.current) clearInterval(pollRef.current);
        onEndRecording();
      }
    } catch {
      setError('Failed to end recording');
    }

    setLoading(null);
  };

  const startedAt = status?.startedAt ? new Date(status.startedAt) : null;
  const elapsed = startedAt ? getElapsed(startedAt) : '';
  const flows = status?.flows || [];

  return (
    <div className="p-8 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Recording Session</h1>
          <p className="text-base text-gray-500 mt-1">
            {productName} {elapsed ? `· Started ${elapsed}` : ''}
          </p>
        </div>
        <button
          onClick={handleEndRecording}
          disabled={loading === 'end'}
          className="px-4 py-2 text-base font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
        >
          {loading === 'end' ? 'Ending...' : 'End Recording'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-base text-red-800">{error}</p>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-8 mb-6 pb-6 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total screens</p>
          <p className="text-2xl font-semibold text-gray-900">{status?.totalScreens || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Flows recorded</p>
          <p className="text-2xl font-semibold text-gray-900">
            {flows.filter(f => f.status === 'completed').length}
          </p>
        </div>
        {status?.browserConnected === false && (
          <div className="ml-auto flex items-center gap-2 text-base text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Browser disconnected
          </div>
        )}
        {status?.browserConnected && (
          <div className="ml-auto flex items-center gap-2 text-base text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Browser connected
          </div>
        )}
      </div>

      {/* Flow Checklist */}
      <div className="mb-6">
        <h2 className="text-base font-medium text-gray-900 mb-3">Your Flows</h2>
        <FlowChecklist
          flows={flows}
          activeFlowId={activeFlowId}
          onStartFlow={handleStartFlow}
          onAddCustomFlow={handleAddCustomFlow}
        />
      </div>

      {/* Done with current flow button */}
      {activeFlowId && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleEndFlow}
            disabled={loading === 'flow-end'}
            className="w-full px-4 py-3 text-base font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {loading === 'flow-end' ? 'Finishing...' : 'Done with current flow'}
          </button>
        </div>
      )}

      {/* Prompt to add a flow */}
      {!activeFlowId && flows.length === 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-base text-gray-500 text-center">
            Add a flow to start recording
          </p>
        </div>
      )}
    </div>
  );
}

function getElapsed(start: Date): string {
  const diff = Math.floor((Date.now() - start.getTime()) / 1000);
  if (diff < 60) return 'just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}
