import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import axios from 'axios';

// Cohere API v2 - Free tier with 100 API calls/month, no credit card required
// Get free API key at: https://dashboard.cohere.com/api-keys
// API docs: https://docs.cohere.com/reference/embed
const COHERE_API_URL = 'https://api.cohere.com/v2/embed';
const COHERE_API_KEY = process.env.COHERE_API_KEY; // Free tier available

// Fallback: Hugging Face (if Cohere fails)
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY; // Optional

// Helper: Split text into ~500-1000 character chunks
function chunkText(text: string, chunkSize = 800): string[] {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return chunks;
}

async function getEmbedding(text: string, retries = 3): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  // Truncate if needed (Cohere limit is 512 tokens, roughly 2000 chars)
  const maxLength = 2000;
  const textToEmbed = text.length > maxLength ? text.substring(0, maxLength) : text.trim();
  if (text.length > maxLength) {
    console.warn(`⚠️ Text truncated from ${text.length} to ${maxLength} characters`);
  }

  // Try Cohere first (more reliable free tier)
  if (COHERE_API_KEY) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔗 Attempting Cohere embedding (attempt ${attempt}/${retries})...`, {
          textLength: textToEmbed.length,
          service: 'Cohere'
        });
        
        const response = await axios.post(
          COHERE_API_URL,
          {
            texts: [textToEmbed],
            model: 'embed-english-light-v3.0', // Free tier model
            input_type: 'search_document', // For storing in vector DB
            embedding_types: ['float'],
            truncate: 'END'
          },
          {
            headers: {
              'Authorization': `Bearer ${COHERE_API_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 30000
          }
        );
        
        // v2 API returns embeddings in embeddings.float array
        if (!response?.data?.embeddings?.float || !Array.isArray(response.data.embeddings.float[0])) {
          throw new Error('Invalid embedding response from Cohere API');
        }
        
        const embedding = response.data.embeddings.float[0];
        console.log(`✅ Successfully generated Cohere embedding (${embedding.length} dimensions)`);
        return embedding;
      } catch (error: any) {
        console.error(`❌ Cohere embedding attempt ${attempt} failed:`, error.response?.status, error.message);
        if (attempt === retries) {
          console.log('⚠️ Cohere failed, falling back to Hugging Face...');
          break; // Fall through to Hugging Face
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  // Fallback to Hugging Face (no API key required)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (HUGGINGFACE_API_KEY) {
    headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔗 Attempting Hugging Face embedding (attempt ${attempt}/${retries})...`, {
        textLength: textToEmbed.length,
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        hasApiKey: !!HUGGINGFACE_API_KEY
      });
      
      const response = await axios.post(
        HUGGINGFACE_API_URL,
        { inputs: textToEmbed },
        { 
          headers,
          timeout: 30000
        }
      );
      
      // Handle different response formats
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
        throw new Error('Empty or invalid embedding array');
      }
      
      console.log(`✅ Successfully generated Hugging Face embedding (${embedding.length} dimensions)`);
      return embedding;
    } catch (error: any) {
      const errorInfo = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      };
      
      console.error(`❌ Embedding attempt ${attempt} failed:`, errorInfo);
      
      // If it's a model loading error, wait longer and retry
      if (error.response?.status === 503 || error.message?.includes('loading')) {
        const waitTime = 5000 * attempt; // Wait 5s, 10s, 15s for model loading
        console.log(`⏳ Model is loading, waiting ${waitTime}ms before retry...`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // If endpoint is gone (410), don't retry
      if (error.response?.status === 410) {
        throw new Error('Hugging Face API endpoint is no longer available. The API may have changed. Please check the Hugging Face API documentation.');
      }
      
      // If it's the last attempt, throw the error with more details
      if (attempt === retries) {
        const detailedError = new Error(
          `Failed to generate embedding after ${retries} attempts. ` +
          `Error: ${error.message || 'Unknown error'}. ` +
          `Status: ${error.response?.status || 'N/A'}. ` +
          `Please check your network connection.`
        );
        (detailedError as any).originalError = error;
        throw detailedError;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  
  throw new Error('Failed to generate embedding');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { workspaceId } = req.query;
  const { assistantId, text } = req.body;
  
  console.log('📚 KNOWLEDGE UPLOAD: Starting process...', {
    workspaceId,
    assistantId,
    textLength: text?.length || 0,
    embeddingService: 'Hugging Face (Free)',
    hasApiKey: !!HUGGINGFACE_API_KEY
  });

  if (!workspaceId || !assistantId || !text) {
    console.log('❌ KNOWLEDGE UPLOAD: Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('📝 KNOWLEDGE UPLOAD: Splitting text into chunks...');
    const chunks = chunkText(text);
    console.log(`📝 KNOWLEDGE UPLOAD: Created ${chunks.length} chunks`);
    
    const createdChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔗 KNOWLEDGE UPLOAD: Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      try {
        const embedding = await getEmbedding(chunk);
        console.log(`✅ KNOWLEDGE UPLOAD: Generated embedding for chunk ${i + 1} (${embedding.length} dimensions)`);
        
        const created = await prisma.assistantKnowledgeChunk.create({
          data: {
            assistantId: Number(assistantId),
            content: chunk,
            embedding,
          },
        });
        createdChunks.push(created);
        console.log(`💾 KNOWLEDGE UPLOAD: Saved chunk ${i + 1} to database`);
      } catch (chunkError) {
        console.error(`❌ KNOWLEDGE UPLOAD: Error processing chunk ${i + 1}:`, chunkError);
        throw chunkError;
      }
    }

    console.log(`✅ KNOWLEDGE UPLOAD: Successfully processed ${createdChunks.length} chunks`);
    res.status(200).json({ 
      message: 'Knowledge uploaded and embedded', 
      chunks: createdChunks.length,
      success: true 
    });
  } catch (error: any) {
    const originalError = error.originalError || error;
    
    console.error('❌ KNOWLEDGE UPLOAD: Failed to process knowledge:', {
      error: error.message || error,
      originalError: originalError.message,
      stack: error.stack?.substring(0, 1000),
      status: originalError.response?.status,
      statusText: originalError.response?.statusText,
    });
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to process knowledge';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types
    if (originalError.response?.status === 410) {
      errorMessage = 'API endpoint unavailable';
      errorDetails = 'The embedding API endpoint is no longer available. Please get a free Cohere API key at https://dashboard.cohere.com/api-keys (100 free calls/month) and add COHERE_API_KEY to your .env file.';
    } else if (originalError.response?.status === 503 || originalError.message?.includes('loading')) {
      errorMessage = 'Model is loading';
      errorDetails = 'The Hugging Face model is currently loading. This usually takes 10-30 seconds. Please wait a moment and try again.';
    } else if (originalError.response?.status === 429 || originalError.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded';
      errorDetails = 'You have exceeded the Hugging Face API rate limit. The free tier has rate limits. You can set HUGGINGFACE_API_KEY in your .env file for higher limits, or wait a moment and try again.';
    } else if (originalError.response?.status === 401) {
      errorMessage = 'Authentication error';
      errorDetails = 'Invalid Hugging Face API key. Please check your HUGGINGFACE_API_KEY environment variable or remove it to use the free tier.';
    } else if (error.message?.includes('fetch failed') || originalError.code === 'ENOTFOUND' || originalError.code === 'ECONNREFUSED' || originalError.code === 'EAI_AGAIN') {
      errorMessage = 'Network connection error';
      errorDetails = 'Unable to connect to Hugging Face service. Please check your internet connection and try again.';
    } else if (originalError.response?.status === 500) {
      errorMessage = 'Hugging Face service error';
      errorDetails = 'Hugging Face service is temporarily unavailable. Please try again in a few moments.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      originalError: process.env.NODE_ENV === 'development' ? originalError.message : undefined
    });
  }
}
