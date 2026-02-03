'use client';

import { useState, useEffect, useRef } from 'react';
import SweepSettingsModal from './SweepSettingsModal';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

type SweepSettings = {
  captureMode: 'all' | 'specific';
  selectedFlow?: string;
  extractComponents: boolean;
  detectChangesOnly: boolean;
};

type RunSweepButtonProps = {
  flows: string[];
  productId: string | null;
};

export default function RunSweepButton({ flows, productId }: RunSweepButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentSweepId, setCurrentSweepId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const pollSweepStatus = async (sweepId: string) => {
    // Clear any existing interval
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/sweep/status?sweepId=${sweepId}`);
        const data = await response.json();

        if (!data.success || !data.sweep) {
          stopPolling();
          setError('Failed to fetch sweep status');
          setIsRunning(false);
          return;
        }

        const sweep = data.sweep;

        // Update progress message
        if (sweep.current_step && sweep.progress_message) {
          setProgress(`${sweep.current_step}: ${sweep.progress_message}`);
        }

        // Check if sweep is complete or failed
        if (sweep.status === 'completed') {
          stopPolling();
          setProgress('');

          // Build completion message with metrics
          const metrics = [];
          if (sweep.pages_crawled) metrics.push(`${sweep.pages_crawled} screens`);
          if (sweep.tasks_discovered) metrics.push(`${sweep.tasks_discovered} tasks`);
          if (sweep.flows_categorized) metrics.push(`${sweep.flows_categorized} flows`);
          if (sweep.changes_detected) metrics.push(`${sweep.changes_detected} changes`);
          if (sweep.components_extracted) metrics.push(`${sweep.components_extracted} components`);

          const metricsText = metrics.length > 0 ? ` (${metrics.join(', ')})` : '';
          setStatus(`Sweep complete${metricsText}! Refreshing...`);

          setTimeout(() => window.location.reload(), 2000);
        } else if (sweep.status === 'failed') {
          stopPolling();
          setProgress('');
          setError(sweep.error_message || 'Sweep failed. Please try again.');
          setIsRunning(false);
        }
      } catch (error: any) {
        stopPolling();
        setProgress('');
        setError(`Failed to check sweep status: ${error.message}`);
        setIsRunning(false);
      }
    }, 3000); // Poll every 3 seconds
  };

  // Check for running sweeps on mount or when productId changes
  useEffect(() => {
    if (!productId) return;

    async function checkForRunningSweep() {
      try {
        const response = await fetch(`/api/sweep/status?productId=${productId}`);
        const data = await response.json();

        if (data.success && data.sweep && data.sweep.status === 'running') {
          // Found a running sweep - resume polling
          setCurrentSweepId(data.sweep.id);
          setIsRunning(true);
          setProgress(`Resuming: ${data.sweep.current_step || 'In progress'}...`);
          pollSweepStatus(data.sweep.id);
        }
      } catch (error) {
        // Silently fail - no running sweep to resume
      }
    }

    checkForRunningSweep();

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [productId]);

  const handleStartSweep = async (settings: SweepSettings) => {
    setIsModalOpen(false);
    setIsRunning(true);
    setStatus('');
    setError('');
    setProgress('Starting sweep...');

    if (!productId) {
      setError('No product selected');
      setIsRunning(false);
      return;
    }

    console.log('Sweep settings:', settings);

    try {
      const response = await fetch('/api/sweep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, ...settings }),
      });

      const data = await response.json();

      if (data.success && data.sweepId) {
        setCurrentSweepId(data.sweepId);
        setProgress('Sweep started. Initializing...');
        // Start polling for status
        pollSweepStatus(data.sweepId);
      } else {
        setProgress('');
        setError(data.error || 'Failed to start sweep. Please try again.');
        setIsRunning(false);
      }
    } catch (error: any) {
      setProgress('');
      setError(`Network error: ${error.message || 'Failed to connect to server'}`);
      setIsRunning(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 items-start">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isRunning || !productId}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 w-auto"
          title={!productId ? 'Select a product to run sweep' : ''}
        >
          {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
          {isRunning ? 'Running sweep...' : 'Run sweep'}
        </button>

        {/* Progress indicator */}
        {progress && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{progress}</span>
          </div>
        )}

        {/* Success message */}
        {status && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>{status}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Sweep failed</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      <SweepSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartSweep={handleStartSweep}
        flows={flows}
      />
    </>
  );
}