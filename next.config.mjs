/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: Magic + UA SDKs are browser-side; transpile if a "module not found"
  // shows up at build, otherwise leave empty.
  transpilePackages: ["@particle-network/universal-account-sdk", "magic-sdk"],
};

export default nextConfig;
