'use client';

import { useState } from 'react';

type SweepSettings = {
  captureMode: 'all' | 'specific';
  selectedFlow?: string;
  extractComponents: boolean;
  detectChangesOnly: boolean;
};

type SweepSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStartSweep: (settings: SweepSettings) => void;
  flows: string[];
};

export default function SweepSettingsModal({ isOpen, onClose, onStartSweep, flows }: SweepSettingsModalProps) {
  const [captureMode, setCaptureMode] = useState<'all' | 'specific'>('all');
  const [selectedFlow, setSelectedFlow] = useState<string>(flows[0] || '');
  const [extractComponents, setExtractComponents] = useState(false);
  const [detectChangesOnly, setDetectChangesOnly] = useState(false);

  if (!isOpen) return null;

  const handleStartSweep = () => {
    const settings: SweepSettings = {
      captureMode,
      selectedFlow: captureMode === 'specific' ? selectedFlow : undefined,
      extractComponents,
      detectChangesOnly,
    };
    onStartSweep(settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sweep settings</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Capture mode */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="captureMode"
                checked={captureMode === 'all'}
                onChange={() => setCaptureMode('all')}
                className="w-4 h-4 text-gray-900"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Capture all screens</div>
                <div className="text-xs text-gray-500">Discover and capture all screens in the product</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="captureMode"
                checked={captureMode === 'specific'}
                onChange={() => setCaptureMode('specific')}
                className="w-4 h-4 text-gray-900 mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Capture specific flow</div>
                <div className="text-xs text-gray-500 mb-2">Re-capture screens from a specific flow only</div>
                {captureMode === 'specific' && (
                  <select
                    value={selectedFlow}
                    onChange={(e) => setSelectedFlow(e.target.value)}
                    className="w-full mt-2 border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {flows.map((flow) => (
                      <option key={flow} value={flow}>
                        {flow}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Additional options */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={extractComponents}
                onChange={(e) => setExtractComponents(e.target.checked)}
                className="w-4 h-4 text-gray-900 mt-0.5 rounded"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Extract components</div>
                <div className="text-xs text-gray-500">Identify and extract UI components from screenshots</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={detectChangesOnly}
                onChange={(e) => setDetectChangesOnly(e.target.checked)}
                className="w-4 h-4 text-gray-900 mt-0.5 rounded"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Detect changes only</div>
                <div className="text-xs text-gray-500">Re-capture existing routes without discovering new screens</div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartSweep}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Start sweep
          </button>
        </div>
      </div>
    </div>
  );
}
