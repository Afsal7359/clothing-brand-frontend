/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build write to a separate dir (NEXT_DIST_DIR) so it
  // doesn't clobber the running dev server's .next. Falls back to default.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
