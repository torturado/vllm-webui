'use client';

import { useChat } from '@/hooks/useChat';
import { useStats } from '@/hooks/useStats';
import {
	ChatSession,
	createNewChatSession,
	deleteChatSession,
	generateChatTitle,
	getChatSessions,
	saveChatSession
} from '@/lib/chat-storage';
import { Model, ProviderConfig } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import ModelSelector from './ModelSelector';
import SearchResults from './SearchResults';
import Sidebar from './Sidebar';
import StatsPanel from './StatsPanel';

interface ChatInterfaceProps {
	models: Model[];
	selectedModel: string;
	onModelChange: (model: string) => void;
	provider?: ProviderConfig;
}

export default function ChatInterface({
	models,
	selectedModel,
	onModelChange,
	provider,
}: ChatInterfaceProps) {
	const {
		messages,
		isLoading,
		error,
		sendMessage,
		clearMessages,
		addMessage,
		setMessages,
	} = useChat();
	const { stats, updateStats, resetStats } = useStats();
	const [searchQuery, setSearchQuery] = useState<string | null>(null);
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [currentSession, setCurrentSession] = useState<ChatSession | null>(
		null
	);
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const isInitialLoad = useRef(true);

	// Load chat sessions on mount
	useEffect(() => {
		const loadedSessions = getChatSessions();
		setSessions(loadedSessions);

		// Create new session if none exists
		if (loadedSessions.length === 0) {
			const newSession = createNewChatSession(selectedModel);
			setCurrentSession(newSession);
			saveChatSession(newSession);
			setSessions([newSession]);
		} else {
			// Load most recent session
			setCurrentSession(loadedSessions[0]);
		}
	}, []);

	// Load messages when session changes
	useEffect(() => {
		if (currentSession) {
			isInitialLoad.current = true;
			setMessages(currentSession.messages);
		}
	}, [currentSession?.id, setMessages]);

	// Save session when messages change (but not when loading from session)
	useEffect(() => {
		if (isInitialLoad.current) {
			isInitialLoad.current = false;
			return;
		}

		if (currentSession && messages.length >= 0) {
			const updatedSession: ChatSession = {
				...currentSession,
				messages,
				model: selectedModel,
			};

			// Update title if it's still "New Chat" and we have messages
			if (
				updatedSession.title === 'New Chat' &&
				messages.some((m) => m.role === 'user')
			) {
				updatedSession.title = generateChatTitle(messages);
			}

			saveChatSession(updatedSession);
			setCurrentSession(updatedSession);

			// Update sessions list
			const updatedSessions = getChatSessions();
			setSessions(updatedSessions);
		}
	}, [messages, selectedModel, currentSession?.id]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSend = async (content: string) => {
		// Ensure we have a current session
		if (!currentSession) {
			const newSession = createNewChatSession(selectedModel);
			setCurrentSession(newSession);
			saveChatSession(newSession);
			setSessions(getChatSessions());
		}

		// Check if message contains search request
		const searchMatch = content.match(/search:\s*(.+)/i);
		if (searchMatch) {
			const query = searchMatch[1];
			setSearchQuery(query);
			try {
				const response = await fetch(
					`/api/search?q=${encodeURIComponent(query)}`
				);
				const data = await response.json();
				setSearchResults(data.results || []);

				// Add search results to context
				const searchContext =
					data.results
						?.slice(0, 5)
						.map((r: any) => `${r.title}: ${r.content}`)
						.join('\n\n') || '';

				const enhancedContent = `Based on these search results:\n\n${searchContext}\n\nOriginal question: ${query}`;
				resetStats();
				await sendMessage(
					enhancedContent,
					selectedModel,
					undefined,
					updateStats,
					provider
				);
			} catch (error) {
				console.error('Search error:', error);
				resetStats();
				await sendMessage(content, selectedModel, undefined, updateStats, provider);
			}
		} else {
			resetStats();
			await sendMessage(content, selectedModel, undefined, updateStats, provider);
		}
	};

	const handleNewChat = () => {
		isInitialLoad.current = true;
		const newSession = createNewChatSession(selectedModel);
		setCurrentSession(newSession);
		saveChatSession(newSession);
		setSessions(getChatSessions());
		setSearchQuery(null);
		setSearchResults([]);
	};

	const handleSelectSession = (session: ChatSession) => {
		isInitialLoad.current = true;
		setCurrentSession(session);
		setSearchQuery(null);
		setSearchResults([]);
	};

	const handleDeleteSession = (sessionId: string) => {
		deleteChatSession(sessionId);
		const updatedSessions = getChatSessions();
		setSessions(updatedSessions);

		// If deleted session was current, switch to most recent or create new
		if (currentSession?.id === sessionId) {
			if (updatedSessions.length > 0) {
				setCurrentSession(updatedSessions[0]);
			} else {
				const newSession = createNewChatSession(selectedModel);
				setCurrentSession(newSession);
				saveChatSession(newSession);
				setSessions([newSession]);
			}
		}
	};

	return (
		<div className="flex h-full">
			{/* Sidebar */}
			<Sidebar
				sessions={sessions}
				currentSessionId={currentSession?.id || null}
				onSelectSession={handleSelectSession}
				onDeleteSession={handleDeleteSession}
				onNewChat={handleNewChat}
				isOpen={sidebarOpen}
				onToggle={() => setSidebarOpen(!sidebarOpen)}
			/>

			{/* Main content */}
			<div className="flex-1 flex flex-col h-full overflow-hidden">
				<div className="terminal-border p-2 mb-2 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="lg:hidden terminal-border px-3 py-1 text-xs font-mono"
						>
							☰ MENU
						</button>
						<ModelSelector
							models={models}
							selectedModel={selectedModel}
							onModelChange={onModelChange}
						/>
						{currentSession && (
							<div className="text-terminal-green/70 text-xs font-mono hidden sm:block">
								{currentSession.title}
							</div>
						)}
						<button
							onClick={clearMessages}
							className="terminal-border px-3 py-1 text-xs font-mono"
						>
							CLEAR
						</button>
					</div>
					<StatsPanel stats={stats} />
				</div>

			{error && (
				<div className="terminal-border border-red-500 text-red-500 p-2 mb-2 font-mono text-sm">
					ERROR: {error}
				</div>
			)}

			{searchQuery && searchResults.length > 0 && (
				<div className="mb-2">
					<SearchResults results={searchResults} query={searchQuery} />
				</div>
			)}

				<div className="flex-1 overflow-hidden">
					<MessageList messages={messages} />
					<div ref={messagesEndRef} />
				</div>

				<div className="mt-2">
					<MessageInput onSend={handleSend} isLoading={isLoading} />
				</div>
			</div>
		</div>
	);
}
