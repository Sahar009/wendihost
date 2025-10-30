import axios from 'axios';

export async function sendWhatsAppMessage(to: string, text: string, workspace: any): Promise<any> {
  const phoneId = workspace.phoneId;
  const token = workspace.accessToken; 

  if (!phoneId || !token) {
    throw new Error("Workspace WhatsApp phoneId or accessToken missing");
  }

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  // WhatsApp Cloud API expects recipient in international format without '+' or symbols
  const toNumber = String(to).replace(/[^\d]/g, '');

  const payload = {
    messaging_product: "whatsapp",
    to: toNumber,
    type: "text",
    text: { body: text }
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return res.data;
  } catch (err: any) {
    console.error("Failed to send WhatsApp message:", err?.response?.data || err);
    throw err;
  }
}

export async function sendTemplateMessage(to: string, templateName: string, workspace: any): Promise<any> {
  const phoneId = workspace.phoneId;
  const token = workspace.accessToken; 

  if (!phoneId || !token) {
    throw new Error("Workspace WhatsApp phoneId or accessToken missing");
  }

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en"
      }
    }
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return res.data;
  } catch (err: any) {
    console.error("Failed to send template message:", err?.response?.data || err);
    throw err;
  }
}
