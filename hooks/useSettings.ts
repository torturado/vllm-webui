"use client";

import { ProviderConfig, ProviderType, Settings } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

const SETTINGS_STORAGE_KEY = "vllm-webui-settings";

const DEFAULT_PROVIDERS: Record<ProviderType, ProviderConfig> = {
	vllm: {
		type: "vllm",
		apiUrl: "http://localhost:8000/v1",
		name: "vLLM",
	},
	ollama: {
		type: "ollama",
		apiUrl: "http://localhost:11434/v1",
		name: "Ollama",
	},
	lmstudio: {
		type: "lmstudio",
		apiUrl: "http://localhost:1234/v1",
		name: "LM Studio",
	},
};

const DEFAULT_SETTINGS: Settings = {
	provider: DEFAULT_PROVIDERS.vllm,
};

export function useSettings() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load settings from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				setSettings(parsed);
			}
		} catch (error) {
			console.error("Failed to load settings:", error);
		} finally {
			setIsLoaded(true);
		}
	}, []);

	// Save settings to localStorage whenever they change
	useEffect(() => {
		if (isLoaded) {
			try {
				localStorage.setItem(
					SETTINGS_STORAGE_KEY,
					JSON.stringify(settings)
				);
			} catch (error) {
				console.error("Failed to save settings:", error);
			}
		}
	}, [settings, isLoaded]);

	const updateProvider = useCallback((provider: ProviderConfig) => {
		setSettings((prev) => ({ ...prev, provider }));
	}, []);

	const updateProviderType = useCallback((type: ProviderType) => {
		setSettings((prev) => ({
			...prev,
			provider: DEFAULT_PROVIDERS[type],
		}));
	}, []);

	const updateProviderUrl = useCallback((apiUrl: string) => {
		setSettings((prev) => ({
			...prev,
			provider: { ...prev.provider, apiUrl },
		}));
	}, []);

	const resetToDefaults = useCallback(() => {
		setSettings(DEFAULT_SETTINGS);
	}, []);

	return {
		settings,
		isLoaded,
		updateProvider,
		updateProviderType,
		updateProviderUrl,
		resetToDefaults,
		defaultProviders: DEFAULT_PROVIDERS,
	};
}
