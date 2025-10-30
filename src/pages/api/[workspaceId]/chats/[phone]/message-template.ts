
import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from "iron-session/next";
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
import { sendTemplateMsg } from '@/services/waba/msg-templates';



export default withIronSessionApiRoute(
  async function sendMessage(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

    try {

      const { workspaceId, phone } = req.query

      const { chatId, templateId, templateName, templateComponent, parameters } = req.body

      const validatedInfo = await validateUserApi(req, Number(workspaceId))

      if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")

      const { workspace } = validatedInfo 

      // Try to send as template first
      const [success, error] = await sendTemplateMsg(workspace, String(phone), templateName, parameters)

      if (!success) {
        // If template doesn't exist in Facebook, send as regular text message
        console.log(`Template ${templateName} not found in Facebook API, sending as text message`)
        
        // Extract text content from template components
        const templateComponents = JSON.parse(templateComponent)
        let messageText = ""
        
        templateComponents.forEach((component: any) => {
          if (component.type === "BODY" && component.text) {
            messageText = component.text
            
            // Replace parameters in the text
            if (parameters && parameters.length > 0) {
              parameters.forEach((param: any, index: number) => {
                if (param.type === "body" && param.parameters) {
                  param.parameters.forEach((p: any, paramIndex: number) => {
                    const placeholder = `{{${paramIndex + 1}}}`
                    messageText = messageText.replace(placeholder, p.text || "")
                  })
                }
              })
            }
          }
        })
        
        if (messageText) {
          // Send as regular text message
          const textMessageBody = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {
              "body": messageText
            }
          }
          
          try {
            const textResponse = await fetch(`https://graph.facebook.com/v18.0/${workspace.phoneId}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${workspace.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(textMessageBody)
            })
            
            const textResult = await textResponse.json()
            
            if (textResult.error) {
              // Handle WhatsApp-specific errors
              if (textResult.error.code === 131047) {
                return new ServerError(res, 400, "Re-engagement message: The user needs to send you a message first to start the conversation.")
              } else if (textResult.error.code === 131026) {
                return new ServerError(res, 400, "Message undeliverable: The phone number may be invalid or blocked.")
              } else if (textResult.error.code === 131021) {
                return new ServerError(res, 400, "Recipient cannot be messaged: The user may have blocked your business.")
              } else if (textResult.error.code === 131037) {
                return new ServerError(res, 400, "Display name approval required: Your WhatsApp Business display name needs approval. Go to Facebook Business Manager to complete your business profile and submit for verification.")
              } else {
                return new ServerError(res, 400, `Failed to send message: ${textResult.error.message}`)
              }
            }
            
            // Update the success variable to use text message result
            const success = { id: textResult.messages[0].id }
            
            const messageRes = await prisma.message.create({
              data: {
                status: "sent", 
                message: messageText,
                conversationId: chatId,
                workspaceId: Number(workspaceId),
                templateId: templateId,
                phone: String(phone),
                type: "text", // Changed from "template" to "text"
                createdAt: new Date(),
                messageId: success.id
              }
            })

            return res.send({ 
              status: 'success', 
              statusCode: 200,
              message: "Message sent successfully as text",
              data: messageRes, 
            });
            
          } catch (textError) {
            console.error('Error sending text message:', textError)
            return new ServerError(res, 400, "Failed to send message as text")
          }
        } else {
          return new ServerError(res, 400, "Could not extract text from template")
        }
      }
    
      const messageRes = await prisma.message.create({
        data: {
          status: "sent", 
          message: templateComponent,
          conversationId: chatId,
          workspaceId: Number(workspaceId),
          templateId: templateId,
          phone: String(phone),
          type: "template",
          createdAt: new Date(),
          messageId: success.id
        }
      })

      return res.send({ 
        status: 'success', 
        statusCode: 200,
        message: "Fetch was successful",
        data: messageRes, 
      });
        
    } catch (e) {
      return new ServerError(res,  500, "Internal server error")
    }

  },
  sessionCookie(),
);

