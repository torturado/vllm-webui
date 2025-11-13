import { ProviderConfig } from "@/lib/types";
import { ChatRequest, chatCompletionStream } from "@/lib/vllm-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const chatRequest: ChatRequest = {
			model: body.model,
			messages: body.messages,
			stream: true,
			temperature: body.temperature || 0.7,
			max_tokens: body.max_tokens,
		};

		const provider: ProviderConfig | undefined = body.provider;

		// Create a ReadableStream for streaming response
		const stream = new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();

				try {
					for await (const chunk of chatCompletionStream(
						chatRequest,
						provider
					)) {
						const data = `data: ${JSON.stringify({
							content: chunk,
						})}\n\n`;
						controller.enqueue(encoder.encode(data));
					}

					controller.enqueue(encoder.encode("data: [DONE]\n\n"));
					controller.close();
				} catch (error) {
					console.error("Streaming error:", error);
					const errorData = `data: ${JSON.stringify({
						error: "Streaming failed",
					})}\n\n`;
					controller.enqueue(encoder.encode(errorData));
					controller.close();
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error in chat route:", error);
		return NextResponse.json(
			{ error: "Failed to process chat request" },
			{ status: 500 }
		);
	}
}
