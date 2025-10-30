import { NextApiRequest, NextApiResponse } from 'next';
import { AutomationService } from '@/services/automation';
import { AutomationFallbackService } from '@/services/automation-fallback';
import prisma from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    console.log(`Automation settings request for workspace: ${workspaceId}`);

    // Get workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: Number(workspaceId) }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    console.log(`Found workspace: ${workspace.name}`);

    // Try to use the main service, fall back to raw SQL service if models aren't available
    let automationService;
    const useFallback = !(prisma as any).automationSettings;
    
    if (useFallback) {
      console.log('Using fallback automation service (Prisma models not available)');
      automationService = new AutomationFallbackService(Number(workspaceId));
    } else {
      console.log('Using standard automation service');
      automationService = new AutomationService(Number(workspaceId));
    }

    if (req.method === 'GET') {
      try {
        // Get automation settings
        const settings = await automationService.getSettings();
        
        if (!settings) {
          console.log('No settings found, creating default settings');
          
          // Default automation rules with proper responseType
          const defaultRules = [
            {
              id: '1',
              enabled: true,
              description: 'When it is not working hours, reply with this message',
              responseType: 'text' as const,
              aiPrompt: 'Thank you for your message. We are currently outside our working hours. We\'ll get back to you as soon as possible.'
            },
            {
              id: '2',
              enabled: true,
              description: 'When there is no customer service online during working hours, reply with this message',
              responseType: 'text' as const,
              aiPrompt: 'Thank you for your message. Our team is currently busy. We\'ll respond to you shortly.'
            },
            {
              id: '3',
              enabled: true,
              description: 'Send this welcome message when a new chat is started',
              responseType: 'text' as const,
              aiPrompt: 'Hello! Welcome to our WhatsApp support. How can we help you today?'
            },
            {
              id: '4',
              enabled: false,
              description: 'During working hours, users wait more than',
              responseType: 'ai' as const,
              threshold: 15,
              aiPrompt: 'Hi! We noticed you haven\'t responded in a while. Is there anything else we can help you with?'
            },
            {
              id: '5',
              enabled: true,
              description: 'Send this fallback message if no criteria is met',
              responseType: 'text' as const,
              aiPrompt: 'Thank you for your message. We\'re here to help and will get back to you soon.'
            },
            {
              id: '6',
              enabled: false,
              description: 'If customer does not respond within 24 hours, use this message',
              responseType: 'text' as const,
              aiPrompt: 'Hi! It\'s been a while since we last heard from you. Is there anything we can help you with?'
            },
            {
              id: '7',
              enabled: false,
              description: 'Expired or Closed chat will not be assigned to Bot but leave the last assignee in case of new message',
              responseType: 'text' as const,
              aiPrompt: 'This chat has expired or been closed. Please contact support for assistance.'
            },
            {
              id: '8',
              enabled: false,
              description: 'During out of office, send this message always',
              responseType: 'text' as const,
              aiPrompt: 'We are currently out of office. We\'ll respond to your message when we return.'
            },
            {
              id: '9',
              enabled: false,
              description: 'Assign newly opened chats in round robin manner within users of the assigned team',
              responseType: 'text' as const,
              aiPrompt: 'Your chat has been assigned to our team. An agent will be with you shortly.'
            }
          ];
          
          try {
            await automationService.saveSettings({
              holidayMode: false,
              workingHours: [
                { day: 'Monday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Tuesday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Wednesday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Thursday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Friday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Saturday', open: false, startTime: '09:00', endTime: '17:00' },
                { day: 'Sunday', open: false, startTime: '09:00', endTime: '17:00' },
              ],
              automationRules: defaultRules
            });
            console.log('Default settings created successfully');
            return res.status(200).json({
              holidayMode: false,
              workingHours: [
                { day: 'Monday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Tuesday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Wednesday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Thursday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Friday', open: true, startTime: '09:00', endTime: '17:00' },
                { day: 'Saturday', open: false, startTime: '09:00', endTime: '17:00' },
                { day: 'Sunday', open: false, startTime: '09:00', endTime: '17:00' },
              ],
              automationRules: defaultRules
            });
          } catch (createError: any) {
            console.error('Error creating default settings:', createError);
            
            // Check if it's a table doesn't exist error
            if (createError.message?.includes('AutomationSettings table does not exist') || 
                createError.code === 'P2021' || 
                createError.message?.includes('relation "AutomationSettings" does not exist')) {
              
              console.log('AutomationSettings table does not exist, attempting to create it...');
              
              try {
                // Try to create the table using raw SQL
                await prisma.$executeRaw`
                  CREATE TABLE IF NOT EXISTS "AutomationSettings" (
                    "id" SERIAL PRIMARY KEY,
                    "workspaceId" INTEGER NOT NULL UNIQUE,
                    "holidayMode" BOOLEAN NOT NULL DEFAULT false,
                    "workingHours" JSONB NOT NULL DEFAULT '[]',
                    "automationRules" JSONB NOT NULL DEFAULT '[]',
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    
                    CONSTRAINT "AutomationSettings_workspaceId_fkey" 
                        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") 
                        ON DELETE CASCADE ON UPDATE CASCADE
                  );
                `;
                
                console.log('AutomationSettings table created successfully');
                
                // Try to save settings again after creating the table
                await automationService.saveSettings({
                  holidayMode: false,
                  workingHours: [
                    { day: 'Monday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Tuesday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Wednesday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Thursday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Friday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Saturday', open: false, startTime: '09:00', endTime: '17:00' },
                    { day: 'Sunday', open: false, startTime: '09:00', endTime: '17:00' },
                  ],
                  automationRules: defaultRules
                });
                
                console.log('Default settings created successfully after table creation');
                return res.status(200).json({
                  holidayMode: false,
                  workingHours: [
                    { day: 'Monday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Tuesday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Wednesday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Thursday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Friday', open: true, startTime: '09:00', endTime: '17:00' },
                    { day: 'Saturday', open: false, startTime: '09:00', endTime: '17:00' },
                    { day: 'Sunday', open: false, startTime: '09:00', endTime: '17:00' },
                  ],
                  automationRules: defaultRules
                });
                
              } catch (tableCreationError: any) {
                console.error('Failed to create AutomationSettings table:', tableCreationError);
                return res.status(503).json({ 
                  error: 'Database not ready',
                  details: 'The automation settings table does not exist and could not be created automatically. Please run the database migration manually.',
                  retryable: false,
                  migrationRequired: true
                });
              }
            }
            
            return res.status(500).json({ 
              error: 'Failed to create default settings',
              details: createError instanceof Error ? createError.message : 'Unknown error'
            });
          }
        }
        
        console.log('Returning existing settings');
        return res.status(200).json(settings);
      } catch (getError) {
        console.error('Error getting settings:', getError);
        return res.status(500).json({ 
          error: 'Failed to get settings',
          details: getError instanceof Error ? getError.message : 'Unknown error'
        });
      }
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('Handling PUT/POST request for automation settings');
      const { holidayMode, workingHours, automationRules } = req.body;
      
      console.log('Received data:', { 
        holidayMode, 
        workingHoursLength: workingHours?.length, 
        automationRulesLength: automationRules?.length 
      });
      
      try {
        await automationService.saveSettings({
          holidayMode,
          workingHours,
          automationRules
        });
        
        console.log('Settings saved successfully');
        return res.status(200).json({ message: 'Settings saved successfully' });
      } catch (saveError: any) {
        console.error('Error saving settings:', saveError);
        
        if (saveError.message?.includes('AutomationSettings table does not exist') || 
            saveError.code === 'P2021' || 
            saveError.message?.includes('relation "AutomationSettings" does not exist')) {
          
          console.log('AutomationSettings table does not exist during save, attempting to create it...');
          
          try {
            // Try to create the table using raw SQL
            await prisma.$executeRaw`
              CREATE TABLE IF NOT EXISTS "AutomationSettings" (
                "id" SERIAL PRIMARY KEY,
                "workspaceId" INTEGER NOT NULL UNIQUE,
                "holidayMode" BOOLEAN NOT NULL DEFAULT false,
                "workingHours" JSONB NOT NULL DEFAULT '[]',
                "automationRules" JSONB NOT NULL DEFAULT '[]',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT "AutomationSettings_workspaceId_fkey" 
                    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") 
                    ON DELETE CASCADE ON UPDATE CASCADE
              );
            `;
            
            console.log('AutomationSettings table created successfully during save');
            
            // Try to save settings again after creating the table
            await automationService.saveSettings({
              holidayMode,
              workingHours,
              automationRules
            });
            
            console.log('Settings saved successfully after table creation');
            return res.status(200).json({ message: 'Settings saved successfully (table created automatically)' });
            
          } catch (tableCreationError: any) {
            console.error('Failed to create AutomationSettings table during save:', tableCreationError);
            return res.status(503).json({ 
              error: 'Database not ready',
              details: 'The automation settings table does not exist and could not be created automatically. Please run the database migration manually.',
              retryable: false,
              migrationRequired: true
            });
          }
        }
        
        // Handle Prisma-specific errors
        if (saveError.code === 'P2021') {
          return res.status(503).json({ 
            error: 'Database schema mismatch',
            details: 'The database schema is not up to date. Please contact support.',
            retryable: false
          });
        }
        
        // Handle connection errors
        if (saveError.code === 'P1001' || saveError.message?.includes('connect')) {
          return res.status(503).json({ 
            error: 'Database connection failed',
            details: 'Unable to connect to the database. Please try again later.',
            retryable: true
          });
        }
        
        // Generic error handling
        return res.status(500).json({ 
          error: 'Failed to save settings',
          details: saveError instanceof Error ? saveError.message : 'Unknown error',
          retryable: true
        });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('Unexpected error in automation settings API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
