'use client';

import { useState } from 'react';
import SweepSettingsModal from './SweepSettingsModal';

type SweepSettings = {
  captureMode: 'all' | 'specific';
  selectedFlow?: string;
  extractComponents: boolean;
  detectChangesOnly: boolean;
};

type RunSweepButtonProps = {
  flows: string[];
};

export default function RunSweepButton({ flows }: RunSweepButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartSweep = async (settings: SweepSettings) => {
    setIsModalOpen(false);
    setIsRunning(true);
    setStatus('Running sweep...');

    // Store settings for future use
    console.log('Sweep settings:', settings);

    try {
      // TODO: Pass settings to the API endpoint
      const response = await fetch('/api/sweep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (data.success) {
        setStatus('Sweep complete!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus('Sweep failed');
      }
    } catch (error) {
      setStatus('Error running sweep');
    }

    setIsRunning(false);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isRunning}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isRunning ? 'Running...' : 'Run sweep'}
        </button>
        {status && <span className="text-sm text-gray-500">{status}</span>}
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