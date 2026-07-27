import type { NextConfig } from "next";

// Next.js caps Server Action request bodies at 1MB by default, independent
// of our own MAX_UPLOAD_SIZE_MB check in src/features/upload/actions.ts —
// that check never runs for anything over 1MB because Next rejects the
// request first. Match the two so MAX_UPLOAD_SIZE_MB is the real limit.
// +1MB of headroom for multipart/form-data boundary/header overhead
// (see https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit).
const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 50);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: `${maxUploadSizeMb + 1}mb`,
    },
  },
};

export default nextConfig;
