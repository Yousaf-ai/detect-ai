import path from "node:path";
import type { NextConfig } from "next";

const empty = path.join(__dirname, "lib/empty.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
    "sharp",
  ],
  turbopack: {
    resolveAlias: {
      "onnxruntime-node": "./lib/empty.ts",
      sharp: "./lib/empty.ts",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": empty,
      sharp: empty,
    };
    return config;
  },
};

export default nextConfig;
