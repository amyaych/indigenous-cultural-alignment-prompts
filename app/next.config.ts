import type { NextConfig } from 'next';

const config: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    '/api/review': ['../maori-aotearoa/**', '../aboriginal-torres-strait-islander-australia/**', '../first-nations-metis-inuit-canada/**', '../fiji/**', '../samoa/**', '../tonga/**'],
  },
};

export default config;
