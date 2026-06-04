import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/oc_test/nextui-admin-sample",
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
