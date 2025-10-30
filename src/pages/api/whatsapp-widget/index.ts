import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';
// @ts-ignore - No types available for uuid
import { v4 as uuidv4 } from 'uuid';

interface CreateWhatsAppWidgetRequest extends NextApiRequest {
  body: {
    name: string;
    phoneNumber: string;
    message: string;
    position?: 'left' | 'right';
    bottom?: number;
    backgroundColor?: string;
    textColor?: string;
    icon?: string;
    workspaceId: number | string;
  };
}

const generateWidgetScript = (widget: any) => {
  const widgetId = `whatsapp-widget-${widget.widgetCode}`;
  const script = `
    <style>
      #${widgetId} {
        position: fixed;
        ${widget.position}: 20px;
        bottom: ${widget.bottom}px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: ${widget.position === 'right' ? 'flex-end' : 'flex-start'};
        gap: 10px;
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .whatsapp-chat-bubble {
        background: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        max-width: 80%;
        position: relative;
        margin-bottom: 10px;
      }
      
      .whatsapp-chat-bubble:after {
        content: '';
        position: absolute;
        bottom: -10px;
        ${widget.position === 'right' ? 'right: 20px;' : 'left: 20px;'}
        border-width: 10px 10px 0;
        border-style: solid;
        border-color: white transparent transparent;
      }
      
      .chat-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .chat-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #25D366;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        color: white;
        font-size: 14px;
      }
      
      .chat-name {
        font-weight: 600;
        font-size: 14px;
        color: #333;
      }
      
      .chat-message {
        font-size: 13px;
        color: #555;
        line-height: 1.4;
      }
      
      .chat-time {
        font-size: 11px;
        color: #999;
        text-align: right;
        margin-top: 4px;
      }
      
      .whatsapp-button {
        display: flex;
        align-items: center;
        background: ${widget.backgroundColor};
        color: ${widget.textColor};
        padding: 12px 20px;
        border-radius: 25px;
        text-decoration: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        font-weight: 500;
      }
      
      .whatsapp-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }
      
      .whatsapp-icon {
        margin-right: 8px;
        font-size: 20px;
      }
      
      @media (max-width: 480px) {
        #${widgetId} {
          ${widget.position}: 10px;
          bottom: ${widget.bottom}px;
          max-width: 85%;
        }
        
        .whatsapp-chat-bubble {
          max-width: 90%;
        }
      }
    </style>
    
    <div id="${widgetId}">
      <div class="whatsapp-chat-bubble">
        <div class="chat-header">
          <div class="chat-avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.964-.94 1.161-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.795-1.484-1.761-1.65-2.059-.173-.297-.018-.458.13-.606.136-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.172-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.29A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.448h.005c6.554 0 11.89-5.335 11.89-11.893 0-3.18-1.261-6.17-3.553-8.415"/>
            </svg>
          </div>
          <div class="chat-name">${widget.name || 'Support'}</div>
        </div>
        <div class="chat-message">${widget.message || 'Hello! How can I help you today?'}</div>
        <div class="chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
      
      <a 
        class="whatsapp-button"
        href="https://wa.me/${widget.phoneNumber}?text=${encodeURIComponent(widget.message || 'Hello, I have a question')}" 
        target="_blank" 
        rel="noopener noreferrer"
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: ${widget.backgroundColor};
          color: ${widget.textColor};
          text-decoration: none;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        "
        onmouseover="this.style.transform='scale(1.1)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.498 14.382C17.299 14.29 15.53 13.53 15.21 13.42C14.89 13.31 14.659 13.25 14.429 13.45C14.199 13.65 13.519 14.302 13.338 14.502C13.158 14.702 12.978 14.722 12.779 14.632C12.579 14.542 11.508 14.211 10.247 13.08C9.3065 12.24 8.69699 11.181 8.517 10.981C8.237 10.681 8.427 10.56 8.607 10.38C8.76699 10.22 8.94699 9.99 9.03699 9.83C9.12699 9.67 9.16699 9.55 9.25699 9.37C9.34699 9.19 9.28699 9.04 9.19699 8.92C9.10699 8.8 8.60699 7.78 8.40699 7.34C8.20999 6.91 8.007 6.95 7.86699 6.94C7.73699 6.93 7.57699 6.93 7.41699 6.93C7.25699 6.93 6.95699 6.99 6.70699 7.28C6.45699 7.57 5.74699 8.25 5.74699 9.63C5.74699 11.01 6.68699 12.33 6.81699 12.51C6.94699 12.69 9.03699 16.09 12.049 17.5C12.919 17.92 13.629 18.1 14.199 18.23C14.999 18.4 15.719 18.37 16.289 18.29C16.929 18.2 18.119 17.53 18.319 16.8C18.529 16.07 18.529 15.46 18.439 15.33C18.349 15.2 18.179 15.13 17.998 15.04C17.818 14.95 16.918 14.51 16.718 14.42C16.518 14.33 16.388 14.38 16.288 14.47C16.188 14.56 15.708 15.05 15.588 15.15C15.468 15.25 15.348 15.27 15.168 15.18C14.988 15.09 14.048 14.8 12.918 13.83C12.098 13.12 11.548 12.2 11.428 12.02C11.318 11.84 11.438 11.75 11.548 11.65C11.648 11.55 11.768 11.41 11.858 11.3C11.948 11.19 11.998 11.11 12.088 10.97C12.178 10.83 12.128 10.71 12.058 10.61C11.988 10.51 11.518 9.52 11.338 9.07C11.168 8.63 10.988 8.7 10.858 8.69L10.138 8.67C9.99799 8.67 9.72699 8.71 9.50699 8.95C9.28699 9.18 8.66699 9.77 8.66699 11.02C8.66699 12.27 9.53699 13.44 9.65699 13.6C9.77699 13.76 11.318 16.08 13.618 17.1C14.138 17.34 14.568 17.49 14.918 17.6C15.478 17.78 15.988 17.75 16.398 17.68C16.858 17.6 17.658 17.03 17.838 16.4C17.968 15.95 17.968 15.57 17.908 15.46C17.848 15.35 17.698 15.29 17.498 15.2V14.382Z" fill="currentColor"/>
          <path d="M12 2C6.48 2 2 6.48 2 12C2 13.81 2.54 15.5 3.45 16.94L2.3 22L7.62 20.86C9.04 21.65 10.67 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.81 20 9.5 19.75 8.14 19.15L7.84 19L4.9 19.7L5.62 16.96L5.35 16.63C4.4 15.36 4 13.93 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
        </svg>
      </a>
    </div>
  `;
  return script;
};

