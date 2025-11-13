'use client';

import ChatInterface from '@/components/ChatInterface';
import OCRProgress from '@/components/OCRProgress';
import OCRResults from '@/components/OCRResults';
import OCRUploader from '@/components/OCRUploader';
import Settings from '@/components/Settings';
import { useOCR } from '@/hooks/useOCR';
import { useSettings } from '@/hooks/useSettings';
import { Model } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedOCRModel, setSelectedOCRModel] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'ocr'>('chat');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { settings, isLoaded: settingsLoaded } = useSettings();

  const {
    images,
    isProcessing,
    progress,
    results,
    addImages,
    removeImage,
    clearImages,
    processImages,
  } = useOCR();

  useEffect(() => {
    if (settingsLoaded) {
      loadModels();
    }
  }, [settingsLoaded, settings.provider]);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/vllm/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: settings.provider }),
      });
      const data = await response.json();
      setModels(data.models || []);
      if (data.models && data.models.length > 0) {
        // Try to find deepseek-ocr model, otherwise use first model
        const ocrModel = data.models.find((m: Model) =>
          m.id.toLowerCase().includes('deepseek') && m.id.toLowerCase().includes('ocr')
        );
        const defaultModel = data.models[0].id;
        setSelectedModel(defaultModel);
        setSelectedOCRModel(defaultModel);
      } else {
        // Demo mode: add a fake model for preview
        setModels([{ id: 'demo-model', object: 'model', owned_by: 'demo' }]);
        setSelectedModel('demo-model');
        setSelectedOCRModel('demo-model');
      }
      setIsLoadingModels(false);
    } catch (error) {
      console.error('Failed to load models:', error);
      // Demo mode: add a fake model for preview when connection fails
      setModels([{ id: 'demo-model', object: 'model', owned_by: 'demo' }]);
      setSelectedModel('demo-model');
      setSelectedOCRModel('demo-model');
      setIsLoadingModels(false);
    }
  };

  const handleOCRProcess = async () => {
    if (images.length === 0 || !selectedOCRModel) return;
    await processImages(selectedOCRModel, undefined, undefined, settings.provider);
  };

  return (
    <div className="min-h-screen bg-terminal-dark text-terminal-green p-4">
      <div className="max-w-full mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="terminal-border p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-terminal-green font-bold text-lg font-mono">
                vLLM TERMINAL INTERFACE
              </h1>
              <div className="text-terminal-green/50 text-xs font-mono">
                {isLoadingModels
                  ? 'Loading models...'
                  : models[0]?.id === 'demo-model'
                    ? `Demo mode (${settings.provider.name} not connected)`
                    : `${models.length} model(s) available`}
              </div>
              <div className="text-terminal-green/30 text-xs font-mono mt-1">
                Provider: {settings.provider.name}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`terminal-border px-4 py-2 text-sm font-mono ${
                  activeTab === 'chat'
                    ? 'bg-terminal-green text-terminal-dark'
                    : ''
                }`}
              >
                CHAT
              </button>
              <button
                onClick={() => setActiveTab('ocr')}
                className={`terminal-border px-4 py-2 text-sm font-mono ${
                  activeTab === 'ocr'
                    ? 'bg-terminal-green text-terminal-dark'
                    : ''
                }`}
              >
                OCR
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="terminal-border px-4 py-2 text-sm font-mono hover:bg-terminal-green hover:text-terminal-dark transition-colors"
              >
                ⚙ SETTINGS
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <div className="h-full">
              {isLoadingModels ? (
                <div className="flex items-center justify-center h-full text-terminal-green/50 font-mono">
                  Loading models...
                </div>
              ) : (
                <>
                  {models.length === 0 || models[0]?.id === 'demo-model' ? (
                    <div className="terminal-border border-terminal-amber p-2 mb-2 text-terminal-amber text-xs font-mono">
                      ⚠ DEMO MODE: vLLM server not connected. Interface is shown for preview only.
                    </div>
                  ) : null}
                  <div className="h-full">
                    <ChatInterface
                      models={models}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      provider={settings.provider}
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto space-y-4">
              {isLoadingModels ? (
                <div className="flex items-center justify-center h-full text-terminal-green/50 font-mono">
                  Loading models...
                </div>
              ) : (
                <>
                  {models.length === 0 || models[0]?.id === 'demo-model' ? (
                    <div className="terminal-border border-terminal-amber p-2 mb-2 text-terminal-amber text-xs font-mono">
                      ⚠ DEMO MODE: {settings.provider.name} server not connected. Interface is shown for preview only.
                    </div>
                  ) : null}

                  {/* Model Selector for OCR */}
                  <div className="terminal-border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-terminal-green font-mono text-sm">
                        OCR MODEL:
                      </label>
                      <select
                        value={selectedOCRModel}
                        onChange={(e) => setSelectedOCRModel(e.target.value)}
                        disabled={isProcessing}
                        className="flex-1 bg-terminal-dark text-terminal-green terminal-border px-2 py-1 font-mono text-sm outline-hidden cursor-pointer disabled:opacity-50"
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
                  </div>

                  <OCRUploader
                    images={images}
                    onAddImages={addImages}
                    onRemoveImage={removeImage}
                    isProcessing={isProcessing}
                  />

                  {images.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleOCRProcess}
                        disabled={isProcessing || !selectedOCRModel}
                        className="terminal-border px-4 py-2 font-mono text-sm disabled:opacity-50 hover:bg-terminal-green hover:text-terminal-dark transition-colors"
                      >
                        {isProcessing ? 'PROCESSING...' : 'PROCESS OCR'}
                      </button>
                      <button
                        onClick={clearImages}
                        disabled={isProcessing}
                        className="terminal-border px-4 py-2 font-mono text-sm disabled:opacity-50 hover:bg-terminal-gray transition-colors"
                      >
                        CLEAR
                      </button>
                    </div>
                  )}

              {isProcessing && (
                <OCRProgress
                  processed={progress.processed}
                  total={progress.total}
                  errors={progress.errors}
                />
              )}

              {results.length > 0 && <OCRResults results={results} />}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="terminal-border p-2 mt-4 text-terminal-green/50 text-xs font-mono text-center">
          vLLM Web UI | Terminal Interface | Press F12 for console
        </div>
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
