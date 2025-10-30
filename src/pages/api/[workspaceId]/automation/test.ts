import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { AutomationService } from '@/services/automation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: Number(workspaceId) }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const automationService = new AutomationService(Number(workspaceId));
    
    // Test 1: Check if automation settings exist
    const settings = await automationService.getSettings();
    
    console.log('Raw automation settings from database:', settings);
    
    if (!settings) {
      // Create default automation settings for testing
      const defaultSettings = {
        holidayMode: false,
        workingHours: [
          { day: 'Monday', open: true, startTime: '09:00', endTime: '17:00' },
          { day: 'Tuesday', open: true, startTime: '09:00', endTime: '17:00' },
          { day: 'Wednesday', open: true, startTime: '09:00', endTime: '17:00' },
          { day: 'Thursday', open: true, startTime: '09:00', endTime: '17:00' },
          { day: 'Friday', open: true, startTime: '09:00', endTime: '17:00' },
          { day: 'Saturday', open: false, startTime: '09:00', endTime: '17:00' },
          { day: 'Sunday', open: false, startTime: '09:00', endTime: '17:00' }
        ],
        automationRules: [
          {
            id: '1',
            enabled: true,
            description: 'Out of hours response',
            responseType: 'text' as const,
            aiPrompt: 'Thank you for your message. We are currently outside our working hours. We\'ll get back to you as soon as possible.'
          },
          {
            id: '2',
            enabled: true,
            description: 'No agent available',
            responseType: 'text' as const,
            aiPrompt: 'Thank you for your message. Our team is currently busy. We\'ll respond to you shortly.'
          },
          {
            id: '3',
            enabled: true,
            description: 'Welcome message',
            responseType: 'text' as const,
            aiPrompt: 'Hello! Welcome to our WhatsApp support. How can we help you today?'
          },
          {
            id: '4',
            enabled: true,
            description: 'Time threshold response',
            responseType: 'ai' as const,
            threshold: 5,
            aiPrompt: 'Hi! We noticed you haven\'t responded in a while. Is there anything else we can help you with?'
          },
          {
            id: '5',
            enabled: true,
            description: 'Fallback response',
            responseType: 'text' as const,
            aiPrompt: 'Thank you for your message. We\'re here to help and will get back to you soon.'
          }
        ]
      };

      console.log('Creating default automation settings...');
      await automationService.saveSettings(defaultSettings);
      console.log('Created default automation settings');
      
      return res.json({
        success: true,
        message: 'Default automation settings created',
        settings: defaultSettings
      });
    }

    // Test 2: Check working hours
    const isWorkingHours = automationService.isWorkingHours(settings);
    
    console.log('Working hours check result:', isWorkingHours);
    console.log('Automation rules type:', typeof settings.automationRules);
    console.log('Automation rules is array:', Array.isArray(settings.automationRules));
    console.log('Automation rules length:', settings.automationRules?.length);
    
    // Test 3: Test automation response
    const testConversation = {
      id: 1,
      assigned: false,
      workspaceId: Number(workspaceId)
    };

    console.log('Testing automation response...');
    const automatedResponse = await automationService.getAutomatedResponse(
      '+1234567890',
      'Hello',
      testConversation,
      settings
    );
    console.log('Automation response result:', automatedResponse);

    return res.json({
      success: true,
      message: 'Automation system test completed',
      data: {
        settingsExist: !!settings,
        workingHours: settings?.workingHours,
        automationRules: settings?.automationRules,
        isWorkingHours,
        testResponse: automatedResponse,
        workspace: {
          id: workspace.id,
          name: workspace.name
        }
      }
    });

  } catch (error) {
    console.error('Automation test error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
