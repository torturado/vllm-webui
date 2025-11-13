'use client';

import { ChatSession } from '@/lib/chat-storage';
import { formatTimestamp } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
	sessions: ChatSession[];
	currentSessionId: string | null;
	onSelectSession: (session: ChatSession) => void;
	onDeleteSession: (sessionId: string) => void;
	onNewChat: () => void;
	isOpen: boolean;
	onToggle: () => void;
}

export default function Sidebar({
	sessions,
	currentSessionId,
	onSelectSession,
	onDeleteSession,
	onNewChat,
	isOpen,
	onToggle,
}: SidebarProps) {
	const [hoveredSession, setHoveredSession] = useState<string | null>(null);

	return (
		<>
			{/* Mobile overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-terminal-dark/80 z-40 lg:hidden"
					onClick={onToggle}
				/>
			)}

			{/* Sidebar */}
			<div
				className={`fixed lg:static top-0 left-0 h-full w-64 terminal-border-r border-terminal-green bg-terminal-dark z-50 transition-transform duration-200 ${
					isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
				}`}
			>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="terminal-border-b border-terminal-green p-3">
						<div className="flex items-center justify-between mb-3">
							<div className="text-terminal-green font-bold text-sm font-mono">
								CHAT HISTORY
							</div>
							<button
								onClick={onToggle}
								className="lg:hidden terminal-border px-2 py-1 text-xs font-mono"
							>
								×
							</button>
						</div>
						<button
							onClick={onNewChat}
							className="w-full terminal-border px-3 py-2 text-sm font-mono hover:bg-terminal-green hover:text-terminal-dark transition-colors"
						>
							+ NEW CHAT
						</button>
					</div>

					{/* Chat list */}
					<div className="flex-1 overflow-y-auto p-2 space-y-1">
						{sessions.length === 0 ? (
							<div className="text-terminal-green/50 text-xs font-mono p-4 text-center">
								No chat history
							</div>
						) : (
							sessions.map((session) => (
								<div
									key={session.id}
									className={`terminal-border p-2 cursor-pointer transition-colors group relative ${
										currentSessionId === session.id
											? 'bg-terminal-green/20 border-terminal-amber'
											: 'hover:bg-terminal-gray border-terminal-green/50'
									}`}
									onClick={() => {
										onSelectSession(session);
										onToggle(); // Close on mobile
									}}
									onMouseEnter={() => setHoveredSession(session.id)}
									onMouseLeave={() => setHoveredSession(null)}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<div className="text-terminal-green font-mono text-xs font-bold truncate">
												{session.title}
											</div>
											<div className="text-terminal-green/50 text-xs font-mono mt-1">
												{formatTimestamp(session.updatedAt)}
											</div>
										</div>
										{hoveredSession === session.id && (
											<button
												onClick={(e) => {
													e.stopPropagation();
													if (
														confirm(
															'Delete this chat?'
														)
													) {
														onDeleteSession(session.id);
													}
												}}
												className="text-red-500 hover:text-red-400 text-xs font-mono px-1 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												×
											</button>
										)}
									</div>
								</div>
							))
						)}
					</div>

					{/* Footer */}
					<div className="terminal-border-t border-terminal-green p-2">
						<div className="text-terminal-green/50 text-xs font-mono text-center">
							{sessions.length} chat{sessions.length !== 1 ? 's' : ''}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
