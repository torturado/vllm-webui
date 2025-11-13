import {
	ChatCompletionResponse,
	ChatRequest,
	Model,
	ModelsResponse,
} from "./types";

const VLLM_API_URL = process.env.VLLM_API_URL || "http://localhost:8000/v1";

export async function listModels(): Promise<Model[]> {
	try {
		const response = await fetch(`${VLLM_API_URL}/models`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.statusText}`);
		}

		const data: ModelsResponse = await response.json();
		return data.data;
	} catch (error) {
		console.error("Error fetching models:", error);
		throw error;
	}
}

export async function chatCompletion(
	request: ChatRequest
): Promise<ChatCompletionResponse> {
	try {
		const response = await fetch(`${VLLM_API_URL}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				...request,
				stream: false,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Chat completion failed: ${response.statusText} - ${errorText}`
			);
		}

		return await response.json();
	} catch (error) {
		console.error("Error in chat completion:", error);
		throw error;
	}
}

export async function* chatCompletionStream(
	request: ChatRequest
): AsyncGenerator<string, void, unknown> {
	try {
		const response = await fetch(`${VLLM_API_URL}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				...request,
				stream: true,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Chat completion stream failed: ${response.statusText} - ${errorText}`
			);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error("No response body reader available");
		}

		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					const data = line.slice(6);
					if (data === "[DONE]") {
						return;
					}

					try {
						const chunk = JSON.parse(data);
						const content = chunk.choices?.[0]?.delta?.content;
						if (content) {
							yield content;
						}
					} catch (e) {
						// Skip invalid JSON
						console.warn("Failed to parse chunk:", data);
					}
				}
			}
		}
	} catch (error) {
		console.error("Error in chat completion stream:", error);
		throw error;
	}
}

export async function ocrExtraction(
	model: string,
	images: string[], // Base64 encoded images
	prompt?: string
): Promise<string> {
	try {
		const defaultPrompt = `Extract all data from these images and return it as a structured table in JSON format.
    Each row should be an object with clear field names. If there are multiple tables, return an array of tables.
    Format: { "tables": [{ "headers": [...], "rows": [[...], [...]] }] }`;

		const content: Array<{
			type: "text" | "image_url";
			text?: string;
			image_url?: { url: string };
		}> = [
			{
				type: "text",
				text: prompt || defaultPrompt,
			},
			...images.map((image) => ({
				type: "image_url" as const,
				image_url: {
					url: image,
				},
			})),
		];

		const response = await fetch(`${VLLM_API_URL}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: "user",
						content,
					},
				],
				stream: false,
				temperature: 0.1,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`OCR extraction failed: ${response.statusText} - ${errorText}`
			);
		}

		const data: ChatCompletionResponse = await response.json();
		return data.choices[0]?.message?.content || "";
	} catch (error) {
		console.error("Error in OCR extraction:", error);
		throw error;
	}
}
