import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { CUSTOM_NODE } from '@/libs/enums';
import { validateTrigger } from '@/libs/utils';

const initialNodes = [
    { id: "start", position: { x: 0, y: 60 }, type: CUSTOM_NODE.START_NODE, draggable: false, data: { value: '1' } },
  ];
  

export default withIronSessionApiRoute(
  async function newChatbot(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const { name, trigger, defaultBot } = req.body

      console.log('🤖 Creating chatbot with data:', { name, trigger, defaultBot, workspaceId })

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const chatTrigger = validateTrigger(trigger)

      const triggerExist = await prisma.chatbot.findFirst({
        where: {
          workspaceId: Number(workspaceId),
          trigger: chatTrigger,
        }, 
      })

      if (triggerExist) return new ServerError(res, 400, "Trigger Already exist")

      // Only check for existing default chatbot if user is trying to set this as default
      if (defaultBot) {
        const defaultExist = await prisma.chatbot.findFirst({
          where: {
            workspaceId: Number(workspaceId),
            default: true,
          }, 
        })

        if (defaultExist) {
          console.log('❌ Default chatbot already exists:', defaultExist.name)
          return new ServerError(res, 400, "You can only have one default chatbot")
        }
      }

      console.log('✅ Creating chatbot with defaultBot:', defaultBot)

      // Create basic bot configuration
      const botConfig = {
        start: {
          nodeId: "start",
          type: "TEXT_NODE",
          message: `Welcome to ${name}! This is your chatbot.`,
          needResponse: false,
          next: null,
          children: []
        }
      };

      const chatbot = await prisma.chatbot.create({
        data: {
          workspaceId: Number(workspaceId),
          name: String(name),
          nodes: JSON.stringify(initialNodes),
          bot: JSON.stringify(botConfig),
          trigger: chatTrigger,
          default: Boolean(defaultBot),
          publish: true // Auto-publish new chatbots
        }
      })

      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "Created successfully",
        data: chatbot
      });
        
    } catch (e) {
      return new ServerError(res,  400, "Bad Request")
    }

  },
  sessionCookie(),
);

