import fs from 'fs/promises';
import path from 'path';
import type { Region, ReviewType } from './types';

const REGION_DIRS: Record<Region, string> = {
  'maori-aotearoa': 'maori-aotearoa',
  'aboriginal-torres-strait-islander-australia': 'aboriginal-torres-strait-islander-australia',
  'first-nations-metis-inuit-canada': 'first-nations-metis-inuit-canada',
  'fiji': 'fiji',
  'samoa': 'samoa',
  'tonga': 'tonga',
};

const FILE_NAMES: Record<ReviewType, string> = {
  general: 'general-review-prompt.md',
  workplace: 'workplace-review-prompt.md',
};

// process.cwd() is the app/ directory at runtime, so we go up one level to reach the repo root
export async function loadSystemPrompt(region: Region, type: ReviewType): Promise<string> {
  const dir = REGION_DIRS[region];
  const file = FILE_NAMES[type];
  const filePath = path.join(process.cwd(), '..', dir, file);
  return fs.readFile(filePath, 'utf-8');
}
