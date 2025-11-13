import { Message } from "./types";
import { generateId } from "./utils";

export interface ChatSession {
	id: string;
	title: string;
	messages: Message[];
	model: string;
	createdAt: number;
	updatedAt: number;
}

const STORAGE_KEY = "vllm-chat-sessions";

export function getChatSessions(): ChatSession[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];
		return JSON.parse(stored);
	} catch (error) {
		console.error("Error loading chat sessions:", error);
		return [];
	}
}

export function saveChatSession(session: ChatSession): void {
	try {
		const sessions = getChatSessions();
		const index = sessions.findIndex((s) => s.id === session.id);

		if (index >= 0) {
			sessions[index] = { ...session, updatedAt: Date.now() };
		} else {
			sessions.push({ ...session, updatedAt: Date.now() });
		}

		// Sort by updatedAt descending
		sessions.sort((a, b) => b.updatedAt - a.updatedAt);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
	} catch (error) {
		console.error("Error saving chat session:", error);
	}
}

export function createNewChatSession(model: string): ChatSession {
	return {
		id: generateId(),
		title: "New Chat",
		messages: [],
		model,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

export function deleteChatSession(sessionId: string): void {
	try {
		const sessions = getChatSessions();
		const filtered = sessions.filter((s) => s.id !== sessionId);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
	} catch (error) {
		console.error("Error deleting chat session:", error);
	}
}

export function updateChatTitle(sessionId: string, title: string): void {
	try {
		const sessions = getChatSessions();
		const index = sessions.findIndex((s) => s.id === sessionId);
		if (index >= 0) {
			sessions[index].title = title;
			sessions[index].updatedAt = Date.now();
			localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
		}
	} catch (error) {
		console.error("Error updating chat title:", error);
	}
}

export function generateChatTitle(messages: Message[]): string {
	// Generate title from first user message
	const firstUserMessage = messages.find((m) => m.role === "user");
	if (firstUserMessage) {
		const content = firstUserMessage.content.trim();
		if (content.length > 50) {
			return content.substring(0, 50) + "...";
		}
		return content;
	}
	return "New Chat";
}
