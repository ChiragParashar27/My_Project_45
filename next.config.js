// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add webpack configuration here
  webpack: (config, { isServer }) => {
    // Check if we are building the client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Instruct Webpack to replace the 'net' module with a dummy export (false)
        net: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;