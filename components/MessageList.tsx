'use client';

import { Message } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  isLoading?: boolean;
}

interface ThinkingBlock {
  tag: string;
  content: string;
  fullMatch: string;
}

// Extract thinking/reasoning blocks from content using a more robust parser
function extractThinkingBlocks(content: string): {
  cleanedContent: string;
  thinkingBlocks: ThinkingBlock[];
} {
  const thinkingBlocks: ThinkingBlock[] = [];
  const thinkingTags = ['thinking', 'reasoning', 'redacted_reasoning', 'thought', 'internal_reasoning', 'think'];

  // Find all opening tags with their positions
  const openTagPattern = new RegExp(`<(${thinkingTags.join('|')})(?:\\s[^>]*)?>`, 'gi');
  const closeTagPattern = new RegExp(`</(${thinkingTags.join('|')})>`, 'gi');

  const matches: Array<{ fullMatch: string; tag: string; content: string; startIndex: number; endIndex: number }> = [];

  // Find all opening tags
  const openTags: Array<{ tag: string; index: number; fullMatch: string }> = [];
  let openMatch;
  openTagPattern.lastIndex = 0;

  while ((openMatch = openTagPattern.exec(content)) !== null) {
    openTags.push({
      tag: openMatch[1].toLowerCase(),
      index: openMatch.index,
      fullMatch: openMatch[0],
    });
  }

  // For each opening tag, find its matching closing tag
  for (const openTag of openTags) {
    const tagName = openTag.tag;
    const startIndex = openTag.index;
    const openTagEnd = startIndex + openTag.fullMatch.length;

    // Look for the matching closing tag
    closeTagPattern.lastIndex = openTagEnd;
    let depth = 1;
    let found = false;
    let closeIndex = -1;
    let closeMatchLength = 0;

    // Search for matching closing tag, handling nested tags of the same type
    let closeMatch: RegExpExecArray | null;
    while ((closeMatch = closeTagPattern.exec(content)) !== null) {
      const closeTagName = closeMatch[1].toLowerCase();
      const closeMatchIndex = closeMatch.index;

      if (closeTagName === tagName) {
        if (depth === 1) {
          // Found matching closing tag
          closeIndex = closeMatchIndex;
          closeMatchLength = closeMatch[0].length;
          found = true;
          break;
        } else {
          // Nested tag of same type, decrease depth
          depth--;
        }
      } else if (openTags.some(ot => ot.tag === closeTagName && ot.index > startIndex && ot.index < closeMatchIndex)) {
        // Found a nested opening tag, increase depth
        depth++;
      }
    }

    if (found && closeIndex !== -1) {
      const fullMatch = content.substring(startIndex, closeIndex + closeMatchLength);
      const blockContent = content.substring(openTagEnd, closeIndex);

      matches.push({
        fullMatch,
        tag: tagName,
        content: blockContent.trim(),
        startIndex,
        endIndex: closeIndex + closeMatchLength,
      });
    }
  }

  // Sort matches by start index (process from end to start to preserve indices)
  matches.sort((a, b) => b.startIndex - a.startIndex);

  // Build cleaned content by removing matched blocks
  let cleanedContent = content;

  for (const match of matches) {
    // Store the thinking block
    thinkingBlocks.unshift({
      tag: match.tag,
      content: match.content,
      fullMatch: match.fullMatch,
    });

    // Remove the block from content
    cleanedContent = cleanedContent.substring(0, match.startIndex) + cleanedContent.substring(match.endIndex);
  }

  // Clean up any extra whitespace/newlines that might be left
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

  return { cleanedContent, thinkingBlocks };
}

