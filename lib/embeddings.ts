import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    openaiClient = new OpenAI({ apiKey });
    return openaiClient;
  }
  return null;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  if (client) {
    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
      });
      return response.data[0].embedding;
    } catch (err: any) {
      if (err?.status === 429 || err?.status === 401) {
        // OpenAI quota/auth unavailable - fallback generator engaged silently
      } else {
        console.warn('OpenAI Embedding API unavailable, using fallback generator:', err?.message || err);
      }
    }
  }

  // Fallback simple deterministic embedding generator for zero-config local dev
  return generateSimpleFallbackVector(text, 1536);
}

function generateSimpleFallbackVector(text: string, dimensions: number): number[] {
  const vec = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const index = (charCode * 31 + i) % dimensions;
    vec[index] += 1;
  }
  // Normalize vector
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map((v) => v / norm);
}
