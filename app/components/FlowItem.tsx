'use client';

type Flow = {
  id: string;
  name: string;
  status: 'pending' | 'recording' | 'completed';
  screenCount: number;
};

type FlowItemProps = {
  flow: Flow;
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
};

export default function FlowItem({ flow, isActive, onClick, disabled }: FlowItemProps) {
  const getIcon = () => {
    switch (flow.status) {
      case 'completed':
        return (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        );
      case 'recording':
        return (
          <span className="flex items-center justify-center w-5 h-5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center w-5 h-5">
            <span className="w-3 h-3 rounded-full border-2 border-gray-300" />
          </span>
        );
    }
  };

  const getLabel = () => {
    // Show screen count for any flow that has screens
    if (flow.screenCount > 0) {
      return <span className="text-xs text-gray-500 ml-auto">{flow.screenCount} screen{flow.screenCount !== 1 ? 's' : ''}</span>;
    }
    return null;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
        ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}
        ${disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}
      `}
    >
      {getIcon()}
      <span className={`text-sm text-gray-900 ${isActive ? 'font-medium' : ''}`}>
        {flow.name}
      </span>
      {getLabel()}
    </button>
  );
}
