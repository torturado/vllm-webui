const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	outputFileTracingRoot: path.join(__dirname),
	experimental: {
		outputFileTracingExcludes: {
			"*": [
				"**/node_modules/@swc/core*/**/*",
				"**/node_modules/@next/swc-*/**/*",
			],
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
			{
				protocol: "http",
				hostname: "**",
			},
		],
	},
};

module.exports = nextConfig;
