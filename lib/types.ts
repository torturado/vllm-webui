// Message types
export interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: number;
	images?: string[]; // Base64 encoded images
}

// Model types
export interface Model {
	id: string;
	object: string;
	owned_by: string;
}

export interface ModelsResponse {
	object: string;
	data: Model[];
}

// Chat completion types
export interface ChatCompletionChunk {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		delta: {
			role?: string;
			content?: string;
		};
		finish_reason: string | null;
	}>;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface ChatCompletionResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

// Statistics types
export interface ChatStats {
	tokensPerSecond: number;
	latency: number; // ms
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	generationTime: number; // ms
}

// Search types
export interface SearchResult {
	title: string;
	url: string;
	content: string;
	engine: string;
}

export interface SearchResponse {
	results: SearchResult[];
	query: string;
}

// OCR types
export interface OCRImage {
	id: string;
	file: File;
	status: "pending" | "processing" | "completed" | "error";
	extractedData?: any;
	error?: string;
}

export interface OCRBatch {
	images: OCRImage[];
	totalProcessed: number;
	totalErrors: number;
	startTime: number;
}

export interface OCRResult {
	imageId: string;
	data: any; // Extracted table data
	error?: string;
}

// API request types
export interface ChatRequest {
	model: string;
	messages: Array<{
		role: "user" | "assistant" | "system";
		content:
			| string
			| Array<{
					type: "text" | "image_url";
					text?: string;
					image_url?: {
						url: string;
					};
			  }>;
	}>;
	stream?: boolean;
	temperature?: number;
	max_tokens?: number;
}

// Provider configuration types
export type ProviderType = "vllm" | "ollama" | "lmstudio";

export interface ProviderConfig {
	type: ProviderType;
	apiUrl: string;
	name: string;
}

export interface Settings {
	provider: ProviderConfig;
}
