/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  async redirects() {
    return [
      { source: "/", destination: "/web", permanent: false },
    ];
  },
};

module.exports = nextConfig;
