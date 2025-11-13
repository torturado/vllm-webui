'use client';

import { Message } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-terminal-green/50 font-mono">
        <div className="text-center">
          <div className="mb-2">vLLM Terminal Interface</div>
          <div className="text-sm">Type a message to start chatting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 h-full overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`terminal-border p-3 font-mono text-sm ${
            message.role === 'user'
              ? 'border-terminal-green text-terminal-green'
              : 'border-terminal-amber text-terminal-amber'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">
              {message.role === 'user' ? 'USER' : 'ASSISTANT'}:
            </span>
            <span className="text-terminal-green/50 text-xs">
              [{formatTimestamp(message.timestamp)}]
            </span>
          </div>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          {message.images && message.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Image ${idx + 1}`}
                  className="max-w-xs max-h-32 object-contain border border-terminal-green"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
