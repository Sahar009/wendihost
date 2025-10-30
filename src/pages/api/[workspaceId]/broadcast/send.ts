
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { sendTemplateMsg } from '@/services/waba/msg-templates';
import { Contact, Workspace, Broadcast } from '@prisma/client';
import { ITemplateParameter } from '@/components/dashboard/template/TemplateVariables';



export default withIronSessionApiRoute(
  async function sendBroadcast(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId } = req.query

      const { selectedContacts, tag, templateId, templateName, templateComponent, toAll, parameters } = req.body
      
      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo
      
      let contacts = []

      if (Boolean(toAll)) {
        contacts = await prisma.contact.findMany({
          where: {
            workspaceId: Number(workspaceId)
          }
        })
      } else {
        contacts = await prisma.contact.findMany({
          where: {
            workspaceId: Number(workspaceId),
            tag: tag
          }
        })

        if (selectedContacts.length > 0) {
          const users = await prisma.contact.findMany({
            where: {
              id: { in: selectedContacts },
              workspaceId: Number(workspaceId)
            },
          });

          contacts.push(...users)
        }

      }

      const length = contacts.length

      const broadcast = await prisma.broadcast.create({
        data: {
          message: templateComponent,
          templateId: templateId,
          templateName: templateName,
          // senderUserId    Int?
          // senderUser      User? @relation(fields: [senderUserId], references: [id])
          // senderMemberId  Int?
          // sendMember      Member? @relation(fields: [senderMemberId], references: [id])
          workspaceId: Number(workspaceId),
          size: length,
          completed: 0
        }
      })

      const success = await processBroadcast(workspace, broadcast, contacts, parameters);
          
      return res.send({ 
        status: 'success', 
        statusCode: 201,
        message: "Broadcast sent successfully (" + success + "/" + length + ")",
        data: "", 
      });
        
    } catch (e) {
      console.log(e)
      return new ServerError(res,  500, "Server Error")
    }

  },
  sessionCookie(),
);


async function processBroadcast(workspace: Workspace, broadcast: Broadcast, contacts: Contact[], parameters: ITemplateParameter[]) {
  let success = 0
  for (const contact of contacts) {
    try {
      
      const finalParameters: ITemplateParameter[] = parameters.map((param) => {
        const parameters = param.parameters.map((item) => {
          const { type, text, column } = item
          const value = !column ? text : contact[column as keyof Contact];
          return { type: type, text: value?.toString() || "" };
        })
        return { type: param.type, parameters: parameters }
      })

      const [isSuccess, error] = await sendTemplateMsg(workspace, contact.phone, broadcast.templateName, finalParameters)
      if (!isSuccess) throw new Error(error)
      await prisma.broadcastJob.create({
        data: {
          broadcastId: Number(broadcast.id),
          phone: contact.phone,  
          status: "SUCCESS"
        }
      })

      let conversation = await prisma.conversation.findFirst({
        where: {
          workspaceId: workspace.id,
          phone: contact.phone
        },
        select: {
          id: true
        }
      })

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            workspaceId: workspace.id,
            phone: contact.phone,
          }
        })
      }

      await prisma.message.create({
        data: {
          conversationId: conversation?.id,
          status: "sent", 
          message: "", // TODO: Formated template message
          workspaceId: workspace.id,
          templateId: broadcast.templateId,
          phone: contact.phone,
          type: "broadcast",
          createdAt: new Date(),
          messageId: isSuccess.id
        }
      })

      success += 1
    } catch (e) {
      await prisma.broadcastJob.create({
        data: {
          broadcastId: Number(broadcast.id),
          phone: contact.phone,  
          status: "FAILED"
        }
      })
    }
  }
  return success
}
