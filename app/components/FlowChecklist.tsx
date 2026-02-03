'use client';

import FlowItem from './FlowItem';
import AddFlowInput from './AddFlowInput';

type Flow = {
  id: string;
  name: string;
  status: 'pending' | 'recording' | 'completed';
  screenCount: number;
};

type FlowChecklistProps = {
  flows: Flow[];
  activeFlowId: string | null;
  onStartFlow: (flowId: string) => void;
  onAddCustomFlow: (name: string) => void;
};

export default function FlowChecklist({ flows, activeFlowId, onStartFlow, onAddCustomFlow }: FlowChecklistProps) {
  const hasActiveFlow = activeFlowId !== null;

  return (
    <div className="space-y-0.5">
      {flows.map((flow) => (
        <FlowItem
          key={flow.id}
          flow={flow}
          isActive={flow.id === activeFlowId}
          onClick={() => onStartFlow(flow.id)}
          disabled={hasActiveFlow && flow.id !== activeFlowId}
        />
      ))}
      <AddFlowInput onAdd={onAddCustomFlow} />
    </div>
  );
}
