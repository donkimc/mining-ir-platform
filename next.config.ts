import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  ADMIN_CONTENT_SECURITY_POLICY,
  PUBLIC_CONTENT_SECURITY_POLICY,
} from './src/lib/content-security-policy'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Match ADR-0014 10 MiB PDF limit (Vercel default server-action body is ~1–4.5 MiB).
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async headers() {
    const commonHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ]
    // First matching source wins. Keep Payload CMS on the broader admin CSP;
    // all other routes (public tenant pages, dashboard, login) use the stricter public CSP.
    return [
      {
        source: '/cms/:path*',
        headers: [
          ...commonHeaders,
          { key: 'Content-Security-Policy', value: ADMIN_CONTENT_SECURITY_POLICY },
        ],
      },
      {
        source: '/:path*',
        headers: [
          ...commonHeaders,
          { key: 'Content-Security-Policy', value: PUBLIC_CONTENT_SECURITY_POLICY },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
