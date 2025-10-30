import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import chatbotFlow from '@/services/chatbot';
import { CUSTOM_NODE } from '@/libs/enums';

// Track WhatsApp responses and message records for verification
const testResponses: any[] = [];
const testMessageRecords: any[] = [];
const testConversationUpdates: any[] = [];

// Enhanced conversation tracking
interface TestConversation {
  id: number;
  phone: string;
  status: 'open' | 'closed';
  chatbotId: number | null;
  currentNode: string | null;
  chatbotTimeout: Date | null;
  workspaceId: number;
  assigned: boolean;
  read: boolean;
  source: 'DIRECT' | 'WIDGET' | 'CAMPAIGN';
  campaignId: number | null;
  widgetId: string | null;
  metaAdId: string | null;
  memberId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Function to verify chatbot responses
const verifyChatbotResponse = async (conversation: TestConversation, userMessage: string, expectedNode?: string) => {
  console.log('🔍 VERIFYING: User message:', userMessage, 'Current node:', conversation.currentNode);
  
  const beforeState = { ...conversation };
  
  // Get messages before chatbot flow
  const messagesBefore = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' }
  });
  
  // Run chatbot flow
  const result = await chatbotFlow(conversation, userMessage, false);
  
  // Get messages after chatbot flow
  const messagesAfter = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' }
  });
  
  // Get updated conversation state
  const updatedConversation = await prisma.conversation.findUnique({
    where: { id: conversation.id }
  });
  
  // Analyze what happened
  const newMessages = messagesAfter.slice(0, messagesAfter.length - messagesBefore.length);
  const responseAnalysis = {
    userMessage,
    chatbotTriggered: result,
    newMessagesCount: newMessages.length,
    newMessages: newMessages.map(msg => ({
      message: msg.message,
      fromCustomer: msg.fromCustomer,
      isBot: msg.isBot,
      createdAt: msg.createdAt
    })),
    conversationStateChanged: beforeState.currentNode !== updatedConversation?.currentNode,
    currentNodeBefore: beforeState.currentNode,
    currentNodeAfter: updatedConversation?.currentNode,
    statusChanged: beforeState.status !== updatedConversation?.status,
    statusBefore: beforeState.status,
    statusAfter: updatedConversation?.status,
    expectedNode,
    nodeTransitionCorrect: expectedNode ? updatedConversation?.currentNode === expectedNode : true
  };
  
  testResponses.push(responseAnalysis);
  console.log('📊 RESPONSE ANALYSIS:', responseAnalysis);
  
  return {
    result,
    analysis: responseAnalysis,
    updatedConversation: updatedConversation as TestConversation
  };
};

