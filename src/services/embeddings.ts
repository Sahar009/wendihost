import axios from 'axios';

// Cohere API v2 - Free tier with 100 API calls/month
const COHERE_API_URL = 'https://api.cohere.com/v2/embed';
const COHERE_API_KEY = process.env.COHERE_API_KEY;

// Fallback: Hugging Face
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

/**
 * Get embedding for text using Cohere (with Hugging Face fallback)
 * @param text - Text to embed
 * @param inputType - 'search_document' for storing, 'search_query' for searching
 * @returns Embedding vector as number array
 */
export async function getEmbedding(text: string, inputType: 'search_document' | 'search_query' = 'search_document'): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty for embedding');
  }
  
  const maxLength = 2000;
  const textToEmbed = text.length > maxLength ? text.substring(0, maxLength) : text.trim();
  
  // Try Cohere first
  if (COHERE_API_KEY) {
    try {
      const response = await axios.post(
        COHERE_API_URL,
        {
          texts: [textToEmbed],
          model: 'embed-english-light-v3.0',
          input_type: inputType,
          embedding_types: ['float'],
          truncate: 'END'
        },
        {
          headers: {
            'Authorization': `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );
      
      // v2 API returns embeddings in embeddings.float array
      if (response?.data?.embeddings?.float?.[0]) {
        return response.data.embeddings.float[0];
      }
    } catch (error: any) {
      console.error('Cohere embedding error, falling back to Hugging Face:', error.message);
    }
  }
  
  // Fallback to Hugging Face
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (HUGGINGFACE_API_KEY) {
    headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
  }
  
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      { inputs: textToEmbed },
      { headers, timeout: 30000 }
    );
    
    let embedding: number[];
    if (Array.isArray(response.data)) {
      embedding = response.data;
    } else if (Array.isArray(response.data?.[0])) {
      embedding = response.data[0];
    } else if (response.data?.embedding) {
      embedding = response.data.embedding;
    } else {
      throw new Error('Invalid embedding response format');
    }
    
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Empty embedding array');
    }
    
    return embedding;
  } catch (error: any) {
    console.error('Hugging Face embedding error:', error);
    throw new Error(`Failed to generate embedding: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity score (0-1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

