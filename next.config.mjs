/** @type {import('next').NextConfig} */
const nextConfig = {
  serverComponentsExternalPackages: ["@prisma/client", ".prisma/client"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@prisma/client", ".prisma/client");
    }
    return config;
  },
};

export default nextConfig;
