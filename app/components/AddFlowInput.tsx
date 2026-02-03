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
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        <span className="flex items-center justify-center w-5 h-5 text-gray-400">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        Add custom flow
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
        className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  );
}
