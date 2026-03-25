/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EmbeddingResponse {
  object: 'list';
  data: {
    object: 'embedding';
    index: number;
    embedding: number[];
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export const EMBEDDING_MODELS = [
  { id: 'openai/text-embedding-3-small', name: 'Text Embedding 3 Small (OpenAI)', dimensions: 1536 },
  { id: 'openai/text-embedding-3-large', name: 'Text Embedding 3 Large (OpenAI)', dimensions: 3072 },
  { id: 'google/text-embedding-004', name: 'Text Embedding 004 (Google)', dimensions: 768 },
  { id: 'nvidia/llama-nemotron-embed-vl-1b-v2', name: 'Llama Nemotron Embed VL (NVIDIA)', dimensions: 1024, multimodal: true },
  { id: 'qwen/qwen3-embedding-0.6b', name: 'Qwen 3 Embedding 0.6B', dimensions: 1024 },
];

export const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/**
 * Generate embeddings for a single text or an array of texts.
 */
export async function generateEmbeddings(
  input: string | string[] | any[],
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingResponse> {
  const response = await fetch('/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to generate embeddings: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Perform semantic search across a list of documents.
 */
export async function semanticSearch(
  query: string,
  documents: string[],
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<{ document: string; similarity: number }[]> {
  // Generate embeddings for the query and all documents in one batch
  const response = await generateEmbeddings([query, ...documents], model);
  
  const queryEmbedding = response.data[0].embedding;
  const docEmbeddings = response.data.slice(1);
  
  const results = documents.map((doc, i) => ({
    document: doc,
    similarity: cosineSimilarity(queryEmbedding, docEmbeddings[i].embedding),
  }));
  
  // Sort by similarity descending
  return results.sort((a, b) => b.similarity - a.similarity);
}
