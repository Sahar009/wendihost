import { PrismaClient, MessageStatus } from '@prisma/client';
import { sendWhatsAppMessage } from '../whatsapp';

const prisma = new PrismaClient();

interface ContactInfo {
  id: number;
  phone: string;
  name: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface SequenceWithCampaign {
  id: number;
  date: Date;
  time: string | null;
  template: string;
  status: string;
  campaignId: number;
  campaign: {
    id: number;
    workspaceId: number;
    workspace: {
      id: number;
      name: string;
    };
  };
}

export async function scheduleCampaignMessages() {
  try {
    const now = new Date();
    const sequences = await prisma.$queryRaw<SequenceWithCampaign[]>`
      SELECT s.*, 
             c.id as "campaignId",
             c."workspaceId" as "workspaceId",
             w.id as "workspace_id",
             w.name as "workspace_name"
      FROM "Sequence" s
      JOIN "Campaign" c ON s."campaignId" = c.id
      JOIN "Workspace" w ON c."workspaceId" = w.id
      WHERE s.status = 'pending'
      AND s.date <= ${now}
      ORDER BY s.date ASC
      LIMIT 100
    `;

    for (const sequence of sequences) {
      try {
        // await prisma.sequence.update({
        //     where: { id: sequence.id },
        //     data: { 
        //       status: 'sending' as const, 
        //       sentAt: new Date() 
        //     },
        //   });
        await prisma.$executeRaw`
          UPDATE "Sequence" 
          SET 
            status = 'sending',
            "sentAt" = NOW()
          WHERE id = ${sequence.id}
        `;

        const contacts = await prisma.contact.findMany({
          where: {
            workspaceId: sequence.campaign.workspaceId,
          },
          select: {
            id: true,
            phone: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        }) as unknown as ContactInfo[];

        // Process messages in batches to avoid rate limiting
        const BATCH_SIZE = 5;
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
          const batch = contacts.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async (contact) => {
              try {
                const response = await sendWhatsAppMessage(contact.phone, sequence.template, sequence.campaign.workspaceId);
                let conversation = await prisma.conversation.findFirst({
                  where: {
                    phone: contact.phone,
                    workspaceId: sequence.campaign.workspaceId
                  }
                });

                if (!conversation) {
                  conversation = await prisma.conversation.create({
                    data: {
                      phone: contact.phone,
                      workspaceId: sequence.campaign.workspaceId,
                      read: true,
                      assigned: false
                    }
                  });
                }

                // Create the message with conversationId directly
                await prisma.message.create({
                  data: {
                    messageId: response.messages?.[0]?.id || `msg_${Date.now()}`,
                    phone: contact.phone,
                    status: 'sent',
                    type: 'template',
                    templateId: sequence.template,
                    workspaceId: sequence.campaign.workspaceId,
                    conversationId: conversation.id,
                    fromCustomer: false,
                    isBot: true,
                    fileType: 'none',
                    message: `Template: ${sequence.template}`,
                    senderUserId: undefined,
                    senderMemberId: undefined
                  }
                });
              } catch (error) {
                console.error(`Error sending to ${contact.phone}:`, error);
              }
            })
          );

          if (i + BATCH_SIZE < contacts.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        await prisma.$executeRaw`
          UPDATE "Sequence"
          SET 
            status = 'sent',
            "sentAt" = NOW(),
            "updatedAt" = NOW()
          WHERE id = ${sequence.id}
        `;
      } catch (error) {
        console.error(`Error processing sequence ${sequence.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await prisma.$executeRaw`
          UPDATE "Sequence"
          SET 
            status = 'failed',
            error = ${errorMessage}
          WHERE id = ${sequence.id}
        `;
      }
    }
  } catch (error) {
    console.error('Scheduler error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}