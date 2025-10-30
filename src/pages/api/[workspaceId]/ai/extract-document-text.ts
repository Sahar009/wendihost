import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to extract text from different file types
async function extractTextFromDocument(url: string, fileType: string): Promise<string> {
  console.log(`📄 EXTRACTING TEXT: Processing ${fileType} from ${url}`);
  
  try {
    // For now, we'll use a simple approach for different file types
    // In production, you might want to use specialized libraries like:
    // - pdf-parse for PDFs
    // - mammoth for DOCX files
    // - textract for various formats
    
    if (fileType.includes('pdf')) {
      // For PDF files, we'll use a simple text extraction approach
      // Note: This is a basic implementation. For production, consider using pdf-parse
      console.log('📄 EXTRACTING TEXT: PDF detected - using basic extraction');
      
      // For now, return a placeholder. In production, you'd use pdf-parse:
      // const pdfBuffer = await axios.get(url, { responseType: 'arraybuffer' });
      // const pdfData = await pdf(pdfBuffer.data);
      // return pdfData.text;
      
      return `[PDF Content from ${url} - Text extraction not yet implemented. Please use text input or URL extraction instead.]`;
    }
    
    if (fileType.includes('docx') || fileType.includes('doc')) {
      // For DOCX files, we'll use a simple text extraction approach
      console.log('📄 EXTRACTING TEXT: DOCX detected - using basic extraction');
      
      // For now, return a placeholder. In production, you'd use mammoth:
      // const docxBuffer = await axios.get(url, { responseType: 'arraybuffer' });
      // const result = await mammoth.extractRawText({ buffer: docxBuffer.data });
      // return result.value;
      
      return `[DOCX Content from ${url} - Text extraction not yet implemented. Please use text input or URL extraction instead.]`;
    }
    
    if (fileType.includes('text') || fileType.includes('plain')) {
      // For plain text files, fetch the content directly
      console.log('📄 EXTRACTING TEXT: Plain text detected - fetching content');
      const response = await axios.get(url);
      return response.data;
    }
    
    if (fileType.includes('csv')) {
      // For CSV files, fetch and return as text
      console.log('📄 EXTRACTING TEXT: CSV detected - fetching content');
      const response = await axios.get(url);
      return response.data;
    }
    
    // For other file types, return a message
    console.log(`📄 EXTRACTING TEXT: Unsupported file type ${fileType}`);
    return `[Unsupported file type: ${fileType}. Please use PDF, DOCX, TXT, or CSV files, or use text input instead.]`;
    
  } catch (error) {
    console.error('📄 EXTRACTING TEXT: Error extracting text:', error);
    throw new Error(`Failed to extract text from document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default withIronSessionApiRoute(
  async function extractDocumentText(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, "Method not allowed");
    }

    try {
      const { workspaceId } = req.query;
      const { documentUrl, fileType } = req.body;

      console.log('📄 DOCUMENT EXTRACTION: Starting text extraction...', {
        workspaceId,
        documentUrl,
        fileType
      });

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized");

      if (!documentUrl || !fileType) {
        return new ServerError(res, 400, "Document URL and file type are required");
      }

      const extractedText = await extractTextFromDocument(documentUrl, fileType);
      
      console.log(`📄 DOCUMENT EXTRACTION: Successfully extracted ${extractedText.length} characters`);

      return res.send({
        status: 'success',
        statusCode: 200,
        message: "Text extracted successfully",
        data: {
          extractedText,
          textLength: extractedText.length,
          fileType
        }
      });

    } catch (error) {
      console.error('📄 DOCUMENT EXTRACTION: Error:', error);
      return new ServerError(res, 500, "Failed to extract text from document");
    }
  },
  sessionCookie(),
);

