import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionCookie, validateUserApi } from '@/services/session';
import prisma from '@/libs/prisma';
import { ApiResponse } from '@/libs/types';
import ServerError from '@/services/errors/serverError';

interface WidgetRequest extends Omit<NextApiRequest, 'query' | 'body'> {
  query: NextApiRequest['query'] & {
    id: string;
    workspaceId?: string;
  };
  body: {
    name?: string;
    phoneNumber?: string;
    message?: string;
    position?: 'left' | 'right';
    bottom?: number;
    backgroundColor?: string;
    textColor?: string;
    icon?: string;
    isActive?: boolean;
    workspaceId: number | string;
  };
}

const generateWidgetScript = (widget: any) => {
  const widgetId = `whatsapp-widget-${widget.widgetCode}`;
  return `
    <div id="${widgetId}" style="position: fixed; ${widget.position}: 20px; bottom: ${widget.bottom}px; z-index: 9999; cursor: pointer;">
      <a 
        href="https://wa.me/${widget.phoneNumber}?text=${encodeURIComponent(widget.message)}" 
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
};

const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const widgetReq = req as unknown as WidgetRequest;
    try {
      const { id } = widgetReq.query;
      
      if (widgetReq.method === 'DELETE') {
        try {
          const { workspaceId } = widgetReq.body;
          console.log('DELETE request with workspaceId:', workspaceId);
          
          if (!workspaceId) {
            console.error('No workspaceId provided in request body');
            return res.status(400).json({ 
              status: 'failed', 
              statusCode: 400,
              message: 'workspaceId is required in the request body',
              data: null
            });
          }
          
          const validation = await validateUserApi(widgetReq, Number(workspaceId));
          if (!validation) {
            console.error('User validation failed');
            return res.status(401).json({ 
              status: 'failed', 
              statusCode: 401,
              message: 'Unauthorized',
              data: null 
            });
          }
          
          const { user } = validation;
          console.log('User validated:', user.id);
          
          const deletedWidget = await prisma.whatsAppWidget.delete({
            where: {
              id: id as string
            }
          });
          
          console.log('Widget deleted:', deletedWidget.id);
          
          return res.status(200).json({ 
            status: 'success', 
            statusCode: 200,
            message: 'Widget deleted successfully',
            data: { id: deletedWidget.id }
          });
          
        } catch (error: any) {
          console.error('Error deleting widget:', error);
          const status = error.code === 'P2025' ? 404 : 500;
          return res.status(status).json({
            status: 'failed',
            statusCode: status,
            message: error.message || 'Failed to delete widget',
            data: null
          });
        }
      }
      
      const workspaceId = req.query.workspaceId;
      if (!workspaceId) {
        return new ServerError(res, 400, 'workspaceId is required in query params');
      }
      
       const validatedInfo = await validateUserApi(req, Number(workspaceId))
          
                  if (!validatedInfo) return new ServerError(res, 401, "Unauthorized")
          
                  const { user } = validatedInfo 

      if (req.method === 'GET') {
        // Use findFirst to avoid requiring a composite unique on (id, workspaceId)
        const widget = await prisma.whatsAppWidget.findFirst({
          where: {
            id: id as string,
            workspaceId: Number(workspaceId),
          },
        });

        if (!widget) {
          // Check if widget exists under a different workspace to return a clearer error
          const widgetById = await prisma.whatsAppWidget.findUnique({
            where: { id: id as string },
          });

          if (widgetById) {
            return new ServerError(
              res,
              401,
              'You do not have access to this widget (different workspace)'
            );
          }

          return new ServerError(res, 404, 'Widget not found');
        }

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Widget retrieved successfully',
          data: {
            ...widget,
            widgetScript: generateWidgetScript(widget),
          },
        });
      } else if (req.method === 'PUT') {
        const {
          name,
          phoneNumber,
          message,
          position,
          bottom,
          backgroundColor,
          textColor,
          icon,
          isActive,
        } = req.body;

        // Ensure the widget exists and belongs to the provided workspace
        const existing = await prisma.whatsAppWidget.findUnique({
          where: { id: id as string },
        });

        if (!existing) {
          return new ServerError(res, 404, 'Widget not found');
        }

        if (existing.workspaceId !== Number(workspaceId)) {
          return new ServerError(res, 401, 'You do not have access to this widget (different workspace)');
        }

        const updatedWidget = await prisma.whatsAppWidget.update({
          where: { id: id as string },
          data: {
            ...(name && { name }),
            ...(phoneNumber && { phoneNumber }),
            ...(message && { message }),
            ...(position && { position }),
            ...(bottom !== undefined && { bottom }),
            ...(backgroundColor && { backgroundColor }),
            ...(textColor && { textColor }),
            ...(icon && { icon }),
            ...(isActive !== undefined && { isActive }),
          },
        });

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Widget updated successfully',
          data: {
            ...updatedWidget,
            widgetScript: generateWidgetScript(updatedWidget),
          },
        });

      } else {
        return new ServerError(res, 405, 'Method not allowed');
      }
    } catch (error: any) {
      console.error('Error in WhatsApp widget API:', error);
      return new ServerError(res, 500, error.message || 'Internal server error');
    }
};

export default withIronSessionApiRoute(handler, sessionCookie());

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
