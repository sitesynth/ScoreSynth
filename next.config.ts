import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // vexflow and tone are dynamically imported inside useEffect only,
  // so no SSR exclusion config is needed.
  // Empty turbopack config silences the Turbopack/webpack warning.
  turbopack: {},
};

export default nextConfig;