// Mock 5-step chatbot configuration
const mockBotConfig = {
  "start": {
    "nodeId": "start",
    "type": CUSTOM_NODE.START_NODE,
    "message": "Welcome! Please choose an option:",
    "link": null,
    "fileType": "TEXT",
    "children": [],
    "next": "welcome",
    "needResponse": false
  },
  "welcome": {
    "nodeId": "welcome",
    "type": CUSTOM_NODE.OPTION_MESSAGE_NODE,
    "message": "Welcome to our service! How can we help you today?\n\n1. Support\n2. Sales\n3. Information\n4. Exit",
    "link": null,
    "fileType": "TEXT",
    "children": [
      {
        "nodeId": "support_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "Support",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "support",
        "needResponse": false
      },
      {
        "nodeId": "sales_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "Sales",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "sales",
        "needResponse": false
      },
      {
        "nodeId": "info_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "Information",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "information",
        "needResponse": false
      },
      {
        "nodeId": "exit_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "Exit",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "goodbye",
        "needResponse": false
      }
    ],
    "next": null,
    "needResponse": true
  },
  "support": {
    "nodeId": "support",
    "type": CUSTOM_NODE.OPTION_MESSAGE_NODE,
    "message": "Great! What type of support do you need?\n\n1. Technical Support\n2. Billing Support\n3. General Inquiry\n4. Back to Menu",
    "link": null,
    "fileType": "TEXT",
    "children": [
      {
        "nodeId": "tech_support_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "Technical Support",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "tech_support",
        "needResponse": false
      },
      {
        "nodeId": "billing_support_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "Billing Support",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "billing_support",
        "needResponse": false
      },
      {
        "nodeId": "general_support_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "General Inquiry",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "general_support",
        "needResponse": false
      },
      {
        "nodeId": "back_to_menu_option",
        "type": CUSTOM_NODE.OPTION_NODE,
        "message": "Back to Menu",
        "link": null,
        "fileType": "TEXT",
        "children": [],
        "next": "welcome",
        "needResponse": false
      }
    ],
    "next": null,
    "needResponse": true
  },
  "tech_support": {
    "nodeId": "tech_support",
    "type": CUSTOM_NODE.CHAT_BOT_MSG_NODE,
    "message": "You've been connected to our technical support team. Please describe your technical issue and we'll help you resolve it.",
    "link": null,
    "fileType": "TEXT",
    "children": [],
    "next": "support_complete",
    "needResponse": false
  },
  "support_complete": {
    "nodeId": "support_complete",
    "type": CUSTOM_NODE.CHAT_WITH_AGENT,
    "message": "Thank you! You are now connected to a live agent who will assist you with your support request.",
    "link": null,
    "fileType": "TEXT",
    "children": [],
    "next": null,
    "needResponse": false
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { step, message, conversationState } = req.body;

    if (!step || !message) {
      return res.status(400).json({ error: 'Step and message are required' });
    }

    console.log('🧪 TEST: Testing chatbot flow step:', step, 'with message:', message);

    // Create or get a test chatbot in the database
    let testChatbot = await prisma.chatbot.findFirst({
      where: {
        workspaceId: 1,
        name: 'Test Chatbot Flow'
      }
    });

    if (!testChatbot) {
      testChatbot = await prisma.chatbot.create({
        data: {
          name: 'Test Chatbot Flow',
          trigger: 'start',
          workspaceId: 1,
          bot: JSON.stringify(mockBotConfig),
          publish: true,
          default: true
        }
      });
      console.log('✅ Created test chatbot with ID:', testChatbot.id);
    } else {
      // Update the bot configuration
      await prisma.chatbot.update({
        where: { id: testChatbot.id },
        data: { bot: JSON.stringify(mockBotConfig) }
      });
      console.log('✅ Updated test chatbot configuration');
    }

    // Step 1: Test "start" trigger
    if (step === 'start') {
      const mockConversation: TestConversation = {
        id: 1,
        phone: '+2348101126131',
        status: 'open',
        chatbotId: null,
        currentNode: null,
        chatbotTimeout: null,
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result, analysis, updatedConversation } = await verifyChatbotResponse(
        mockConversation, 
        message, 
        'welcome'
      );

      return res.status(200).json({
        step: 'start',
        success: true,
        verification: analysis,
        chatbotTriggered: result,
        conversationAfter: updatedConversation,
        nextStep: result ? 'Send "1" for Support, "2" for Sales, "3" for Information, "4" for Exit' : null,
        messagesSent: analysis.newMessagesCount,
        expectedNode: 'welcome',
        nodeTransitionCorrect: analysis.nodeTransitionCorrect
      });
    }

    // Step 2: Test "1" response (Support)
    if (step === 'option1') {
      const mockConversation: TestConversation = {
        id: 1,
        phone: '+2348101126131',
        status: 'closed',
        chatbotId: testChatbot.id,
        currentNode: 'welcome',
        chatbotTimeout: new Date(Date.now() + 720000),
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result, analysis, updatedConversation } = await verifyChatbotResponse(
        mockConversation, 
        message, 
        'support'
      );

      return res.status(200).json({
        step: 'option1',
        success: true,
        verification: analysis,
        chatbotTriggered: result,
        conversationBefore: mockConversation,
        conversationAfter: updatedConversation,
        message: message,
        nextStep: result ? 'Send "1" for Technical Support, "2" for Billing, "3" for General, "4" for Back' : null,
        messagesSent: analysis.newMessagesCount,
        expectedNode: 'support',
        nodeTransitionCorrect: analysis.nodeTransitionCorrect
      });
    }

    // Step 3: Test "1" response (Technical Support)
    if (step === 'option2') {
      const mockConversation: TestConversation = {
        id: 1,
        phone: '+2348101126131',
        status: 'closed',
        chatbotId: testChatbot.id,
        currentNode: 'support',
        chatbotTimeout: new Date(Date.now() + 720000),
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result, analysis, updatedConversation } = await verifyChatbotResponse(
        mockConversation, 
        message, 
        'tech_support'
      );

      return res.status(200).json({
        step: 'option2',
        success: true,
        verification: analysis,
        chatbotTriggered: result,
        conversationBefore: mockConversation,
        conversationAfter: updatedConversation,
        message: message,
        nextStep: result ? 'Send any message to complete support setup' : null,
        messagesSent: analysis.newMessagesCount,
        expectedNode: 'tech_support',
        nodeTransitionCorrect: analysis.nodeTransitionCorrect
      });
    }

    // Step 4: Test completing the support flow
    if (step === 'complete') {
      const mockConversation: TestConversation = {
        id: 1,
        phone: '+2348101126131',
        status: 'closed',
        chatbotId: testChatbot.id,
        currentNode: 'tech_support',
        chatbotTimeout: new Date(Date.now() + 720000),
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result, analysis, updatedConversation } = await verifyChatbotResponse(
        mockConversation, 
        message, 
        'support_complete'
      );

      return res.status(200).json({
        step: 'complete',
        success: true,
        verification: analysis,
        chatbotTriggered: result,
        conversationBefore: mockConversation,
        conversationAfter: updatedConversation,
        message: message,
        nextStep: result ? 'Support flow completed - user connected to live agent' : null,
        messagesSent: analysis.newMessagesCount,
        expectedNode: 'support_complete',
        nodeTransitionCorrect: analysis.nodeTransitionCorrect
      });
    }

    // Step 5: Test the complete flow in sequence with verification
    if (step === 'full-flow') {
      const results = [];
      let currentConversation: TestConversation = {
        id: 1,
        phone: '+2348101126131',
        status: 'open',
        chatbotId: null,
        currentNode: null,
        chatbotTimeout: null,
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Step 1: Start chatbot
      console.log('🧪 FULL FLOW: Step 1 - Starting chatbot');
      const { result: step1Result, analysis: step1Analysis, updatedConversation: conv1 } = await verifyChatbotResponse(
        currentConversation, 'start', 'welcome'
      );
      results.push({ 
        step: 1, 
        action: 'start', 
        result: step1Result,
        verification: step1Analysis,
        messagesSent: step1Analysis.newMessagesCount,
        nodeTransitionCorrect: step1Analysis.nodeTransitionCorrect
      });
      currentConversation = conv1;

      if (step1Result) {
        // Step 2: Choose Support
        console.log('🧪 FULL FLOW: Step 2 - Choosing Support');
        const { result: step2Result, analysis: step2Analysis, updatedConversation: conv2 } = await verifyChatbotResponse(
          currentConversation, '1', 'support'
        );
        results.push({ 
          step: 2, 
          action: '1 (Support)', 
          result: step2Result,
          verification: step2Analysis,
          messagesSent: step2Analysis.newMessagesCount,
          nodeTransitionCorrect: step2Analysis.nodeTransitionCorrect
        });
        currentConversation = conv2;

        if (step2Result) {
          // Step 3: Choose Technical Support
          console.log('🧪 FULL FLOW: Step 3 - Choosing Technical Support');
          const { result: step3Result, analysis: step3Analysis, updatedConversation: conv3 } = await verifyChatbotResponse(
            currentConversation, '1', 'tech_support'
          );
          results.push({ 
            step: 3, 
            action: '1 (Technical Support)', 
            result: step3Result,
            verification: step3Analysis,
            messagesSent: step3Analysis.newMessagesCount,
            nodeTransitionCorrect: step3Analysis.nodeTransitionCorrect
          });
          currentConversation = conv3;

          if (step3Result) {
            // Step 4: Complete support setup
            console.log('🧪 FULL FLOW: Step 4 - Completing support setup');
            const { result: step4Result, analysis: step4Analysis, updatedConversation: conv4 } = await verifyChatbotResponse(
              currentConversation, 'I need help with my account', 'support_complete'
            );
            results.push({ 
              step: 4, 
              action: 'Complete support', 
              result: step4Result,
              verification: step4Analysis,
              messagesSent: step4Analysis.newMessagesCount,
              nodeTransitionCorrect: step4Analysis.nodeTransitionCorrect
            });
            currentConversation = conv4;

            if (step4Result) {
              // Step 5: Final connection to agent
              console.log('🧪 FULL FLOW: Step 5 - Connecting to agent');
              const { result: step5Result, analysis: step5Analysis, updatedConversation: conv5 } = await verifyChatbotResponse(
                currentConversation, 'Continue', undefined
              );
              results.push({ 
                step: 5, 
                action: 'Connect to agent', 
                result: step5Result,
                verification: step5Analysis,
                messagesSent: step5Analysis.newMessagesCount,
                nodeTransitionCorrect: true // No specific node expected for final step
              });
              currentConversation = conv5;
            }
          }
        }
      }

      // Calculate comprehensive summary
      const totalMessagesSent = results.reduce((sum, r) => sum + (r.messagesSent || 0), 0);
      const correctTransitions = results.filter(r => r.nodeTransitionCorrect).length;
      const successfulSteps = results.filter(r => r.result).length;

      return res.status(200).json({
        step: 'full-flow',
        success: true,
        flowResults: results,
        summary: {
          totalSteps: results.length,
          successfulSteps,
          failedSteps: results.length - successfulSteps,
          totalMessagesSent,
          correctNodeTransitions: correctTransitions,
          transitionAccuracy: `${correctTransitions}/${results.length}`,
          finalConversationState: currentConversation
        },
        allVerifications: testResponses
      });
    }

    // Step 6: Test "bless" chatbot trigger
    if (step === 'bless-trigger') {
      // Find the bless chatbot
      const blessChatbot = await prisma.chatbot.findFirst({
        where: {
          workspaceId: 1,
          trigger: 'bless'
        }
      });

      if (!blessChatbot) {
        return res.status(404).json({
          step: 'bless-trigger',
          success: false,
          error: 'Bless chatbot not found. Make sure you created a chatbot with trigger "bless"'
        });
      }

      const mockConversation: TestConversation = {
        id: 2,
        phone: '+2348101126132',
        status: 'open',
        chatbotId: null,
        currentNode: null,
        chatbotTimeout: null,
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result, analysis, updatedConversation } = await verifyChatbotResponse(
        mockConversation, 
        message, 
        undefined // Don't specify expected node since we don't know the bless bot structure
      );

      return res.status(200).json({
        step: 'bless-trigger',
        success: true,
        verification: analysis,
        chatbotTriggered: result,
        conversationAfter: updatedConversation,
        chatbotFound: blessChatbot.name,
        nextStep: result ? 'Send "1" for good, "2" for bad, or other options' : null,
        messagesSent: analysis.newMessagesCount,
        expectedNode: undefined,
        nodeTransitionCorrect: true // Don't validate specific node for custom bots
      });
    }

    // Step 7: Test "bless" chatbot option 2 (bad)
    if (step === 'bless-option-2') {
      // Find the bless chatbot
      const blessChatbot = await prisma.chatbot.findFirst({
        where: {
          workspaceId: 1,
          trigger: 'bless'
        }
      });

      if (!blessChatbot) {
        return res.status(404).json({
          step: 'bless-option-2',
          success: false,
          error: 'Bless chatbot not found'
        });
      }

      const mockConversation: TestConversation = {
        id: 2,
        phone: '+2348101126132',
        status: 'closed',
        chatbotId: blessChatbot.id,
        currentNode: 'welcome', // Assuming first node after trigger
        chatbotTimeout: new Date(Date.now() + 720000),
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result, analysis, updatedConversation } = await verifyChatbotResponse(
        mockConversation, 
        message, 
        undefined // Don't specify expected node since we don't know the bless bot structure
      );

      return res.status(200).json({
        step: 'bless-option-2',
        success: true,
        verification: analysis,
        chatbotTriggered: result,
        conversationBefore: mockConversation,
        conversationAfter: updatedConversation,
        message: message,
        chatbotFound: blessChatbot.name,
        nextStep: result ? 'Check if image response was sent' : null,
        messagesSent: analysis.newMessagesCount,
        expectedNode: undefined,
        nodeTransitionCorrect: true
      });
    }

    // Step 8: Test complete "bless" flow
    if (step === 'bless-full-flow') {
      // Find the bless chatbot
      const blessChatbot = await prisma.chatbot.findFirst({
        where: {
          workspaceId: 1,
          trigger: 'bless'
        }
      });

      if (!blessChatbot) {
        return res.status(404).json({
          step: 'bless-full-flow',
          success: false,
          error: 'Bless chatbot not found'
        });
      }

      const results = [];
      let currentConversation: TestConversation = {
        id: 2,
        phone: '+2348101126132',
        status: 'open',
        chatbotId: null,
        currentNode: null,
        chatbotTimeout: null,
        workspaceId: 1,
        assigned: false,
        read: false,
        source: 'DIRECT',
        campaignId: null,
        widgetId: null,
        metaAdId: null,
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Step 1: Bless trigger
      console.log('🧪 BLESS FLOW: Step 1 - Bless trigger');
      const { result: step1Result, analysis: step1Analysis, updatedConversation: conv1 } = await verifyChatbotResponse(
        currentConversation, 'bless', undefined
      );
      results.push({ 
        step: 1, 
        action: 'bless trigger', 
        result: step1Result,
        verification: step1Analysis,
        messagesSent: step1Analysis.newMessagesCount,
        nodeTransitionCorrect: true
      });
      currentConversation = conv1;

      if (step1Result) {
        // Step 2: Option 2 (bad)
        console.log('🧪 BLESS FLOW: Step 2 - Option 2 (bad)');
        const { result: step2Result, analysis: step2Analysis, updatedConversation: conv2 } = await verifyChatbotResponse(
          currentConversation, '2', undefined
        );
        results.push({ 
          step: 2, 
          action: 'option 2 (bad)', 
          result: step2Result,
          verification: step2Analysis,
          messagesSent: step2Analysis.newMessagesCount,
          nodeTransitionCorrect: true
        });
        currentConversation = conv2;
      }

      // Calculate summary
      const totalMessagesSent = results.reduce((sum, r) => sum + (r.messagesSent || 0), 0);
      const successfulSteps = results.filter(r => r.result).length;

      return res.status(200).json({
        step: 'bless-full-flow',
        success: true,
        flowResults: results,
        summary: {
          totalSteps: results.length,
          successfulSteps,
          failedSteps: results.length - successfulSteps,
          totalMessagesSent,
          chatbotFound: blessChatbot.name,
          finalConversationState: currentConversation
        },
        allVerifications: testResponses
      });
    }

    // Step 9: Comprehensive verification test
    if (step === 'verify-responses') {
      // Test various user inputs to verify chatbot responds correctly
      const testCases = [
        { input: 'start', expectedNode: 'welcome', description: 'Start trigger' },
        { input: '1', expectedNode: 'support', description: 'Support option' },
        { input: '2', expectedNode: 'sales', description: 'Sales option' },
        { input: '3', expectedNode: 'information', description: 'Information option' },
        { input: 'invalid', expectedNode: undefined, description: 'Invalid input' },
        { input: '99', expectedNode: undefined, description: 'Out of range option' }
      ];

      const verificationResults = [];
      
      for (const testCase of testCases) {
        const testConversation: TestConversation = {
          id: 999,
          phone: '+2349999999999',
          status: testCase.input === 'start' ? 'open' : 'closed',
          chatbotId: testCase.input === 'start' ? null : testChatbot.id,
          currentNode: testCase.input === 'start' ? null : 'welcome',
          chatbotTimeout: testCase.input === 'start' ? null : new Date(Date.now() + 720000),
          workspaceId: 1,
          assigned: false,
          read: false,
          source: 'DIRECT',
          campaignId: null,
          widgetId: null,
          metaAdId: null,
          memberId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const { result, analysis } = await verifyChatbotResponse(
          testConversation, 
          testCase.input, 
          testCase.expectedNode || undefined
        );

        verificationResults.push({
          input: testCase.input,
          description: testCase.description,
          expectedNode: testCase.expectedNode,
          actualNode: analysis.currentNodeAfter,
          chatbotTriggered: result,
          messagesSent: analysis.newMessagesCount,
          correct: testCase.expectedNode ? analysis.nodeTransitionCorrect : !result,
          analysis
        });
      }

      return res.status(200).json({
        step: 'verify-responses',
        success: true,
        testCases: verificationResults,
        summary: {
          totalTests: verificationResults.length,
          passed: verificationResults.filter(t => t.correct).length,
          failed: verificationResults.filter(t => !t.correct).length,
          totalMessagesSent: verificationResults.reduce((sum, t) => sum + t.messagesSent, 0)
        }
      });
    }

    return res.status(400).json({ error: 'Invalid step. Use: start, option1, option2, complete, full-flow, bless-trigger, bless-option-2, bless-full-flow, or verify-responses' });

  } catch (error) {
    console.error('🧪 TEST: Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

