/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // experimental: { typedRoutes: true },
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com',
      pathname: '/a/**',
    }]
  }
};

export default config;
