'use client';

import { useState, KeyboardEvent, FormEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  isLoading,
  placeholder = 'Type your message... (Enter to send, Shift+Enter for new line)',
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="terminal-border p-2">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 bg-terminal-dark text-terminal-green font-mono text-sm p-2 border-none outline-hidden resize-none min-h-[60px] max-h-[200px]"
          rows={2}
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="terminal-border px-4 py-2 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'SEND'}
        </button>
      </div>
      <div className="text-terminal-green/50 text-xs mt-1 font-mono">
        {isLoading && <span className="terminal-cursor">Processing</span>}
      </div>
    </form>
  );
}
