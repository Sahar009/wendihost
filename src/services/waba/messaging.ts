import axios from 'axios';
import prisma from '@/libs/prisma';

export async function sendWhatsAppTemplateMessage({
  to,
  template,
  workspaceId,
  variables = {},
}: {
  to: string;
  template: string;
  workspaceId: number;
  variables?: Record<string, string>;
}) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { whatsappId: true, accessToken: true, phoneId: true },
  });

  if (!workspace?.accessToken || !workspace.phoneId) {
    throw new Error('Workspace not configured for WhatsApp');
  }

  const url = `https://graph.facebook.com/v21.0/${workspace.phoneId}/messages`;
  
  try {
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: Object.entries(variables).map(([key, value]) => ({
                type: 'text',
                text: value,
              })),
            },
          ],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${workspace.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}