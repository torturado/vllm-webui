import { SearchResult } from "./types";

const SEARX_API_URL =
	process.env.SEARX_API_URL || "https://searx.derrumbar.top";

export async function searchWeb(
	query: string,
	maxResults: number = 10
): Promise<SearchResult[]> {
	try {
		const url = new URL(`${SEARX_API_URL}/search`);
		url.searchParams.set("q", query);
		url.searchParams.set("format", "json");
		url.searchParams.set("engines", "google,bing,duckduckgo");

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Search failed: ${response.statusText}`);
		}

		const data = await response.json();

		// Parse SearXNG response format
		const results: SearchResult[] = (data.results || [])
			.slice(0, maxResults)
			.map((result: any) => ({
				title: result.title || "",
				url: result.url || "",
				content: result.content || "",
				engine: result.engine || "unknown",
			}));

		return results;
	} catch (error) {
		console.error("Error in web search:", error);
		throw error;
	}
}

export function formatSearchResults(results: SearchResult[]): string {
	if (results.length === 0) {
		return "No search results found.";
	}

	let formatted = `Found ${results.length} results:\n\n`;

	results.forEach((result, index) => {
		formatted += `${index + 1}. [${result.title}](${result.url})\n`;
		formatted += `   ${result.content.substring(0, 150)}...\n`;
		formatted += `   Source: ${result.engine}\n\n`;
	});

	return formatted;
}
