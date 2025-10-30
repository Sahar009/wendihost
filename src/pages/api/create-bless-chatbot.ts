import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';
import { CUSTOM_NODE } from '@/libs/enums';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    try {
      console.log('🗑️ Deleting existing bless chatbot...');
      
      // Delete existing bless chatbot
      const deletedChatbot = await prisma.chatbot.deleteMany({
        where: {
          workspaceId: 1,
          trigger: 'bless'
        }
      });

      console.log('✅ Deleted bless chatbots:', deletedChatbot.count);

      return res.status(200).json({
        success: true,
        message: `Deleted ${deletedChatbot.count} bless chatbot(s)`,
        deletedCount: deletedChatbot.count
      });

    } catch (error) {
      console.error('❌ Error deleting bless chatbot:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🤖 Creating Bless Chatbot...');

    // Check if bless chatbot already exists
    const existingBless = await prisma.chatbot.findFirst({
      where: {
        workspaceId: 1,
        trigger: 'bless'
      }
    });

    if (existingBless) {
      return res.status(200).json({
        success: true,
        message: 'Bless chatbot already exists',
        chatbot: existingBless
      });
    }

    // Create the bless chatbot configuration
    const blessBotConfig = {
      "start": {
        "nodeId": "start",
        "type": CUSTOM_NODE.START_NODE,
        "message": "Welcome! Please choose an option:",
        "link": null,
        "fileType": "none",
        "children": [],
        "next": "welcome",
        "needResponse": false
      },
      "welcome": {
        "nodeId": "welcome",
        "type": CUSTOM_NODE.OPTION_MESSAGE_NODE,
        "message": "How are you feeling today?\n\n1. Good\n2. Bad",
        "link": null,
        "fileType": "none",
        "children": [
          {
            "nodeId": "good_option",
            "type": CUSTOM_NODE.OPTION_NODE,
            "message": "Good",
            "link": null,
            "fileType": "none",
            "children": [],
            "next": "good_response",
            "needResponse": false
          },
          {
            "nodeId": "bad_option",
            "type": CUSTOM_NODE.OPTION_NODE,
            "message": "Bad",
            "link": null,
            "fileType": "none",
            "children": [],
            "next": "bad_response",
            "needResponse": false
          }
        ],
        "next": null,
        "needResponse": true
      },
      "good_response": {
        "nodeId": "good_response",
        "type": CUSTOM_NODE.CHAT_BOT_MSG_NODE,
        "message": "That's wonderful! I'm glad you're feeling good today. Keep up the positive energy! 🌟",
        "link": null,
        "fileType": "none",
        "children": [],
        "next": null,
        "needResponse": false
      },
      "bad_response": {
        "nodeId": "bad_response",
        "type": CUSTOM_NODE.IMAGE_NODE,
        "message": "I'm sorry you're feeling bad. Here's something that might help cheer you up!",
        "link": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        "fileType": "image",
        "children": [],
        "next": null,
        "needResponse": false
      }
    };

    // Create the bless chatbot
    const blessChatbot = await prisma.chatbot.create({
      data: {
        name: 'Bless Chatbot',
        trigger: 'bless',
        workspaceId: 1,
        bot: JSON.stringify(blessBotConfig),
        publish: true,
        default: false
      }
    });

    console.log('✅ Created Bless Chatbot with ID:', blessChatbot.id);

    return res.status(200).json({
      success: true,
      message: 'Bless chatbot created successfully',
      chatbot: blessChatbot
    });

  } catch (error) {
    console.error('❌ Error creating bless chatbot:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
