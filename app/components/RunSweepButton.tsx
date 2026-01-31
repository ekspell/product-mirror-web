'use client';

import { useState } from 'react';
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
      setProgress('Crawling screens...');

      const response = await fetch('/api/sweep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, ...settings }),
      });

      const data = await response.json();

      if (data.success) {
        setProgress('');
        setStatus('Sweep complete! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setProgress('');
        setError(data.error || 'Sweep failed. Please try again.');
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