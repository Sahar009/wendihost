import prisma from '@/libs/prisma';
import { sendWhatsAppMessage, sendTemplateMessage } from './whatsapp';

export interface WorkingHours {
  day: string;
  open: boolean;
  startTime: string;
  endTime: string;
}

export interface AutomationRule {
  id: string;
  enabled: boolean;
  description: string;
  responseType: 'text' | 'chatbot' | 'ai' | 'template';
  materialId?: string;
  materialName?: string;
  threshold?: number;
  chatbotFlow?: string;
  chatbotFlowName?: string;
  aiPrompt?: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
}

export interface AutomationSettings {
  holidayMode: boolean;
  workingHours: WorkingHours[];
  automationRules: AutomationRule[];
}

export class AutomationService {
  private workspaceId: number;

  constructor(workspaceId: number) {
    this.workspaceId = workspaceId;
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it as is
    if (normalized.startsWith('+')) {
      return normalized;
    }
    
    // If it starts with 234 (Nigeria country code), add +
    if (normalized.startsWith('234')) {
      return '+' + normalized;
    }
    
    // If it starts with 0, replace with +234
    if (normalized.startsWith('0')) {
      return '+234' + normalized.substring(1);
    }
    
    // If it's just digits, assume it's a Nigerian number and add +234
    if (/^\d+$/.test(normalized)) {
      return '+234' + normalized;
    }
    
    return normalized;
  }

