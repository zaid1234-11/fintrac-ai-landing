/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/pdf-parse/**/*'],
    },
  },
};

export default nextConfig;
