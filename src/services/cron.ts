import cron from 'node-cron';
import { scheduleCampaignMessages } from './campaign/scheduler';
import { AutomationService, AutomationSettings, AutomationRule } from './automation';
import prisma from '@/libs/prisma';

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('Running campaign scheduler...');
  await scheduleCampaignMessages();
});

// Run every 5 minutes for automation tasks
cron.schedule('*/5 * * * *', async () => {
  console.log('Running automation tasks...');
  await runAutomationTasks();
});

// Run every hour for follow-up messages
cron.schedule('0 * * * *', async () => {
  console.log('Running follow-up automation...');
  await runFollowUpAutomation();
});

async function runAutomationTasks() {
  try {
    // Get all workspaces with automation settings
    const workspaces = await (prisma as any).workspace.findMany({
      include: {
        automationSettings: true
      }
    });

    for (const workspace of workspaces) {
      if (!workspace.automationSettings) continue;

      const automationService = new AutomationService(workspace.id);
      const settings = await automationService.getSettings();
      
      if (!settings) continue;

      const timeThresholdRule = settings.automationRules.find((r: any) => r.id === '4');
      if (timeThresholdRule?.enabled && timeThresholdRule.threshold && timeThresholdRule.materialId) {
        await checkTimeBasedResponses(workspace, settings, automationService);
      }
    }
  } catch (error) {
    console.error('Automation tasks error:', error);
  }
}

async function runFollowUpAutomation() {
  try {
    const workspaces = await (prisma as any).workspace.findMany({
      include: {
        automationSettings: true
      }
    });

    for (const workspace of workspaces) {
      if (!workspace.automationSettings) continue;

      const automationService = new AutomationService(workspace.id);
      const settings = await automationService.getSettings();
      
      if (!settings) continue;

      const followUpRule = settings.automationRules.find((r: any) => r.id === '6');
      if (followUpRule?.enabled && followUpRule.materialId) {
        await checkFollowUpMessages(workspace, settings, automationService);
      }
    }
  } catch (error) {
    console.error('Follow-up automation error:', error);
  }
}

async function checkTimeBasedResponses(workspace: any, settings: AutomationSettings, automationService: AutomationService) {
  try {
    const threshold = settings.automationRules.find((r: any) => r.id === '4')?.threshold || 15;
    const thresholdTime = new Date(Date.now() - threshold * 60 * 1000);

    const conversations = await prisma.conversation.findMany({
      where: {
        workspaceId: workspace.id,
        status: 'open',
        updatedAt: {
          lt: thresholdTime
        }
      }
    });

    for (const conversation of conversations) {
      const lastMessage = await prisma.message.findFirst({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' }
      });

      if (lastMessage && lastMessage.fromCustomer) {
        const lastBotMessage = await prisma.message.findFirst({
          where: { 
            conversationId: conversation.id,
            fromCustomer: false,
            isBot: true
          },
          orderBy: { createdAt: 'desc' }
        });

        if (!lastBotMessage || 
            (Date.now() - lastBotMessage.createdAt.getTime()) > (threshold * 60 * 1000)) {
          await automationService.getAutomatedResponse(
            conversation.phone,
            lastMessage.message,
            conversation,
            settings
          );
        }
      }
    }
  } catch (error) {
    console.error('Time-based response error:', error);
  }
}

async function checkFollowUpMessages(workspace: any, settings: AutomationSettings, automationService: AutomationService) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const conversations = await prisma.conversation.findMany({
      where: {
        workspaceId: workspace.id,
        status: 'open',
        updatedAt: {
          lt: twentyFourHoursAgo
        }
      }
    });

    for (const conversation of conversations) {
      const lastMessage = await prisma.message.findFirst({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' }
      });

      if (lastMessage && lastMessage.fromCustomer) {
        await automationService.getAutomatedResponse(
          conversation.phone,
          lastMessage.message,
          conversation,
          settings
        );
      }
    }
  } catch (error) {
    console.error('Follow-up message error:', error);
  }
}

console.log('Campaign and automation schedulers started');