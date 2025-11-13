import { ProviderConfig } from "@/lib/types";
import { listModels } from "@/lib/vllm-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Try to get provider from query params (for GET requests)
		const searchParams = request.nextUrl.searchParams;
		const providerParam = searchParams.get("provider");

		let provider: ProviderConfig | undefined;
		if (providerParam) {
			try {
				provider = JSON.parse(providerParam);
			} catch (e) {
				// Invalid JSON, use default
			}
		}

		const models = await listModels(provider);
		return NextResponse.json({ models });
	} catch (error) {
		console.error("Error fetching models:", error);
		return NextResponse.json(
			{ error: "Failed to fetch models" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const provider: ProviderConfig | undefined = body.provider;

		const models = await listModels(provider);
		return NextResponse.json({ models });
	} catch (error) {
		console.error("Error fetching models:", error);
		return NextResponse.json(
			{ error: "Failed to fetch models" },
			{ status: 500 }
		);
	}
}
