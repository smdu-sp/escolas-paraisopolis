/** @format */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    basePath: '/caminhos-escolares/paraisopolis',
    env: {
        NEXT_PUBLIC_BASE_PATH: '/caminhos-escolares/paraisopolis',
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    allowedDevOrigins: [
        '10.20.4.6',
        '127.0.0.1',
        '192.168.1.10'
    ],
};

export default nextConfig;
