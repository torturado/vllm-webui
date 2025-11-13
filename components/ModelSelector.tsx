'use client';

import { Model } from '@/lib/types';

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({
  models,
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-terminal-green font-mono text-sm">
        MODEL:
      </label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="bg-terminal-dark text-terminal-green terminal-border px-2 py-1 font-mono text-sm outline-none cursor-pointer"
      >
        {models.length === 0 ? (
          <option value="">Loading models...</option>
        ) : (
          models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