  async getSettings(): Promise<AutomationSettings | null> {
    try {
      if (!(prisma as any).automationSettings) {
        console.log('AutomationSettings model not available in Prisma client');
        return null;
      }
      
      const settings = await (prisma as any).automationSettings.findFirst({
        where: { workspaceId: this.workspaceId }
      });

      if (!settings) {
        return null;
      }

    let workingHours: WorkingHours[] = [];
    let automationRules: AutomationRule[] = [];

    try {
      if (typeof settings.workingHours === 'string') {
        workingHours = JSON.parse(settings.workingHours);
      } else if (Array.isArray(settings.workingHours)) {
        workingHours = settings.workingHours;
      }

      if (typeof settings.automationRules === 'string') {
        const parsedRules = JSON.parse(settings.automationRules);
        // Convert object to array if needed
        if (typeof parsedRules === 'object' && !Array.isArray(parsedRules)) {
          automationRules = Object.values(parsedRules).map((rule: any) => ({
            ...rule,
            responseType: rule.type || rule.responseType || 'text' // Map 'type' to 'responseType'
          }));
        } else {
          automationRules = parsedRules.map((rule: any) => ({
            ...rule,
            responseType: rule.type || rule.responseType || 'text'
          }));
        }
      } else if (Array.isArray(settings.automationRules)) {
        automationRules = settings.automationRules.map((rule: any) => ({
          ...rule,
          responseType: rule.type || rule.responseType || 'text'
        }));
      } else if (typeof settings.automationRules === 'object' && settings.automationRules !== null) {
        // Convert object to array
        automationRules = Object.values(settings.automationRules).map((rule: any) => ({
          ...rule,
          responseType: rule.type || rule.responseType || 'text'
        }));
      }
    } catch (error) {
      console.error('Error parsing automation settings JSON:', error);
      workingHours = [];
      automationRules = [];
    }

      return {
        holidayMode: settings.holidayMode,
        workingHours,
        automationRules
      };
    } catch (error: any) {
      console.error('Error fetching automation settings:', error);
      
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('automationSettings')) {
        console.log('AutomationSettings table does not exist yet, returning null');
        return null;
      }
      
      throw error;
    }
  }

  async saveSettings(settings: AutomationSettings): Promise<void> {
    try {
      // Check if automationSettings exists on prisma client
      if (!(prisma as any).automationSettings) {
        throw new Error('AutomationSettings model not available in Prisma client. Please regenerate Prisma client.');
      }
      
      await (prisma as any).automationSettings.upsert({
        where: { workspaceId: this.workspaceId },
        update: {
          holidayMode: settings.holidayMode,
          workingHours: JSON.stringify(settings.workingHours),
          automationRules: JSON.stringify(settings.automationRules)
        },
        create: {
          workspaceId: this.workspaceId,
          holidayMode: settings.holidayMode,
          workingHours: JSON.stringify(settings.workingHours),
          automationRules: JSON.stringify(settings.automationRules)
        }
      });
    } catch (error: any) {
      console.error('Error saving automation settings:', error);
      
      // Check if table doesn't exist
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('automationSettings')) {
        throw new Error('AutomationSettings table does not exist. Please run database migrations first.');
      }
      
      // Check for specific upsert errors
      if (error.message?.includes('upsert')) {
        throw new Error(`Database operation failed: ${error.message}`);
      }
      
      // Re-throw the original error for other cases
      throw error;
    }
  }

  isWorkingHours(settings: AutomationSettings): boolean {
    if (settings.holidayMode) {
      return false;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const todaySchedule = settings.workingHours.find(
      day => day.day === currentDay
    );

    if (!todaySchedule || !todaySchedule.open) {
      return false;
    }

    return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
  }

  async getAutomatedResponse(
    phone: string,
    message: string,
    conversation: any,
    settings: AutomationSettings
  ): Promise<string | null> {
    console.log('🤖 AUTOMATION SERVICE START - getAutomatedResponse:', {
      workspaceId: this.workspaceId,
      phone,
      message: message.substring(0, 50),
      conversationId: conversation?.id,
      conversationStatus: conversation?.status,
      conversationCreatedAt: conversation?.createdAt,
      settingsRulesCount: settings?.automationRules?.length || 0
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: this.workspaceId }
    });

    if (!workspace) {
      console.log('❌ AUTOMATION: No workspace found for ID:', this.workspaceId);
      return null;
    }

    console.log('✅ AUTOMATION: Workspace found:', workspace.name, workspace.id);

    if (!Array.isArray(settings.automationRules)) {
      console.error('❌ AUTOMATION: Rules not array:', settings.automationRules);
      return null;
    }

    console.log('📋 AUTOMATION: Rules loaded:', settings.automationRules.map(r => ({
      id: r.id,
      enabled: r.enabled,
      type: r.responseType,
      description: r.description
    })));

    // Check if it's working hours
    const isWorking = this.isWorkingHours(settings);
    console.log('🕐 AUTOMATION: Is working hours:', isWorking);
    console.log('🏖️ AUTOMATION: Holiday mode:', settings.holidayMode);

    // Check rules in priority order
    let applicableRule = null;
    
    // Rule 1: Out of working hours message (highest priority)
    const rule1 = settings.automationRules.find(r => r.id === '1' && r.enabled);
    console.log('🔍 AUTOMATION: Checking Rule 1:', { rule1: !!rule1, isWorking, holidayMode: settings.holidayMode });
    if (rule1 && (!isWorking || settings.holidayMode)) {
      console.log(`✅ AUTOMATION: Rule 1 (out of hours) is applicable - not working hours or holiday mode`);
      applicableRule = rule1;
    }
    
    // Rule 2: No agent available during working hours
    const rule2 = settings.automationRules.find(r => r.id === '2' && r.enabled);
    console.log('🔍 AUTOMATION: Checking Rule 2:', { rule2: !!rule2, isWorking, holidayMode: settings.holidayMode });
    
    let hasAvailableAgents = false;
    if (!applicableRule && rule2 && isWorking && !settings.holidayMode) {
      // Check if there are any team members available
      try {
        const teamMembers = await prisma.member.findMany({
          where: { workspaceId: this.workspaceId },
          select: { id: true, name: true }
        });
        
        hasAvailableAgents = teamMembers.length > 0;
        console.log('👥 AUTOMATION: Agent availability check:', { 
          teamMembersCount: teamMembers.length, 
          hasAvailableAgents 
        });
        
        // If there are NO team members at all, Rule 2 should trigger (no agents available)
        if (teamMembers.length === 0) {
          console.log(`✅ AUTOMATION: Rule 2 (no agent) is applicable - no team members exist in workspace`);
          applicableRule = rule2;
        } else if (!hasAvailableAgents) {
          console.log(`✅ AUTOMATION: Rule 2 (no agent) is applicable - working hours but no agents available`);
          applicableRule = rule2;
        } else {
          console.log(`❌ AUTOMATION: Rule 2 (no agent) not applicable - agents are available`);
        }
      } catch (error) {
        console.error('❌ AUTOMATION: Error checking agent availability:', error);
        // If we can't check agents, skip Rule 2 to avoid confusion
        console.log(`⚠️ AUTOMATION: Rule 2 (no agent) skipped - error checking agents`);
        // Don't set applicableRule, let it fall through to other rules
      }
    }
    
    // Rule 3: Welcome message for new chats (check if this is a new conversation)
    const rule3 = settings.automationRules.find(r => r.id === '3' && r.enabled);
    console.log('🔍 AUTOMATION: Checking Rule 3:', { rule3: !!rule3, conversationCreatedAt: conversation?.createdAt });
    if (!applicableRule && rule3) {
      // Check if this is a new conversation (created within last 5 minutes)
      const isNewConversation = conversation?.createdAt && 
        (Date.now() - new Date(conversation.createdAt).getTime()) < (5 * 60 * 1000);
      
      console.log('🔍 AUTOMATION: Rule 3 new conversation check:', { 
        isNewConversation, 
        timeSinceCreation: conversation?.createdAt ? Date.now() - new Date(conversation.createdAt).getTime() : 'N/A' 
      });
      
      if (isNewConversation) {
        console.log(`✅ AUTOMATION: Rule 3 (welcome) is applicable for new chat`);
        applicableRule = rule3;
      } else {
        console.log(`❌ AUTOMATION: Rule 3 (welcome) not applicable - not a new conversation`);
      }
    }
    
    // Rule 4: AI response after threshold
    const rule4 = settings.automationRules.find(r => r.id === '4' && r.enabled && r.responseType === 'ai');
    if (!applicableRule && rule4 && rule4.threshold && conversation.updatedAt) {
      const timeSinceLastMessage = Date.now() - new Date(conversation.updatedAt).getTime();
      const thresholdMs = rule4.threshold * 60 * 1000; // Convert minutes to milliseconds
      const isApplicable = timeSinceLastMessage >= thresholdMs;
      console.log(`Rule 4 (ai) threshold check: ${timeSinceLastMessage}ms >= ${thresholdMs}ms = ${isApplicable}`);
      if (isApplicable) {
        applicableRule = rule4;
      }
    }
    
    // Rule 5: Fallback message (lowest priority, always applicable if enabled)
    const rule5 = settings.automationRules.find(r => r.id === '5' && r.enabled);
    console.log('🔍 AUTOMATION: Checking Rule 5:', { rule5: !!rule5, applicableRule: !!applicableRule });
    if (!applicableRule && rule5) {
      console.log(`✅ AUTOMATION: Rule 5 (fallback) is applicable`);
      applicableRule = rule5;
    }
    
    // Check other enabled rules
    if (!applicableRule) {
      for (const rule of settings.automationRules) {
        if (!rule.enabled) continue;
        
        console.log(`Checking rule ${rule.id}: ${rule.description} (${rule.responseType})`);
        
        switch (rule.responseType) {
          case 'text':
            if ((rule.aiPrompt && rule.aiPrompt.trim()) || rule.materialId) {
              console.log(`Rule ${rule.id} (text) is applicable`);
              applicableRule = rule;
              break;
            }
            break;
            
          case 'template':
            if (rule.templateName && rule.templateName.trim()) {
              console.log(`Rule ${rule.id} (template) is applicable`);
              applicableRule = rule;
              break;
            }
            break;
            
          case 'chatbot':
            if (rule.chatbotFlow && rule.chatbotFlow.trim()) {
              console.log(`Rule ${rule.id} (chatbot) triggered - chatbot flow: ${rule.chatbotFlow}`);
              applicableRule = rule;
              break;
            }
            break;

          case 'ai':
            if (rule.aiPrompt && rule.aiPrompt.trim()) {
              // If threshold is defined, ensure it is met
              if (rule.threshold && conversation.updatedAt) {
                const elapsedMs = Date.now() - new Date(conversation.updatedAt).getTime();
                const thresholdMs = rule.threshold * 60 * 1000;
                const meets = elapsedMs >= thresholdMs;
                console.log(`Rule ${rule.id} (ai) threshold check: ${elapsedMs}ms >= ${thresholdMs}ms = ${meets}`);
                if (!meets) break;
              }
              console.log(`Rule ${rule.id} (ai) is applicable`);
              applicableRule = rule;
              break;
            }
            break;
        }
        
        if (applicableRule) break;
      }
    }
    
    
    console.log('🎯 AUTOMATION: Final rule check:', { 
      applicableRule: applicableRule ? { id: applicableRule.id, type: applicableRule.responseType } : null 
    });

    if (applicableRule) {
      console.log('🚀 AUTOMATION: Processing applicable rule:', {
        id: applicableRule.id,
        type: applicableRule.responseType,
        description: applicableRule.description
      });

      let responseContent = '';
      
      switch (applicableRule.responseType) {
        case 'text':
          if (applicableRule.aiPrompt && applicableRule.aiPrompt.trim()) {
            responseContent = applicableRule.aiPrompt;
            console.log('📝 AUTOMATION: Using text prompt:', responseContent.substring(0, 50));
          } else if (applicableRule.materialId) {
            try {
              const material = await this.getResponseMaterial(applicableRule.materialId);
              if (material?.content) {
                responseContent = material.content;
                console.log('📄 AUTOMATION: Using material content:', responseContent.substring(0, 50));
              }
            } catch (e) {
              console.error('❌ AUTOMATION: Failed to fetch response material:', e);
            }
          }
          break;
          
        case 'chatbot':
          console.log('🤖 AUTOMATION: Chatbot response triggered');
          return 'CHATBOT_TRIGGERED';
          
        case 'ai':
          if (applicableRule.aiPrompt) {
            console.log('🧠 AUTOMATION: AI response triggered');
            try {
              // Import AI service dynamically to avoid circular dependencies
              const { GoogleGenerativeAI } = await import("@google/generative-ai");
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
              const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
              const result = await model.generateContent([applicableRule.aiPrompt]);
              const aiResponse = result.response.text();
              console.log('🤖 AUTOMATION: AI generated response:', aiResponse.substring(0, 100) + '...');
              
              // Send the AI response directly
              const { sendTextMsg } = await import('./waba/send-msg');
              await sendTextMsg(workspace, phone, aiResponse);
              
              // Create message record
              await prisma.message.create({
                data: {
                  phone: phone,
                  type: 'text',
                  fromCustomer: false,
                  isBot: true,
                  fileType: 'none',
                  message: aiResponse,
                  messageId: `ai_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  status: 'sent',
                  conversationId: conversation.id,
                  workspaceId: this.workspaceId
                }
              });
              
              console.log('✅ AUTOMATION: AI response sent successfully');
              return 'AI_RESPONSE_SENT';
            } catch (error) {
              console.error('❌ AUTOMATION: AI response failed:', error);
              // Fallback to text if AI fails
              if (applicableRule.aiPrompt) {
                console.log('🔄 AUTOMATION: Falling back to text response due to AI failure');
                responseContent = applicableRule.aiPrompt;
              }
            }
          }
          break;
          
        case 'template':
          if (applicableRule.templateName && applicableRule.templateName.trim() !== '') {
            try {
              console.log('📋 AUTOMATION: Sending template:', applicableRule.templateName);
              await sendTemplateMessage(phone, applicableRule.templateName, workspace);
              console.log('✅ AUTOMATION: Template message sent successfully:', applicableRule.templateName);
              return 'TEMPLATE_MESSAGE_TRIGGERED';
            } catch (error) {
              console.error('❌ AUTOMATION: Template message failed:', error);
              if (applicableRule.aiPrompt) {
                console.log('🔄 AUTOMATION: Falling back to text response due to template failure');
                responseContent = applicableRule.aiPrompt;
              }
              return null;
            }
          } else {
            console.log('⚠️ AUTOMATION: Template name is empty, skipping template message');
            if (applicableRule.aiPrompt) {
              console.log('📝 AUTOMATION: Using aiPrompt as fallback for empty template');
              responseContent = applicableRule.aiPrompt;
            }
          }
          break;
      }
      
      if (responseContent) {
        console.log('📤 AUTOMATION: Sending automated message:', responseContent.substring(0, 50));
        await this.sendAutomatedMessage(phone, responseContent, workspace);
        console.log('✅ AUTOMATION: Message sent successfully');
        return responseContent;
      } else {
        console.log('⚠️ AUTOMATION: No response content generated');
      }
    } else {
      console.log('❌ AUTOMATION: No applicable rule found');
    }
    
    return null;
  }

  private async getResponseMaterial(materialId: string): Promise<any> {
    return await (prisma as any).responseMaterial.findFirst({
      where: { 
        id: parseInt(materialId),
        workspaceId: this.workspaceId
      }
    });
  }

  private async sendAutomatedMessage(phone: string, content: string, workspace: any): Promise<void> {
    try {
      // Normalize phone number for consistent lookup
      const normalizedPhone = this.normalizePhoneNumber(phone);
      const toNumber = String(normalizedPhone).replace(/[^\d]/g, '');
      console.log('Automation send -> workspace creds present?', {
        workspaceId: this.workspaceId,
        hasPhoneId: !!workspace?.phoneId,
        hasAccessToken: !!workspace?.accessToken,
        to: normalizedPhone,
        toDigits: toNumber
      });
      let conversation = await prisma.conversation.findFirst({
        where: { 
          OR: [
            { phone: normalizedPhone },
            { phone: phone }
          ],
          workspaceId: this.workspaceId 
        }
      });

      if (!conversation) {
        console.log('Automation send -> no conversation found, creating one');
        // Ensure contact exists
        let contact = await prisma.contact.findFirst({
          where: {
            OR: [
              { phone: normalizedPhone },
              { phone: phone }
            ],
            workspaceId: this.workspaceId
          }
        });

        if (!contact) {
          try {
            contact = await prisma.contact.create({
              data: {
                phone: normalizedPhone,
                workspaceId: this.workspaceId,
                firstName: 'WhatsApp',
                lastName: `User ${toNumber.slice(-4)}`,
              }
            });
          } catch (e) {
            console.error('Automation send -> failed to create contact:', e);
          }
        }

        try {
          conversation = await prisma.conversation.create({
            data: {
              phone: normalizedPhone,
              workspaceId: this.workspaceId,
              contact: contact?.id ? { connect: { id: contact.id } } : undefined,
              read: false,
              assigned: false,
              status: 'open',
              updatedAt: new Date()
            }
          });
        } catch (e) {
          console.error('Automation send -> failed to create conversation:', e);
        }
      }

      if (conversation) {
        await prisma.message.create({
          data: {
            phone: normalizedPhone,
            type: 'text',
            fromCustomer: false,
            isBot: true,
            fileType: 'none',
            message: content,
            messageId: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
            conversationId: conversation.id,
            workspaceId: this.workspaceId
          }
        });

        await sendWhatsAppMessage(normalizedPhone, content, workspace);
      } else {
        console.log('Automation send -> conversation still missing, skipping DB write but attempting direct send');
        await sendWhatsAppMessage(normalizedPhone, content, workspace);
      }
    } catch (error) {
      console.error('Error sending automated message:', error);
    }
  }

  async createDefaultMaterials(): Promise<void> {
    const defaultMaterials = [
      {
        name: 'Welcome',
        content: 'Hello! Welcome to our WhatsApp support. How can we help you today?',
        type: 'welcome'
      },
      {
        name: 'Out of Hours',
        content: 'Thank you for your message. We are currently outside our working hours. We\'ll get back to you as soon as possible.',
        type: 'out-of-hours'
      },
      {
        name: 'No Agent Available',
        content: 'Thank you for your message. Our team is currently busy. We\'ll respond to you shortly.',
        type: 'no-agent'
      },
      {
        name: 'Fallback',
        content: 'Thank you for your message. We\'re here to help and will get back to you soon.',
        type: 'fallback'
      },
      {
        name: 'Follow-up',
        content: 'Hi! We noticed you haven\'t responded in a while. Is there anything else we can help you with?',
        type: 'follow-up'
      },
      {
        name: 'Out of Office',
        content: 'We are currently out of office. We\'ll respond to your message when we return.',
        type: 'out-of-office'
      }
    ];

    try {
      // Check if responseMaterial exists on prisma client
      if (!(prisma as any).responseMaterial) {
        console.log('ResponseMaterial model not available in Prisma client, skipping default materials creation');
        return;
      }
      
      for (const material of defaultMaterials) {
        await (prisma as any).responseMaterial.upsert({
          where: {
            workspaceId_type: {
              workspaceId: this.workspaceId,
              type: material.type
            }
          },
          update: {
            name: material.name,
            content: material.content
          },
          create: {
            ...material,
            workspaceId: this.workspaceId
          }
        });
      }
    } catch (error: any) {
      console.error('Error creating default materials:', error);
      
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('responseMaterial')) {
        console.log('ResponseMaterial table does not exist yet, skipping default materials creation');
        return;
      }
      
      throw error;
    }
  }
}
