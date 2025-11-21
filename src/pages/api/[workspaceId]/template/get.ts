
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse, TEMPLATE_STATUS } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { getTemplate } from '@/services/waba/msg-templates';



export default withIronSessionApiRoute(
  async function getSnippet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId, status } = req.query

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo 

      // Always fetch templates from Facebook/Meta first to get the latest
      let facebookTemplates: any[] = [];
      
      console.log('Workspace configuration check:', {
        hasAccessToken: !!workspace.accessToken,
        hasWhatsAppId: !!workspace.whatsappId,
        whatsappId: workspace.whatsappId,
        accessTokenLength: workspace.accessToken?.length || 0
      });
      
      if (workspace.accessToken && workspace.whatsappId) {
        try {
          console.log('Fetching templates from Facebook/Meta...');
          console.log('Workspace details:', {
            workspaceId: workspace.id,
            whatsappId: workspace.whatsappId,
            hasAccessToken: !!workspace.accessToken
          });
          
          const { facebookAuth } = await import('@/services/facebook');
          const { FACEBOOK_BASE_ENDPOINT } = await import('@/libs/constants');
          
          const client = facebookAuth(workspace.accessToken);
          
          // Fetch all templates (custom + library) with pagination
          // Don't filter by status to get all templates including library ones
          let allTemplates: any[] = [];
          let pageCount = 0;
          let apiUrl = `${FACEBOOK_BASE_ENDPOINT}${workspace.whatsappId}/message_templates?fields=id,name,status,category,language,components,quality_score&limit=100`;
          
          // Only add status filter if explicitly requested, otherwise get ALL templates
          if (status) {
            apiUrl += `&status=${status}`;
          }
          
          console.log('Fetching all templates from Facebook/Meta (including library templates)...');
          console.log('API URL:', apiUrl);
          
          // Fetch templates - try first page
          try {
            console.log('Making API request to:', apiUrl);
            const response = await client.get(apiUrl);
            
            console.log('API Response:', {
              hasData: !!response.data,
              dataLength: response.data?.data?.length,
              hasPaging: !!response.data?.paging
            });
            
            const templates = response.data?.data || [];
            allTemplates = [...allTemplates, ...templates];
            pageCount = 1;
            
            console.log(`First page: Fetched ${templates.length} templates`);
            
            // Log first template structure for debugging
            if (templates.length > 0) {
              console.log('Sample template structure:', {
                id: templates[0].id,
                name: templates[0].name,
                components: templates[0].components,
                componentsType: typeof templates[0].components,
                isArray: Array.isArray(templates[0].components),
                componentsKeys: templates[0].components ? Object.keys(templates[0].components) : null
              });
            }
            
            // Handle pagination if there are more pages
            let nextUrl = response.data?.paging?.next;
            const maxPages = 10;
            
            while (nextUrl && pageCount < maxPages) {
              try {
                pageCount++;
                console.log(`Fetching page ${pageCount}...`);
                
                // Use the full URL from Facebook API directly
                const nextResponse = await client.get(nextUrl);
                const nextTemplates = nextResponse.data?.data || [];
                allTemplates = [...allTemplates, ...nextTemplates];
                
                console.log(`Page ${pageCount}: Fetched ${nextTemplates.length} templates (Total: ${allTemplates.length})`);
                
                nextUrl = nextResponse.data?.paging?.next || null;
              } catch (pageError: any) {
                console.error(`Error fetching page ${pageCount}:`, pageError.message);
                console.error('Page error details:', pageError.response?.data);
                break; // Stop pagination on error
              }
            }
          } catch (error: any) {
            console.error('Error fetching templates from Facebook:', error.message);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            // Don't throw - let it fall through to database fallback
          }
          
          facebookTemplates = allTemplates;
          console.log(`Total templates fetched: ${facebookTemplates.length} (from ${pageCount} page(s))`);
          console.log(`Found ${facebookTemplates.length} templates from Facebook/Meta`);
          console.log('Template names:', facebookTemplates.map(t => t.name));
          console.log('Template IDs:', facebookTemplates.map(t => t.id));
          console.log('Template statuses:', facebookTemplates.map(t => t.status));
          
          // Sync templates to database (save/update)
          if (facebookTemplates.length > 0) {
            for (const template of facebookTemplates) {
              try {
                const existingTemplate = await prisma.template.findFirst({
                  where: {
                    templateId: template.id,
                    workspaceId: Number(workspaceId)
                  }
                });

                const templateData = {
                  name: template.name,
                  status: template.status || 'PENDING',
                  category: template.category || 'MARKETING',
                  language: template.language || 'en_US',
                  components: JSON.stringify(template.components || []),
                  templateId: template.id,
                  workspaceId: Number(workspaceId)
                };

                if (existingTemplate) {
                  // Update existing template
                  await prisma.template.update({
                    where: { id: existingTemplate.id },
                    data: {
                      ...templateData,
                      updatedAt: new Date()
                    }
                  });
                } else {
                  // Create new template
                  await prisma.template.create({
                    data: templateData
                  });
                }
              } catch (error: any) {
                console.error(`Error syncing template ${template.name}:`, error);
                // Continue with other templates
              }
            }
            console.log(`Synced ${facebookTemplates.length} templates to database`);
          }
        } catch (error: any) {
          console.error('Error fetching from Facebook:', error.message);
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          // Continue to fallback to database
        }
      }

      // Always prioritize Facebook templates if we got any
      let templatesToReturn = [];
      
      if (facebookTemplates.length > 0) {
        console.log(`Using ${facebookTemplates.length} templates from Facebook/Meta`);
        console.log('Facebook template details:', facebookTemplates.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          hasComponents: !!t.components,
          componentsType: typeof t.components,
          componentsLength: Array.isArray(t.components) ? t.components.length : 'N/A'
        })));
        
        // Transform Facebook templates to expected format
        // Facebook API returns components as an array
        templatesToReturn = facebookTemplates.map(template => {
          // Components should already be an array from Facebook API
          // But ensure it's always an array for safety
          let components = template.components;
          
          if (Array.isArray(components)) {
            // Already an array, use as-is
            components = components;
          } else if (components && typeof components === 'object') {
            // If it's an object (not array), try to extract array from it
            // Sometimes Facebook wraps it in an object
            if (components.data && Array.isArray(components.data)) {
              components = components.data;
            } else if (Array.isArray(components.components)) {
              components = components.components;
            } else {
              // Single component object, wrap in array
              components = [components];
            }
          } else {
            // Fallback to empty array
            components = [];
          }
          
          return {
            id: template.id,
            name: template.name,
            status: template.status,
            category: template.category,
            language: template.language,
            components: components
          };
        });
        
        console.log('Transformed templates:', templatesToReturn.map(t => ({
          id: t.id,
          name: t.name,
          componentsCount: Array.isArray(t.components) ? t.components.length : 0
        })));
      } else {
        console.log('No Facebook templates found, using database templates');
        // Fallback to database templates
        const dbTemplates = await prisma.template.findMany({
          where: {
            workspaceId: Number(workspaceId),
            ...(status && { status: status as string })
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        console.log(`Found ${dbTemplates.length} templates in database`);

        templatesToReturn = dbTemplates.map(template => ({
          id: template.templateId,
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          components: JSON.parse(template.components || '[]')
        }));
      }

      console.log(`Returning ${templatesToReturn.length} templates to frontend`);
      console.log(`Source: ${facebookTemplates.length > 0 ? 'Facebook/Meta API' : 'Database'}`);
      console.log(`Template IDs being returned:`, templatesToReturn.map(t => t.id));
      
      return res.status(200).json({ 
        status: 'success', 
        statusCode: 200,
        message: `Successfully fetched ${templatesToReturn.length} templates from ${facebookTemplates.length > 0 ? 'Facebook/Meta' : 'database'}`,
        data: templatesToReturn, 
      });
        
    } catch (e) {
        console.error('Template API error:', e)
        return new ServerError(res, 500, "Failed to fetch templates")
    }

  },
  sessionCookie(),
);

