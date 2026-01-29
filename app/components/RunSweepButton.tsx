'use client';

import { useState } from 'react';

export default function RunSweepButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('');

  const handleSweep = async () => {
    setIsRunning(true);
    setStatus('Running sweep...');
    
    try {
      const response = await fetch('/api/sweep', { method: 'POST' });
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
    <div className="flex items-center gap-4">
      <button 
        onClick={handleSweep}
        disabled={isRunning}
        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400"
      >
        {isRunning ? 'Running...' : 'Run sweep'}
      </button>
      {status && <span className="text-sm text-gray-500">{status}</span>}
    </div>
  );
}