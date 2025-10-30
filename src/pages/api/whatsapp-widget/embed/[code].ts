import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prisma';

interface EmbedRequest extends NextApiRequest {
  query: {
    code: string;
  };
}

export default async function handler(
  req: EmbedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    // Find the widget by code
    const widget = await prisma.whatsAppWidget.findUnique({
      where: {
        widgetCode: code as string,
        isActive: true,
      },
    });

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found or inactive' });
    }

    // Generate the widget HTML
    const widgetId = `whatsapp-widget-${widget.widgetCode}`;
    const bubbleId = `whatsapp-bubble-${widget.widgetCode}`;
    const toggleBtnId = `whatsapp-toggle-${widget.widgetCode}`;
    
    // Function to get the correct icon SVG based on widget.icon
    const getIconSVG = (iconType: string, size = 30) => {
      const iconSize = size;
      
      switch (iconType) {
        case 'whatsapp':
        default:
          return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white">
            <path d="M17.498 14.382C17.299 14.29 15.53 13.53 15.21 13.42C14.89 13.31 14.659 13.25 14.429 13.45C14.199 13.65 13.519 14.302 13.338 14.502C13.158 14.702 12.978 14.722 12.779 14.632C12.579 14.542 11.508 14.211 10.247 13.08C9.3065 12.24 8.69699 11.181 8.517 10.981C8.237 10.681 8.427 10.56 8.607 10.38C8.76699 10.22 8.94699 9.99 9.03699 9.83C9.12699 9.67 9.16699 9.55 9.25699 9.37C9.34699 9.19 9.28699 9.04 9.19699 8.92C9.10699 8.8 8.60699 7.78 8.40699 7.34C8.20999 6.91 8.007 6.95 7.86699 6.94C7.73699 6.93 7.57699 6.93 7.41699 6.93C7.25699 6.93 6.95699 6.99 6.70699 7.28C6.45699 7.57 5.74699 8.25 5.74699 9.63C5.74699 11.01 6.68699 12.33 6.81699 12.51C6.94699 12.69 9.03699 16.09 12.049 17.5C12.919 17.92 13.629 18.1 14.199 18.23C14.999 18.4 15.719 18.37 16.289 18.29C16.929 18.2 18.119 17.53 18.319 16.8C18.529 16.07 18.529 15.46 18.439 15.33C18.349 15.2 18.179 15.13 17.998 15.04C17.818 14.95 16.918 14.51 16.718 14.42C16.518 14.33 16.388 14.38 16.288 14.47C16.188 14.56 15.708 15.05 15.588 15.15C15.468 15.25 15.348 15.27 15.168 15.18C14.988 15.09 14.048 14.8 12.918 13.83C12.098 13.12 11.548 12.2 11.428 12.02C11.318 11.84 11.438 11.75 11.548 11.65C11.648 11.55 11.768 11.41 11.858 11.3C11.948 11.19 11.998 11.11 12.088 10.97C12.178 10.83 12.128 10.71 12.058 10.61C11.988 10.51 11.518 9.52 11.338 9.07C11.168 8.63 10.988 8.7 10.858 8.69L10.138 8.67C9.99799 8.67 9.72699 8.71 9.50699 8.95C9.28699 9.18 8.66699 9.77 8.66699 11.02C8.66699 12.27 9.53699 13.44 9.65699 13.6C9.77699 13.76 11.318 16.08 13.618 17.1C14.138 17.34 14.568 17.49 14.918 17.6C15.478 17.78 15.988 17.75 16.398 17.68C16.858 17.6 17.658 17.03 17.838 16.4C17.968 15.95 17.968 15.57 17.908 15.46C17.848 15.35 17.698 15.29 17.498 15.2V14.382Z"/>
            <path d="M12 2C6.48 2 2 6.48 2 12C2 13.81 2.54 15.5 3.45 16.94L2.3 22L7.62 20.86C9.04 21.65 10.67 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.81 20 9.5 19.75 8.14 19.15L7.84 19L4.9 19.7L5.62 16.96L5.35 16.63C4.4 15.36 4 13.93 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
          </svg>`;
        
        case 'check':
          return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>`;
        
        case 'custom':
          return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>`;
      }
    };
    
    const widgetHtml = `
      <div id="${widgetId}" style="position: fixed; ${widget.position}: 20px; bottom: ${widget.bottom}px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif;">
        <!-- Chat Bubble -->
        <div id="${bubbleId}" style="
          display: none;
          margin-bottom: 20px;
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          width: 300px;
          max-width: calc(100vw - 40px);
          position: relative;
          border: 3px solid #000;
        ">
          <!-- Speech bubble tail -->
          <div style="
            position: absolute;
            bottom: -12px;
            ${widget.position}: 30px;
            width: 20px;
            height: 20px;
            background: white;
            border-right: 3px solid #000;
            border-bottom: 3px solid #000;
            transform: rotate(45deg);
          "></div>
          
          <!-- Selected Icon -->
          <div style="
            width: 40px;
            height: 40px;
            background: ${widget.backgroundColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          ">
            ${getIconSVG(widget.icon || 'whatsapp', 24)}
          </div>
          
          <!-- Heading -->
          <h3 style="
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 16px 0;
            line-height: 1.3;
          ">Got any questions?<br>we are here to help</h3>
          
          <!-- Chat Button -->
          <a href="https://wa.me/${widget.phoneNumber}?text=${encodeURIComponent(widget.message)}" 
             target="_blank" 
             rel="noopener noreferrer"
             style="
               display: flex;
               align-items: center;
               justify-content: space-between;
               background: ${widget.backgroundColor};
               color: white;
               text-decoration: none;
               padding: 12px 20px;
               border-radius: 12px;
               font-weight: 500;
               font-size: 16px;
               transition: all 0.3s ease;
               margin-bottom: 12px;
             "
             onmouseover="this.style.transform='scale(1.02)'"
             onmouseout="this.style.transform='scale(1)'"
          >
            <span>Chat with us</span>
            <span style="font-size: 18px;">→</span>
          </a>
          
          <!-- Footer -->
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            color: #9ca3af;
            font-size: 12px;
          ">
            <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
              <path d="M2.5 13.5L13.5 2.5M13.5 2.5L10.5 2M13.5 2.5L14 5.5" stroke="#9ca3af" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            Magic by wendi.com
          </div>
        </div>
        
        <!-- Single Button Layout -->
        <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end;">
          <!-- Main Chat Button -->
          <div id="${toggleBtnId}" style="
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: ${widget.backgroundColor};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            cursor: pointer;
            transition: all 0.3s ease;
          " onclick="window.wendiToggleBubble('${bubbleId}', this)">
            ${getIconSVG(widget.icon || 'whatsapp', 30)}
          </div>
        </div>
      </div>
    `;

    // Generate the JavaScript to inject the widget
    const widgetScript = `
      (function() {
        // Check if the widget already exists
        if (!document.getElementById('${widgetId}')) {
          // Enhanced toggle function with animations
          window.wendiToggleBubble = function(bubbleId, toggleBtn) {
            const bubble = document.getElementById(bubbleId);
            const isVisible = bubble.style.display !== 'none' && bubble.style.opacity !== '0';
            
            const selectedIcon = '${getIconSVG(widget.icon || 'whatsapp', 30).replace(/'/g, "\\'")}';
            const closeIcon = '<svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            
            if (isVisible) {
              // Hide bubble with animation
              bubble.style.opacity = '0';
              bubble.style.transform = 'scale(0.8) translateY(10px)';
              setTimeout(() => {
                bubble.style.display = 'none';
              }, 300);
              toggleBtn.innerHTML = selectedIcon;
              toggleBtn.style.transform = 'rotate(0deg)';
            } else {
              // Show bubble with animation
              bubble.style.display = 'block';
              bubble.style.opacity = '0';
              bubble.style.transform = 'scale(0.8) translateY(10px)';
              
              // Force reflow
              bubble.offsetHeight;
              
              bubble.style.opacity = '1';
              bubble.style.transform = 'scale(1) translateY(0)';
              toggleBtn.innerHTML = closeIcon;
              toggleBtn.style.transform = 'rotate(180deg)';
            }
          };
          
          // Auto-hide bubble when clicking outside
          window.wendiClickOutside = function(event) {
            const widget = document.getElementById('${widgetId}');
            const bubble = document.getElementById('${bubbleId}');
            const toggleBtn = document.getElementById('${toggleBtnId}');
            
            if (widget && !widget.contains(event.target) && bubble.style.display !== 'none') {
              window.wendiToggleBubble('${bubbleId}', toggleBtn);
            }
          };
          
          // Add click outside listener
          document.addEventListener('click', window.wendiClickOutside);
          
          // Attention-grabbing wiggle animation every 10 seconds
          window.wendiWiggleButton = function() {
            const toggleBtn = document.getElementById('${toggleBtnId}');
            const bubble = document.getElementById('${bubbleId}');
            
            if (toggleBtn && bubble && bubble.style.display === 'none') {
              toggleBtn.classList.add('wendi-wiggle');
              setTimeout(() => {
                toggleBtn.classList.remove('wendi-wiggle');
              }, 500);
            }
          };
          
          // Start wiggle timer
          setInterval(window.wendiWiggleButton, 10000);
          
          // Optional: Auto-show bubble after delay (uncomment if desired)
          /*
          setTimeout(() => {
            const bubble = document.getElementById('${bubbleId}');
            const toggleBtn = document.getElementById('${toggleBtnId}');
            if (bubble && bubble.style.display === 'none') {
              window.wendiToggleBubble('${bubbleId}', toggleBtn);
            }
          }, 3000); // Show after 3 seconds
          */
          
          // Create a container for the widget
          const container = document.createElement('div');
          container.innerHTML = ${JSON.stringify(widgetHtml).replace(/</g, '\\u003c')};
          
          // Add the widget to the page
          document.body.appendChild(container.firstChild);
          
          // Add styles for the widget
          const style = document.createElement('style');
          style.textContent = \`
            #${widgetId} {
              opacity: 0;
              animation: fadeIn 0.5s ease-in-out forwards;
            }
            #${bubbleId} {
              opacity: 1;
              transform: scale(1) translateY(0);
              transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            #${toggleBtnId} {
              transition: transform 0.3s ease;
            }
            #${toggleBtnId}:hover {
              transform: scale(1.1) !important;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes wiggle {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-5deg); }
              75% { transform: rotate(5deg); }
            }
            .wendi-wiggle {
              animation: wiggle 0.5s ease-in-out;
            }
            @media (max-width: 640px) {
              #${bubbleId} {
                width: calc(100vw - 80px) !important;
                ${widget.position}: 20px !important;
              }
            }
          \`;
          document.head.appendChild(style);
        }
      })();
    `;

    // Set the content type to JavaScript
    res.setHeader('Content-Type', 'application/javascript');
    
    // Send the JavaScript
    return res.send(widgetScript);
  } catch (error) {
    console.error('Error generating widget script:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for this endpoint
  },
};
