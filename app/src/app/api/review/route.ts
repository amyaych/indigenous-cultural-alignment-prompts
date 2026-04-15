import Anthropic from '@anthropic-ai/sdk';
import { headers } from 'next/headers';
import { loadSystemPrompt } from '@/lib/prompts';
import type { Region, ReviewType, ReviewResult, Annotation } from '@/lib/types';

const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 8192;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// Simple in-memory rate limiter: 5 requests per IP per minute
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
]);

function isAllowedFile(file: File): boolean {
  const byMime = ALLOWED_MIME_TYPES.has(file.type);
  const byExt = /\.(pdf|txt|md)$/i.test(file.name);
  return byMime || byExt;
}

const REVIEW_TOOL: Anthropic.Tool = {
  name: 'submit_review',
  description: 'Submit the completed structured cultural alignment review.',
  input_schema: {
    type: 'object',
    properties: {
      overallScore: {
        type: 'number',
        description: 'Overall alignment score from 0 to 5 (can be decimal, e.g. 3.5)',
      },
      summary: {
        type: 'string',
        description: '2–3 sentence overall assessment of the document\'s cultural alignment.',
      },
      annotations: {
        type: 'array',
        description: 'All annotations. Include both passage-specific (with quote) and general annotations.',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['positive', 'observation', 'provocation', 'action'],
              description: 'positive = strength; observation = neutral finding; provocation = challenging question; action = area needing change.',
            },
            quote: {
              type: 'string',
              description: 'Verbatim text copied exactly from the document this annotation refers to. Use empty string "" for general annotations not tied to a specific passage.',
            },
            comment: {
              type: 'string',
              description: 'The annotation comment, observation, or provocation question.',
            },
            reference: {
              type: 'string',
              description: 'Optional: cite specific legislation, framework, or official document (e.g. "Te Ture Whenua Māori Act 1993" or "UNDRIP Article 19").',
            },
          },
          required: ['type', 'quote', 'comment'],
        },
      },
    },
    required: ['overallScore', 'summary', 'annotations'],
  },
};

export async function POST(request: Request): Promise<Response> {
  // Rate limiting
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response('Too many requests. Please wait a minute and try again.', { status: 429 });
  }

  const formData = await request.formData();

  const region = formData.get('region') as Region | null;
  const reviewType = formData.get('reviewType') as ReviewType | null;
  const documentText = formData.get('documentText') as string | null;
  const documentFile = formData.get('documentFile') as File | null;
  const orgText = formData.get('orgText') as string | null;
  const orgFile = formData.get('orgFile') as File | null;

  if (!region || !reviewType) {
    return new Response('Missing region or reviewType', { status: 400 });
  }

  const hasDocument = (documentText && documentText.trim()) || documentFile;
  if (!hasDocument) {
    return new Response('No document provided', { status: 400 });
  }

  // Server-side file validation
  if (documentFile) {
    if (!isAllowedFile(documentFile)) {
      return new Response('Invalid file type. Please upload a PDF, .txt, or .md file.', { status: 400 });
    }
    if (documentFile.size > MAX_FILE_BYTES) {
      return new Response('Document file exceeds the 5 MB limit.', { status: 400 });
    }
  }
  if (orgFile) {
    if (!isAllowedFile(orgFile)) {
      return new Response('Invalid file type for workplace document. Please upload a PDF, .txt, or .md file.', { status: 400 });
    }
    if (orgFile.size > MAX_FILE_BYTES) {
      return new Response('Workplace document file exceeds the 5 MB limit.', { status: 400 });
    }
  }

  const systemPrompt = await loadSystemPrompt(region, reviewType);
  const content: Anthropic.ContentBlockParam[] = [];

  // Primary document
  const isPdf = documentFile?.type === 'application/pdf' || documentFile?.name?.endsWith('.pdf');

  if (documentFile) {
    const bytes = await documentFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    if (isPdf) {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      } as unknown as Anthropic.ContentBlockParam);
    } else {
      const text = new TextDecoder().decode(bytes);
      content.push({ type: 'text', text: `DOCUMENT TO REVIEW:\n${text}` });
    }
  } else if (documentText?.trim()) {
    content.push({ type: 'text', text: `DOCUMENT TO REVIEW:\n${documentText.trim()}` });
  }

  // Org documents (workplace only)
  const orgIsPdf = orgFile?.type === 'application/pdf' || orgFile?.name?.endsWith('.pdf');
  if (orgFile) {
    const bytes = await orgFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    content.push({ type: 'text', text: 'INTERNAL ORGANISATIONAL DOCUMENTS (also review the document against these):' });
    if (orgIsPdf) {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      } as unknown as Anthropic.ContentBlockParam);
    } else {
      const text = new TextDecoder().decode(bytes);
      content.push({ type: 'text', text });
    }
  } else if (orgText?.trim()) {
    content.push({
      type: 'text',
      text: `INTERNAL ORGANISATIONAL DOCUMENTS (also review the document against these):\n${orgText.trim()}`,
    });
  }

  content.push({
    type: 'text',
    text: 'Use the submit_review tool to provide your structured review. Proceed directly. Do not ask intake questions. If key context is missing, note it in the summary. For passage-specific annotations, copy the exact verbatim text from the document into the quote field.',
  });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const hasPdf = isPdf || orgIsPdf;
  const requestOptions = hasPdf
    ? { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } }
    : undefined;

  const response = await client.messages.create(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
      tools: [REVIEW_TOOL],
      tool_choice: { type: 'tool', name: 'submit_review' },
    },
    requestOptions,
  );

  const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    return new Response('No structured review returned from model', { status: 500 });
  }

  const raw = toolUseBlock.input as {
    overallScore: number;
    summary: string;
    annotations: Omit<Annotation, 'id'>[];
  };

  const result: ReviewResult = {
    overallScore: raw.overallScore,
    summary: raw.summary,
    region,
    reviewType,
    annotations: raw.annotations.map((a, i) => ({ ...a, id: `ann-${i}` })),
  };

  return Response.json(result);
}