export default withIronSessionApiRoute(
  async function handler(req: CreateWhatsAppWidgetRequest, res: NextApiResponse<ApiResponse>) {
    try {
      const { workspaceId } = req.body;
      const validatedInfo = await validateUserApi(req, Number(workspaceId));

      if (!validatedInfo) return new ServerError(res, 401, 'Unauthorized');
      
      const { user } = validatedInfo;

      if (req.method === 'POST') {
        const {
          name,
          phoneNumber,
          message,
          position = 'right',
          bottom = 20,
          backgroundColor = '#25D366',
          textColor = '#FFFFFF',
          icon = 'whatsapp',
        } = req.body;

        const widgetCode = uuidv4().replace(/-/g, '').substring(0, 12);

        const widget = await prisma.whatsAppWidget.create({
          data: {
            name,
            phoneNumber,
            message,
            position,
            bottom,
            backgroundColor,
            textColor,
            icon,
            widgetCode,
            workspaceId: Number(workspaceId),
            userId: user.id,
          },
        });

        const widgetScript = generateWidgetScript(widget);

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Widget created successfully',
          data: {
            ...widget,
            widgetScript,
          },
        });
      } else if (req.method === 'GET') {
        const widgets = await prisma.whatsAppWidget.findMany({
          where: {
            workspaceId: Number(workspaceId),
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const widgetsWithScript = widgets.map(widget => ({
          ...widget,
          widgetScript: generateWidgetScript(widget),
        }));

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Widgets retrieved successfully',
          data: widgetsWithScript
        });      } else {
        return new ServerError(res, 405, 'Method not allowed');
      }
    } catch (error: any) {
      console.error('Error in WhatsApp widget API:', error);
      return new ServerError(res, 500, error.message || 'Internal server error');
    }
  },
  sessionCookie()
);

// Add endpoint for getting a single widget by code
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
