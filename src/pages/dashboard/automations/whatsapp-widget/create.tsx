import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { MessageSquare, X, Check, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { withIronSessionSsr } from 'iron-session/next';
import { MessageCircle, MessageCircleMore, Bot } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeftIcon } from 'lucide-react';

const iconOptions = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'check', label: 'Check', icon: MessageCircleMore },
  { value: 'custom', label: 'Bot', icon: Bot },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
];

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {
  const user = await validateUser(req);

  const data = user as any;

  if (data?.redirect) return sessionRedirects(data?.redirect);

  return {
    props: {
      user: JSON.stringify(user),
    },
  };
}, sessionCookie());

interface IProps {
  user: string;
}

const CreateWidgetPage = (props: IProps) => {
  const [brandColor, setBrandColor] = useState('#40E108');
  const [bubbleText, setBubbleText] = useState('Chat with us');
  const [pagePosition, setPagePosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [chatIcon, setChatIcon] = useState('whatsapp');
  const [previewOpen, setPreviewOpen] = useState(true);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [brandName, setBrandName] = useState('Wendi');
  const [welcomeMsg, setWelcomeMsg] = useState('Hi there!\nHow can I help you?');
  const [openByDefault, setOpenByDefault] = useState(false);
  const [brandImage, setBrandImage] = useState('https://www.wendi.com/wendi-logo.svg');
  const [preFilledMsg, setPreFilledMsg] = useState('Hello, I have a question about');
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [widgetData, setWidgetData] = useState<any>(null);
  const embedCode = widgetData?.widgetScript || '';
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const user = props.user ? JSON.parse(props.user) : {};

  const [isLoading, setIsLoading] = useState(false);

  const workspaceId = user.workspaceId || 1; 

  // Function to validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,15}$/; 
    return phoneRegex.test(phone);
  };

  // Function to validate color hex code
  const validateColor = (color: string): boolean => {
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    return colorRegex.test(color);
  };

  // Function to validate required fields
  const validateForm = (): { isValid: boolean; message?: string } => {
    if (!brandName?.trim()) {
      return { isValid: false, message: 'Brand name is required' };
    }
    
    if (!phone?.trim()) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    if (!validatePhoneNumber(phone)) {
      return { isValid: false, message: 'Please enter a valid phone number (10-15 digits)' };
    }
    
    if (!brandColor || !validateColor(brandColor)) {
      return { isValid: false, message: 'Please select a valid brand color' };
    }
    
    if (!bubbleText?.trim()) {
      return { isValid: false, message: 'Chat bubble text is required' };
    }
    
    if (!welcomeMsg?.trim()) {
      return { isValid: false, message: 'Welcome message is required' };
    }
    
    return { isValid: true };
  };

  const handleCreateWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const { isValid, message } = validateForm();
    if (!isValid) {
      toast.error(message || 'Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);

    try {
      const { data } = await axios.post('/api/whatsapp-widget', {
        name: brandName.trim(),
        phoneNumber: `+234${phone.trim()}`,
        message: (preFilledMsg || welcomeMsg).trim(),
        position: pagePosition === 'bottom-right' ? 'right' : 'left',
        bottom: 20,
        backgroundColor: brandColor,
        textColor: '#FFFFFF',
        icon: chatIcon,
        workspaceId,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setWidgetData(data.data);
      setShowEmbedModal(true);
      toast.success('Widget created successfully!');
      
      // Reset form
      setEmail('');
      setPhone('');
      setBrandName('Wendi');
      setWelcomeMsg('Hi there!\nHow can I help you?');
      setPreFilledMsg('Hello, I have a question about');
      
    } catch (error: any) {
      console.error('Error creating widget:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create widget. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (codeRef.current) {
      try {
        await navigator.clipboard.writeText(codeRef.current.value);
        const copyCheck = document.getElementById('copy-check');
        if (copyCheck) {
          copyCheck.classList.remove('hidden');
          toast.success('Code copied to clipboard!');
          setTimeout(() => {
            copyCheck.classList.add('hidden');
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
        toast.error('Failed to copy code');
      }
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/automations/whatsapp-widget" className="text-sm text-gray-500 flex items-center gap-2">
            <ArrowLeftIcon className="w-30"/>  Back
          </Link>
        </div>
        <h1 className="text-xl font-bold mb-6 text-black">Create widget</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Form */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Brand widget Button */}
            <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 max-w-xl">
              <h2 className="font-semibold text-lg mb-2">Brand widget Button</h2>
              <p className="text-gray-500 text-sm mb-2">Choose color, set text and position of the chat widget</p>
              <div className="items-center gap-3 mb-2">
                <label className="text-sm font-medium">Choose brand color</label>
                <div className="flex items-center gap-2">
                  <input type="text" className="border text-gray-500 rounded px-2 py-1 w-80" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                  <input type="color" className="ml-2" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                </div>
              </div>
              <div className="mb-2">
                <label className="text-sm font-medium">Chat Bubble Text (max 24 chars)</label>
                <input type="text" maxLength={24} className="mt-1 w-80 border rounded px-3 py-2 text-gray-500" value={bubbleText} onChange={(e) => setBubbleText(e.target.value)} placeholder="Chat with us" />
              </div>
              <div className="flex gap-8 mb-2 items-end">
                {/* Page Position */}
                <div className="flex flex-col items-start gap-4">
                  <label className="text-sm font-medium text-gray-700">Page Position</label>
                  <div className="flex flex-col gap-6">
                    {/* Bottom right */}
                    <label className="flex items-center cursor-pointer group">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          pagePosition === 'bottom-right' 
                            ? 'border-blue-500 bg-white' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {pagePosition === 'bottom-right' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <input 
                          type="radio" 
                          checked={pagePosition === 'bottom-right'} 
                          onChange={() => setPagePosition('bottom-right')} 
                          className="hidden" 
                        />
                        <div className="relative w-20 h-12 bg-gray-50 border border-gray-200 rounded-lg mr-3 shadow-sm">
                          <div className="absolute w-3 h-3 bg-blue-500 rounded-sm" style={{ bottom: '6px', right: '6px' }}></div>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">Bottom right</span>
                      </div>
                    </label>
                    
                    {/* Bottom left */}
                    <label className="flex items-center cursor-pointer group">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          pagePosition === 'bottom-left' 
                            ? 'border-blue-500 bg-white' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {pagePosition === 'bottom-left' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <input 
                          type="radio" 
                          checked={pagePosition === 'bottom-left'} 
                          onChange={() => setPagePosition('bottom-left')} 
                          className="hidden" 
                        />
                        <div className="relative w-20 h-12 bg-gray-50 border border-gray-200 rounded-lg mr-3 shadow-sm">
                          <div className="absolute w-3 h-3 bg-blue-500 rounded-sm" style={{ bottom: '6px', left: '6px' }}></div>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">Bottom left</span>
                      </div>
                    </label>
                  </div>
                </div>
                {/* Chat Icon */}
                                  <div className="flex flex-col items-start gap-4 ml-8">
                  <label className="text-sm font-medium text-gray-700">Chat Icon</label>
                  <div className="flex flex-wrap gap-6 items-center">
                    {iconOptions.filter((opt) => opt.value !== 'dropdown').map((opt) => (
                      <div key={opt.value} className="flex items-center gap-3">
                        <label className="flex items-center cursor-pointer">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            chatIcon === opt.value 
                              ? 'border-blue-500 bg-white' 
                              : 'border-gray-300 bg-white'
                          }`}>
                            {chatIcon === opt.value && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            )}
                          </div>
                        <input
                          type="radio"
                          checked={chatIcon === opt.value}
                          onChange={() => setChatIcon(opt.value)}
                          className="hidden"
                        />
                        </label>
                        <div
                          className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-150 cursor-pointer ${
                            chatIcon === opt.value ? 'border-green-500' : 'border-gray-200'
                          }`}
                          style={{ background: chatIcon === opt.value ? '#25D366' : '#F5F5F5' }}
                          onClick={() => setChatIcon(opt.value)}
                        >
                          {opt.icon && React.createElement(opt.icon, { size: 24, color: '#fff' })}
                        </div>
                        {opt.value === 'custom' && (
                          <button
                            type="button"
                            className="px-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            Set custom avatar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* Right: Preview */}
          <div className="flex-1 flex flex-col items-center mt-8 md:mt-0">
            <div className="bg-white rounded-xl shadow p-8 min-w-[340px] max-w-sm mx-auto">
              <h2 className="font-semibold text-lg mb-4">Preview</h2>
              <div className="text-sm text-gray-600 mb-4">How it will appear on your website:</div>
              
              {/* Website mockup */}
              <div className="relative bg-gray-100 rounded-lg border border-gray-200 overflow-hidden" style={{ width: '300px', height: '280px' }}>
                {/* Mockup content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-32 mx-auto"></div>
                  </div>
                </div>
                
                {/* Website content placeholder */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
                
                {/* WhatsApp Widget positioned according to settings */}
                <div 
                  className="absolute" 
                    style={{
                    [pagePosition.includes('right') ? 'right' : 'left']: '12px', 
                    bottom: '12px'
                  }}
                >
                  {/* Chat Bubble - shown when preview is open */}
                  {previewOpen && (
                    <div className="mb-12 relative">
                      <div
                        className="bg-white rounded-2xl p-4 shadow-lg border-2 border-black relative"
                        style={{ width: '180px' }}
                      >
                        {/* Speech bubble tail */}
                        <div 
                          className="absolute -bottom-2 w-4 h-4 bg-white border-r-2 border-b-2 border-black transform rotate-45"
                          style={{ [pagePosition.includes('right') ? 'right' : 'left']: '16px' }}
                        ></div>
                        
                        {/* WhatsApp Icon */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                          style={{ backgroundColor: brandColor }}
                        >
                        {(() => {
                          const selectedIcon = iconOptions.find((i) => i.value === chatIcon)?.icon;
                            return selectedIcon ? React.createElement(selectedIcon, { size: 16, color: '#fff' }) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M17.498 14.382C17.299 14.29 15.53 13.53 15.21 13.42C14.89 13.31 14.659 13.25 14.429 13.45C14.199 13.65 13.519 14.302 13.338 14.502C13.158 14.702 12.978 14.722 12.779 14.632C12.579 14.542 11.508 14.211 10.247 13.08C9.3065 12.24 8.69699 11.181 8.517 10.981C8.237 10.681 8.427 10.56 8.607 10.38C8.76699 10.22 8.94699 9.99 9.03699 9.83C9.12699 9.67 9.16699 9.55 9.25699 9.37C9.34699 9.19 9.28699 9.04 9.19699 8.92C9.10699 8.8 8.60699 7.78 8.40699 7.34C8.20999 6.91 8.007 6.95 7.86699 6.94C7.73699 6.93 7.57699 6.93 7.41699 6.93C7.25699 6.93 6.95699 6.99 6.70699 7.28C6.45699 7.57 5.74699 8.25 5.74699 9.63C5.74699 11.01 6.68699 12.33 6.81699 12.51C6.94699 12.69 9.03699 16.09 12.049 17.5C12.919 17.92 13.629 18.1 14.199 18.23C14.999 18.4 15.719 18.37 16.289 18.29C16.929 18.2 18.119 17.53 18.319 16.8C18.529 16.07 18.529 15.46 18.439 15.33C18.349 15.2 18.179 15.13 17.998 15.04C17.818 14.95 16.918 14.51 16.718 14.42C16.518 14.33 16.388 14.38 16.288 14.47C16.188 14.56 15.708 15.05 15.588 15.15C15.468 15.25 15.348 15.27 15.168 15.18C14.988 15.09 14.048 14.8 12.918 13.83C12.098 13.12 11.548 12.2 11.428 12.02C11.318 11.84 11.438 11.75 11.548 11.65C11.648 11.55 11.768 11.41 11.858 11.3C11.948 11.19 11.998 11.11 12.088 10.97C12.178 10.83 12.128 10.71 12.058 10.61C11.988 10.51 11.518 9.52 11.338 9.07C11.168 8.63 10.988 8.7 10.858 8.69L10.138 8.67C9.99799 8.67 9.72699 8.71 9.50699 8.95C9.28699 9.18 8.66699 9.77 8.66699 11.02C8.66699 12.27 9.53699 13.44 9.65699 13.6C9.77699 13.76 11.318 16.08 13.618 17.1C14.138 17.34 14.568 17.49 14.918 17.6C15.478 17.78 15.988 17.75 16.398 17.68C16.858 17.6 17.658 17.03 17.838 16.4C17.968 15.95 17.968 15.57 17.908 15.46C17.848 15.35 17.698 15.29 17.498 15.2V14.382Z"/>
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 13.81 2.54 15.5 3.45 16.94L2.3 22L7.62 20.86C9.04 21.65 10.67 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.81 20 9.5 19.75 8.14 19.15L7.84 19L4.9 19.7L5.62 16.96L5.35 16.63C4.4 15.36 4 13.93 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
                              </svg>
                            );
                        })()}
                        </div>
                        
                        {/* Heading */}
                        <h3 className="text-sm font-bold text-gray-900 mb-3 leading-tight">
                          Got any questions?<br />we are here to help
                        </h3>
                        
                        {/* Chat Button */}
                      <button
                          className="w-full text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-between mb-2"
                          style={{ backgroundColor: brandColor }}
                      >
                          <span>{bubbleText || 'Chat with us'}</span>
                          <span>→</span>
                      </button>
                        
                        {/* Footer */}
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <svg width="8" height="8" fill="none" viewBox="0 0 16 16">
                            <path d="M2.5 13.5L13.5 2.5M13.5 2.5L10.5 2M13.5 2.5L14 5.5" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        Magic by wendi.com
                      </div>
                    </div>
                  </div>
                )}
                  
                  {/* Single Main Button */}
                  <div className="flex justify-end">
                  <button
                      className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer focus:outline-none transform transition-transform hover:scale-105"
                      style={{ backgroundColor: brandColor }}
                      onClick={() => setPreviewOpen(!previewOpen)}
                    >
                      {previewOpen ? (
                        <X size={20} color="#fff" />
                      ) : (
                        (() => {
                          const selectedIcon = iconOptions.find((i) => i.value === chatIcon)?.icon;
                          return selectedIcon ? React.createElement(selectedIcon, { size: 20, color: '#fff' }) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M17.498 14.382C17.299 14.29 15.53 13.53 15.21 13.42C14.89 13.31 14.659 13.25 14.429 13.45C14.199 13.65 13.519 14.302 13.338 14.502C13.158 14.702 12.978 14.722 12.779 14.632C12.579 14.542 11.508 14.211 10.247 13.08C9.3065 12.24 8.69699 11.181 8.517 10.981C8.237 10.681 8.427 10.56 8.607 10.38C8.76699 10.22 8.94699 9.99 9.03699 9.83C9.12699 9.67 9.16699 9.55 9.25699 9.37C9.34699 9.19 9.28699 9.04 9.19699 8.92C9.10699 8.8 8.60699 7.78 8.40699 7.34C8.20999 6.91 8.007 6.95 7.86699 6.94C7.73699 6.93 7.57699 6.93 7.41699 6.93C7.25699 6.93 6.95699 6.99 6.70699 7.28C6.45699 7.57 5.74699 8.25 5.74699 9.63C5.74699 11.01 6.68699 12.33 6.81699 12.51C6.94699 12.69 9.03699 16.09 12.049 17.5C12.919 17.92 13.629 18.1 14.199 18.23C14.999 18.4 15.719 18.37 16.289 18.29C16.929 18.2 18.119 17.53 18.319 16.8C18.529 16.07 18.529 15.46 18.439 15.33C18.349 15.2 18.179 15.13 17.998 15.04C17.818 14.95 16.918 14.51 16.718 14.42C16.518 14.33 16.388 14.38 16.288 14.47C16.188 14.56 15.708 15.05 15.588 15.15C15.468 15.25 15.348 15.27 15.168 15.18C14.988 15.09 14.048 14.8 12.918 13.83C12.098 13.12 11.548 12.2 11.428 12.02C11.318 11.84 11.438 11.75 11.548 11.65C11.648 11.55 11.768 11.41 11.858 11.3C11.948 11.19 11.998 11.11 12.088 10.97C12.178 10.83 12.128 10.71 12.058 10.61C11.988 10.51 11.518 9.52 11.338 9.07C11.168 8.63 10.988 8.7 10.858 8.69L10.138 8.67C9.99799 8.67 9.72699 8.71 9.50699 8.95C9.28699 9.18 8.66699 9.77 8.66699 11.02C8.66699 12.27 9.53699 13.44 9.65699 13.6C9.77699 13.76 11.318 16.08 13.618 17.1C14.138 17.34 14.568 17.49 14.918 17.6C15.478 17.78 15.988 17.75 16.398 17.68C16.858 17.6 17.658 17.03 17.838 16.4C17.968 15.95 17.968 15.57 17.908 15.46C17.848 15.35 17.698 15.29 17.498 15.2V14.382Z"/>
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 13.81 2.54 15.5 3.45 16.94L2.3 22L7.62 20.86C9.04 21.65 10.67 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.81 20 9.5 19.75 8.14 19.15L7.84 19L4.9 19.7L5.62 16.96L5.35 16.63C4.4 15.36 4 13.93 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
                            </svg>
                          );
                        })()
                      )}
                  </button>
                  </div>
                </div>
              </div>
              
              {/* Preview details */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">{pagePosition.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Color:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brandColor }}></div>
                    <span className="font-medium">{brandColor}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Message:</span>
                  <span className="font-medium text-right max-w-[150px] truncate">{bubbleText || 'Chat with us'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat settings */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 w-full">
          <h2 className="font-semibold text-lg mb-2">Chat settings</h2>
          <p className="text-gray-500 text-sm mb-2">Change your brand name, welcome text and default user message</p>
          <form onSubmit={handleCreateWidget}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input type="email" className="mt-1 w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
              </div>
              <div>
                <label className="text-sm font-medium">Brand name</label>
                <input type="text" className="mt-1 w-full border rounded px-3 py-2 text-gray-500" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Wendi" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone number</label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2 border rounded-l bg-gray-50 text-gray-600">+234</span>
                  <input type="tel" className="w-full border rounded-r px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Welcome message</label>
                <textarea className="mt-1 w-full border rounded px-3 py-2 text-gray-500" rows={2} value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} placeholder="Hi there! How can I help you?" />
              </div>
              <div>
                <label className="text-sm font-medium">Open by default</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={openByDefault} onChange={() => setOpenByDefault(true)} /> True
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={!openByDefault} onChange={() => setOpenByDefault(false)} /> False
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Brand Image url</label>
                <input type="text" className="mt-1 w-full border rounded px-3 py-2 text-gray-500" value={brandImage} onChange={(e) => setBrandImage(e.target.value)} placeholder="https://www.wendi.com/wendi-logo.svg" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Pre-filled message (optional)</label>
                <textarea className="mt-1 w-full border rounded px-3 py-2 text-gray-500" rows={2} value={preFilledMsg} onChange={(e) => setPreFilledMsg(e.target.value)} placeholder="Hello, I have a question about" />
              </div>
            </div>
            <button
              type="submit"
              className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Widget'
              )}
            </button>
          </form>
          {showEmbedModal && widgetData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={() => setShowEmbedModal(false)}>
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Your Widget is Ready!</h2>
                    <p className="text-gray-500 mt-1">Add this code to your website to display the WhatsApp widget</p>
                  </div>
                  <button
                    onClick={() => setShowEmbedModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Embed Code</label>
                    <button
                      onClick={handleCopy}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                      type="button"
                    >
                      <Check id="copy-check" size={16} className="text-green-500 hidden" />
                      <span>Copy Code</span>
                    </button>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      ref={codeRef}
                      readOnly
                      value={embedCode}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      rows={8}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      spellCheck={false}
                      style={{ lineHeight: '1.5' }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    How to use:
                  </h3>
                  <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1.5 pl-1">
                    <li>Copy the code above</li>
                    <li>Paste it just before the closing <code className="bg-blue-100 px-1 rounded text-blue-800">&lt;/body&gt;</code> tag of your website</li>
                    <li>Save and publish your changes</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmbedModal(false)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <Link
                    href="/dashboard/automations/whatsapp-widget"
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block"
                  >
                    View All Widgets
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateWidgetPage; 