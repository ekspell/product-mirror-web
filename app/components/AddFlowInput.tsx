'use client';

import { useState } from 'react';

type AddFlowInputProps = {
  onAdd: (name: string) => void;
};

export default function AddFlowInput({ onAdd }: AddFlowInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onAdd(trimmed);
      setName('');
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setName('');
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-base text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors font-inter"
      >
        <span className="flex items-center justify-center w-4 h-4 text-gray-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        Add flow
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder="Flow name..."
        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-base text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent font-inter"
      />
    </div>
  );
}