// Component for rendering assistant messages with thinking blocks support
function AssistantMessageContent({ content }: { content: string }) {
  const { cleanedContent, thinkingBlocks } = extractThinkingBlocks(content);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());

  const toggleThinking = (index: number) => {
    const newExpanded = new Set(expandedThinking);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedThinking(newExpanded);
  };

  return (
    <div className="markdown-content prose prose-invert max-w-none">
      {/* Render thinking blocks separately */}
      {thinkingBlocks.length > 0 && (
        <div className="mb-3 space-y-2">
          {thinkingBlocks.map((block, index) => {
            const isExpanded = expandedThinking.has(index);
            return (
              <div
                key={index}
                className="terminal-border border-terminal-green/30 bg-terminal-dark/50"
              >
                <div
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-terminal-gray/30 transition-colors"
                  onClick={() => toggleThinking(index)}
                >
                  <span className="text-terminal-green/70 font-mono text-xs font-bold">
                    [{block.tag.toUpperCase()}]
                  </span>
                  <span className="text-terminal-green/50 font-mono text-xs">
                    {isExpanded ? '▼ Hide' : '▶ Show thinking'}
                  </span>
                </div>
                {isExpanded && (
                  <div className="p-3 pt-2 border-t border-terminal-green/20">
                    <div className="text-terminal-green/60 font-mono text-xs whitespace-pre-wrap wrap-break-word leading-relaxed">
                      {block.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Render main content with markdown */}
      {cleanedContent.trim() && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Headings
            h1: ({ node, ...props }) => (
              <h1 className="text-terminal-green font-bold text-xl mb-2 mt-4 font-mono" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-terminal-green font-bold text-lg mb-2 mt-3 font-mono" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-terminal-green font-bold text-base mb-1 mt-2 font-mono" {...props} />
            ),
            // Paragraphs
            p: ({ node, ...props }) => (
              <p className="mb-2 text-terminal-amber leading-relaxed" {...props} />
            ),
            // Code blocks
            code: ({ node, className, children, ...props }: any) => {
              const isInline = !className || !className.includes('language-');
              if (isInline) {
                // Inline code
                return (
                  <code
                    className="bg-terminal-dark text-terminal-green px-1 py-0.5 rounded font-mono text-xs border border-terminal-green/30"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              // Code block (inside pre) - minimal styling, pre handles the block styling
              return (
                <code className="font-mono text-xs whitespace-pre-wrap wrap-break-word" {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ node, children, ...props }: any) => {
              // Pre element wraps code blocks - apply all block styling here
              // Use overflow-wrap and ensure content doesn't break the border
              return (
                <pre className="bg-terminal-dark text-terminal-green p-3 rounded my-2 font-mono text-xs border border-terminal-green/30 block w-full whitespace-pre-wrap wrap-break-word max-w-full overflow-wrap-anywhere" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }} {...props}>
                  {children}
                </pre>
              );
            },
            // Lists
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-2 ml-4 text-terminal-amber space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside mb-2 ml-4 text-terminal-amber space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="text-terminal-amber" {...props} />
            ),
            // Links
            a: ({ node, ...props }) => (
              <a
                className="text-terminal-green underline hover:text-terminal-amber transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            // Blockquotes
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-terminal-green pl-4 my-2 italic text-terminal-green/80"
                {...props}
              />
            ),
            // Tables
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-2">
                <table className="border-collapse border border-terminal-green/30 w-full" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-terminal-dark" {...props} />
            ),
            tbody: ({ node, ...props }) => (
              <tbody {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="border-b border-terminal-green/30" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="border border-terminal-green/30 px-2 py-1 text-terminal-green font-bold font-mono text-xs" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-terminal-green/30 px-2 py-1 text-terminal-amber font-mono text-xs" {...props} />
            ),
            // Horizontal rule
            hr: ({ node, ...props }) => (
              <hr className="border-terminal-green/30 my-4" {...props} />
            ),
            // Strong/Bold
            strong: ({ node, ...props }) => (
              <strong className="font-bold text-terminal-green" {...props} />
            ),
            // Emphasis/Italic
            em: ({ node, ...props }) => (
              <em className="italic" {...props} />
            ),
          }}
        >
          {cleanedContent}
        </ReactMarkdown>
      )}
    </div>
  );
}

export default function MessageList({ messages, streamingContent = "", isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when streaming content updates
  useEffect(() => {
    if (streamingContent && isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingContent, isLoading]);

  if (messages.length === 0 && !streamingContent) {
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
          className={`terminal-border p-3 text-sm ${
            message.role === 'user'
              ? 'border-terminal-green text-terminal-green font-mono'
              : 'border-terminal-amber text-terminal-amber'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold font-mono">
              {message.role === 'user' ? 'USER' : 'ASSISTANT'}:
            </span>
            <span className="text-terminal-green/50 text-xs font-mono">
              [{formatTimestamp(message.timestamp)}]
            </span>
          </div>
          {message.role === 'assistant' ? (
            <AssistantMessageContent content={message.content} />
          ) : (
            <div className="whitespace-pre-wrap wrap-break-word font-mono">
              {message.content}
            </div>
          )}
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
      {streamingContent && isLoading && (
        <div className="terminal-border p-3 text-sm border-terminal-amber text-terminal-amber">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold font-mono">ASSISTANT:</span>
            <span className="text-terminal-green/50 text-xs font-mono">
              [streaming...]
            </span>
          </div>
          <AssistantMessageContent content={streamingContent} />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
