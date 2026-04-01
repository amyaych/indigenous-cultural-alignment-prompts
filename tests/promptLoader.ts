import fs from 'fs';
import path from 'path';

export async function loadPrompt(community: string, type: string): Promise<string> {
  const filePath = path.join(process.cwd(), community, `${type}-review-prompt.md`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load prompt for ${community}/${type}: ${error}`);
  }
}

export async function listAllPrompts(): Promise<{ community: string, type: string }[]> {
  const communities = [
    'maori-nz', 
    'aboriginal-torres-strait-islander', 
    'first-nations-metis-inuit-canada', 
    'fiji', 
    'samoa', 
    'tonga'
  ];
  const types = ['general', 'workplace'];
  const results: { community: string, type: string }[] = [];

  for (const community of communities) {
    for (const type of types) {
      results.push({ community, type });
    }
  }
  return results;
}
