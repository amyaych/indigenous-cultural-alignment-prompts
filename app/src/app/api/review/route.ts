import Anthropic from '@anthropic-ai/sdk';
import { loadSystemPrompt } from '@/lib/prompts';
import type { Region, ReviewType, ReviewResult, Annotation } from '@/lib/types';

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
  const formData = await request.formData();

  const region = formData.get('region') as Region | null;
  const reviewType = formData.get('reviewType') as ReviewType | null;
  const documentText = formData.get('documentText') as string | null;
  const documentFile = formData.get('documentFile') as File | null;
  const orgText = formData.get('orgText') as string | null;
  const orgFile = formData.get('orgFile') as File | null;

  // Intake context fields
  const role = formData.get('role') as string | null;
  const sector = formData.get('sector') as string | null;
  const localGroup = formData.get('localGroup') as string | null;
  const iwiContext = formData.get('iwiContext') as string | null;

  if (!region || !reviewType) {
    return new Response('Missing region or reviewType', { status: 400 });
  }

  const hasDocument = (documentText && documentText.trim()) || documentFile;
  if (!hasDocument) {
    return new Response('No document provided', { status: 400 });
  }

  const systemPrompt = await loadSystemPrompt(region, reviewType);
  const content: Anthropic.ContentBlockParam[] = [];

  // Build intake context block
  const intakeParts: string[] = [];
  if (role?.trim()) intakeParts.push(`Role and Industry: ${role.trim()}`);
  if (sector?.trim()) intakeParts.push(`Sector: ${sector.trim()}`);
  if (localGroup?.trim()) intakeParts.push(`Relevant local/iwi group: ${localGroup.trim()}`);
  if (iwiContext?.trim()) intakeParts.push(`Community documents being referenced: ${iwiContext.trim()}`);

  if (intakeParts.length > 0) {
    content.push({
      type: 'text',
      text: `REVIEWER CONTEXT:\n${intakeParts.join('\n')}`,
    });
  }

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
      model: 'claude-opus-4-6',
      max_tokens: 4096,
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
