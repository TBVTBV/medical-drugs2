import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Redirect all @prisma/client and .prisma/client imports to the
      // self-contained generated client so Next.js's require hook never
      // tries to resolve the .prisma/client/default chain.
      const generated = path.resolve(__dirname, "src/generated/prisma");
      config.resolve.alias["@prisma/client"] = generated;
      config.resolve.alias[".prisma/client"] = generated;
    }
    return config;
  },
};

export default nextConfig;
