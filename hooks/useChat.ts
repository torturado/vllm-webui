"use client";

import { ChatStats, Message, ProviderConfig } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

export function useChat() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [streamingContent, setStreamingContent] = useState<string>("");
	const abortControllerRef = useRef<AbortController | null>(null);

	const addMessage = useCallback(
		(message: Omit<Message, "id" | "timestamp">) => {
			const newMessage: Message = {
				...message,
				id: generateId(),
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, newMessage]);
			return newMessage;
		},
		[]
	);

	const sendMessage = useCallback(
		async (
			content: string,
			model: string,
			onStream?: (chunk: string) => void,
			onStats?: (stats: ChatStats) => void,
			provider?: ProviderConfig
		) => {
			if (!content.trim() || isLoading) return;

			// Demo mode: show error if trying to use demo model
			if (model === "demo-model") {
				setError(
					"Demo mode: vLLM server not connected. Please start your vLLM server to use chat functionality."
				);
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			setError(null);
			setStreamingContent(""); // Reset streaming content

			// Add user message
			const userMessage = addMessage({
				role: "user",
				content,
			});

			// Create abort controller for cancellation
			abortControllerRef.current = new AbortController();

			const startTime = Date.now();
			let firstChunkTime: number | null = null;
			let totalTokens = 0;
			let receivedChunks = 0;

			try {
				const response = await fetch("/api/vllm/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model,
						messages: [
							...messages.map((m) => ({
								role: m.role,
								content: m.content,
							})),
							{
								role: "user",
								content,
							},
						],
						provider,
					}),
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					throw new Error(
						`Chat request failed: ${response.statusText}`
					);
				}

				const reader = response.body?.getReader();
				if (!reader) {
					throw new Error("No response body reader available");
				}

				const decoder = new TextDecoder();
				let buffer = "";
				let assistantContent = "";

				while (true) {
					const { done, value } = await reader.read();

					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice(6);
							if (data === "[DONE]") {
								break;
							}

							try {
								const parsed = JSON.parse(data);

								if (parsed.content) {
									if (firstChunkTime === null) {
										firstChunkTime = Date.now();
										const latency =
											firstChunkTime - startTime;
										if (onStats) {
											onStats({
												latency,
												tokensPerSecond: 0,
												promptTokens: 0,
												completionTokens: 0,
												totalTokens: 0,
												generationTime: 0,
											});
										}
									}

									assistantContent += parsed.content;
									receivedChunks++;

									// Update streaming content in real-time
									setStreamingContent(assistantContent);

									// Estimate tokens (rough approximation: 1 token ≈ 4 characters)
									totalTokens = Math.ceil(
										assistantContent.length / 4
									);

									const elapsed =
										(Date.now() -
											(firstChunkTime || startTime)) /
										1000;
									const tokensPerSecond =
										elapsed > 0 ? totalTokens / elapsed : 0;

									if (onStream) {
										onStream(parsed.content);
									}

									if (onStats && firstChunkTime) {
										onStats({
											latency: firstChunkTime - startTime,
											tokensPerSecond,
											promptTokens: 0, // Would need to get from API response
											completionTokens: totalTokens,
											totalTokens,
											generationTime:
												Date.now() - startTime,
										});
									}
								}

								if (parsed.error) {
									throw new Error(parsed.error);
								}
							} catch (e) {
								// Skip invalid JSON
								if (data !== "[DONE]") {
									console.warn(
										"Failed to parse chunk:",
										data
									);
								}
							}
						}
					}
				}

				// Add assistant message
				if (assistantContent) {
					addMessage({
						role: "assistant",
						content: assistantContent,
					});
				}

				setStreamingContent(""); // Clear streaming content when done
				setIsLoading(false);
			} catch (error: any) {
				if (error.name === "AbortError") {
					console.log("Request aborted");
					setStreamingContent(""); // Clear streaming content on abort
				} else {
					console.error("Error sending message:", error);
					setError(error.message || "Failed to send message");
					setStreamingContent(""); // Clear streaming content on error
				}
				setIsLoading(false);
			}
		},
		[messages, isLoading, addMessage]
	);

	const cancelRequest = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
			setIsLoading(false);
		}
	}, []);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setError(null);
	}, []);

	return {
		messages,
		isLoading,
		error,
		streamingContent,
		sendMessage,
		addMessage,
		cancelRequest,
		clearMessages,
		setMessages,
	};
}
