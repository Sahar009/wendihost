import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { workspaceId } = req.query;
  const { assistantId, text } = req.body;

  console.log('📚 KNOWLEDGE UPLOAD: Starting process...', {
    workspaceId,
    assistantId,
    textLength: text?.length || 0
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
  } catch (error) {
    console.error('❌ KNOWLEDGE UPLOAD: Failed to process knowledge:', error);
    res.status(500).json({ 
      error: 'Failed to process knowledge',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}