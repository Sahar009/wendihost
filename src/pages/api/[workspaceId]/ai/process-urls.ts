import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import axios from 'axios';

export default withIronSessionApiRoute(
  async function processUrls(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== 'POST') {
      return new ServerError(res, 405, "Method not allowed");
    }

    try {
      const { workspaceId } = req.query;
      const { urls } = req.body;

      const validatedInfo = await validateUserApi(req, Number(workspaceId));
      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized");

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return new ServerError(res, 400, "URLs array is required");
      }

      const extractedContent: string[] = [];

      for (const url of urls) {
        try {
          // Skip URLs that are likely to be problematic
          if (url.includes('/dashboard/') || url.includes('/admin/') || url.includes('/login')) {
            extractedContent.push(`Skipped ${url}: Dashboard/admin pages cannot be accessed without authentication`);
            continue;
          }

          // Fetch the webpage content with better error handling
          const response = await axios.get(url, {
            timeout: 15000, // Increased timeout
            maxRedirects: 5,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            }
          });

          if (response.status === 200) {
            const html = response.data;
            
            // Basic content extraction - remove HTML tags and extract text
            let text = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
              .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')       // Remove navigation
              .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove headers
              .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footers
              .replace(/<[^>]+>/g, ' ')                          // Remove remaining HTML tags
              .replace(/\s+/g, ' ')                              // Normalize whitespace
              .replace(/&nbsp;/g, ' ')                           // Replace HTML entities
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&copy;/g, '©')
              .replace(/&trade;/g, '™')
              .trim();

            // Limit content length to avoid overwhelming the AI
            if (text.length > 5000) {
              text = text.substring(0, 5000) + '... [Content truncated]';
            }

            if (text.length < 50) {
              extractedContent.push(`Warning: ${url} returned very little content (${text.length} characters). This might be a login page or empty page.`);
            } else {
              extractedContent.push(`Content from ${url}:\n${text}`);
            }
          }
        } catch (error: any) {
          console.error(`Error processing URL ${url}:`, error);
          
          let errorMessage = 'Unknown error';
          if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out - the page took too long to load';
          } else if (error.response?.status === 403) {
            errorMessage = 'Access forbidden - this page requires authentication';
          } else if (error.response?.status === 404) {
            errorMessage = 'Page not found';
          } else if (error.response?.status === 500) {
            errorMessage = 'Server error on the target website';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          extractedContent.push(`Failed to extract content from ${url}: ${errorMessage}`);
        }
      }

      const combinedContent = extractedContent.join('\n\n');

      return res.send({
        status: 'success',
        statusCode: 200,
        message: `Successfully processed ${urls.length} URL(s)`,
        data: {
          content: combinedContent,
          processedUrls: urls.length,
          extractedContent
        }
      });

    } catch (e) {
      console.error('Error processing URLs:', e);
      return new ServerError(res, 500, "Server Error");
    }
  },
  sessionCookie(),
);
