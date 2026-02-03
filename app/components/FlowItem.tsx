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
          <span className="flex items-center justify-center w-4 h-4 rounded bg-gray-900 text-white">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        );
      case 'recording':
        return (
          <span className="flex items-center justify-center w-4 h-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center w-4 h-4">
            <span className="w-4 h-4 rounded border-2 border-gray-300" />
          </span>
        );
    }
  };

  const getLabel = () => {
    // Show screen count for any flow that has screens
    if (flow.screenCount > 0) {
      return <span className="text-base text-gray-500 ml-auto">{flow.screenCount} screen{flow.screenCount !== 1 ? 's' : ''}</span>;
    }
    return null;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors font-inter
        ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}
        ${disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}
      `}
    >
      {getIcon()}
      <span className={`text-base text-gray-900 ${isActive ? 'font-medium' : ''}`}>
        {flow.name}
      </span>
      {getLabel()}
    </button>
  );
}
