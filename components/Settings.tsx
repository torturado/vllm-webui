"use client";

import { useSettings } from "@/hooks/useSettings";
import { ProviderConfig, ProviderType } from "@/lib/types";
import { useEffect, useState } from "react";

interface SettingsProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
	const {
		settings,
		isLoaded,
		updateProviderType,
		updateProviderUrl,
		resetToDefaults,
		defaultProviders,
	} = useSettings();

	const [localProviderType, setLocalProviderType] =
		useState<ProviderType>("vllm");
	const [localApiUrl, setLocalApiUrl] = useState<string>("");
	const [isTesting, setIsTesting] = useState(false);
	const [testResult, setTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

	useEffect(() => {
		if (isOpen && isLoaded) {
			setLocalProviderType(settings.provider.type);
			setLocalApiUrl(settings.provider.apiUrl);
			setTestResult(null);
		}
	}, [isOpen, isLoaded, settings]);

	const handleProviderTypeChange = (type: ProviderType) => {
		setLocalProviderType(type);
		setLocalApiUrl(defaultProviders[type].apiUrl);
		setTestResult(null);
	};

	const handleSave = () => {
		updateProviderType(localProviderType);
		updateProviderUrl(localApiUrl);
		setTestResult(null);
		onClose();
	};

	const handleTest = async () => {
		setIsTesting(true);
		setTestResult(null);

		try {
			const testProvider: ProviderConfig = {
				type: localProviderType,
				apiUrl: localApiUrl,
				name: defaultProviders[localProviderType].name,
			};

			// Test connection by fetching models
			const response = await fetch("/api/vllm/models", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ provider: testProvider }),
			});

			if (response.ok) {
				const data = await response.json();
				setTestResult({
					success: true,
					message: `Connection successful. ${data.models?.length || 0} model(s) found.`,
				});
			} else {
				const error = await response.json();
				setTestResult({
					success: false,
					message: `Error: ${error.error || response.statusText}`,
				});
			}
		} catch (error: any) {
			setTestResult({
				success: false,
				message: `Connection error: ${error.message}`,
			});
		} finally {
			setIsTesting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-terminal-dark/80 z-50 flex items-center justify-center p-4">
			<div className="terminal-border bg-terminal-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="terminal-border-b border-terminal-green p-4 flex items-center justify-between">
					<h2 className="text-terminal-green font-bold text-lg font-mono">
						SETTINGS - PROVIDER CONFIGURATION
					</h2>
					<button
						onClick={onClose}
						className="terminal-border px-3 py-1 text-sm font-mono hover:bg-terminal-green hover:text-terminal-dark transition-colors"
					>
						× CLOSE
					</button>
				</div>

				{/* Content */}
				<div className="p-4 space-y-4">
					{!isLoaded ? (
						<div className="text-terminal-green/50 font-mono text-sm text-center py-8">
							Loading configuration...
						</div>
					) : (
						<>
							{/* Provider Type Selection */}
							<div>
								<label className="text-terminal-green font-mono text-sm block mb-2">
									PROVIDER TYPE:
								</label>
								<div className="space-y-2">
									{(
										Object.keys(defaultProviders) as ProviderType[]
									).map((type) => (
										<label
											key={type}
											className="flex items-center gap-2 cursor-pointer terminal-border p-3 hover:bg-terminal-gray transition-colors"
										>
											<input
												type="radio"
												name="providerType"
												value={type}
												checked={localProviderType === type}
												onChange={() =>
													handleProviderTypeChange(type)
												}
												className="cursor-pointer"
											/>
											<div className="flex-1">
												<div className="text-terminal-green font-mono text-sm font-bold">
													{defaultProviders[type].name}
												</div>
												<div className="text-terminal-green/50 font-mono text-xs">
													{defaultProviders[type].apiUrl}
												</div>
											</div>
										</label>
									))}
								</div>
							</div>

							{/* API URL */}
							<div>
								<label className="text-terminal-green font-mono text-sm block mb-2">
									API URL:
								</label>
								<input
									type="text"
									value={localApiUrl}
									onChange={(e) =>
										setLocalApiUrl(e.target.value)
									}
									placeholder="http://localhost:8000/v1"
									className="w-full bg-terminal-dark text-terminal-green terminal-border px-3 py-2 font-mono text-sm outline-hidden focus:border-terminal-amber"
								/>
								<div className="text-terminal-green/50 font-mono text-xs mt-1">
									API URL base for the provider (must include /v1 for Ollama and LM Studio)
								</div>
							</div>

							{/* Test Connection */}
							<div>
								<button
									onClick={handleTest}
									disabled={isTesting || !localApiUrl.trim()}
									className="terminal-border px-4 py-2 font-mono text-sm disabled:opacity-50 hover:bg-terminal-green hover:text-terminal-dark transition-colors"
								>
									{isTesting ? "TESTING..." : "TEST CONNECTION"}
								</button>

								{testResult && (
									<div
										className={`mt-2 terminal-border p-2 font-mono text-xs ${
											testResult.success
												? "border-terminal-green text-terminal-green"
												: "border-terminal-amber text-terminal-amber"
										}`}
									>
										{testResult.success ? "✓ " : "✗ "}
										{testResult.message}
									</div>
								)}
							</div>

							{/* Info Box */}
							<div className="terminal-border border-terminal-green/50 p-3 bg-terminal-gray/20">
								<div className="text-terminal-green font-mono text-xs space-y-1">
									<div className="font-bold mb-2">
										INFORMATION:
									</div>
									<div>
										• <strong>vLLM:</strong> Standard vLLM server
									</div>
									<div>
										• <strong>Ollama:</strong> Default at
										http://localhost:11434/v1
									</div>
									<div>
										• <strong>LM Studio:</strong> Default at
										http://localhost:1234/v1 (activate "Local Server" in LM Studio)
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-2 pt-2">
								<button
									onClick={handleSave}
									className="flex-1 terminal-border px-4 py-2 font-mono text-sm bg-terminal-green text-terminal-dark hover:bg-terminal-green/80 transition-colors"
								>
									SAVE
								</button>
								<button
									onClick={resetToDefaults}
									className="terminal-border px-4 py-2 font-mono text-sm hover:bg-terminal-gray transition-colors"
								>
									RESET
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
