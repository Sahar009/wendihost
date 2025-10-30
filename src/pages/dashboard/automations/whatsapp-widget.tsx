import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MessageCircle } from 'lucide-react';


export const getServerSideProps = withIronSessionSsr(async({req, res}) => {
    const user = await validateUser(req);
    const data = user as any;
  
    if (data?.redirect) return sessionRedirects(data?.redirect);
    
    return { 
      props: {
        user: JSON.stringify(user),
      }, 
    };
}, sessionCookie());
  
interface IWidget {
  id: string;
  name: string;
  phoneNumber: string;
  message: string;
  position: 'left' | 'right';
  bottom: number;
  backgroundColor: string;
  textColor: string;
  icon: string;
  widgetCode: string;
  workspaceId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface IProps {
  user: string;
}

const WidgetCard = ({ widget, onEdit, onDelete }: {
  widget: IWidget;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      toast.success('Widget deleted successfully');
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast.error('Failed to delete widget');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${widget.backgroundColor}20` || '#25D36620' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={widget.backgroundColor || '#25D366'}>
                <path d="M17.498 14.382C17.299 14.29 15.53 13.53 15.21 13.42C14.89 13.31 14.659 13.25 14.429 13.45C14.199 13.65 13.519 14.302 13.338 14.502C13.158 14.702 12.978 14.722 12.779 14.632C12.579 14.542 11.508 14.211 10.247 13.08C9.3065 12.24 8.69699 11.181 8.517 10.981C8.237 10.681 8.427 10.56 8.607 10.38C8.76699 10.22 8.94699 9.99 9.03699 9.83C9.12699 9.67 9.16699 9.55 9.25699 9.37C9.34699 9.19 9.28699 9.04 9.19699 8.92C9.10699 8.8 8.60699 7.78 8.40699 7.34C8.20999 6.91 8.007 6.95 7.86699 6.94C7.73699 6.93 7.57699 6.93 7.41699 6.93C7.25699 6.93 6.95699 6.99 6.70699 7.28C6.45699 7.57 5.74699 8.25 5.74699 9.63C5.74699 11.01 6.68699 12.33 6.81699 12.51C6.94699 12.69 9.03699 16.09 12.049 17.5C12.919 17.92 13.629 18.1 14.199 18.23C14.999 18.4 15.719 18.37 16.289 18.29C16.929 18.2 18.119 17.53 18.319 16.8C18.529 16.07 18.529 15.46 18.439 15.33C18.349 15.2 18.179 15.13 17.998 15.04C17.818 14.95 16.918 14.51 16.718 14.42C16.518 14.33 16.388 14.38 16.288 14.47C16.188 14.56 15.708 15.05 15.588 15.15C15.468 15.25 15.348 15.27 15.168 15.18C14.988 15.09 14.048 14.8 12.918 13.83C12.098 13.12 11.548 12.2 11.428 12.02C11.318 11.84 11.438 11.75 11.548 11.65C11.648 11.55 11.768 11.41 11.858 11.3C11.948 11.19 11.998 11.11 12.088 10.97C12.178 10.83 12.128 10.71 12.058 10.61C11.988 10.51 11.518 9.52 11.338 9.07C11.168 8.63 10.988 8.7 10.858 8.69L10.138 8.67C9.99799 8.67 9.72699 8.71 9.50699 8.95C9.28699 9.18 8.66699 9.77 8.66699 11.02C8.66699 12.27 9.53699 13.44 9.65699 13.6C9.77699 13.76 11.318 16.08 13.618 17.1C14.138 17.34 14.568 17.49 14.918 17.6C15.478 17.78 15.988 17.75 16.398 17.68C16.858 17.6 17.658 17.03 17.838 16.4C17.968 15.95 17.968 15.57 17.908 15.46C17.848 15.35 17.698 15.29 17.498 15.2V14.382Z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12C2 13.81 2.54 15.5 3.45 16.94L2.3 22L7.62 20.86C9.04 21.65 10.67 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.81 20 9.5 19.75 8.14 19.15L7.84 19L4.9 19.7L5.62 16.96L5.35 16.63C4.4 15.36 4 13.93 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{widget.name}</h3>
              <p className="text-sm text-gray-500">+{widget.phoneNumber}</p>
            </div>
          </div>
          
          <div className="relative">
            <button
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              aria-label="Widget options"
              aria-expanded={menuOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </button>
            
            {menuOpen && (
              <div 
                className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 gap-2"
                  onClick={onEdit}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button 
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 gap-2"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Preview:</div>
          <div className="relative">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 w-3/4 ml-auto">
              <p className="text-sm text-gray-800">{widget.message || 'Hello! How can I help you?'}</p>
              <div className="text-xs text-gray-400 text-right mt-1">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                style={{ 
                  backgroundColor: `${widget.backgroundColor}10` || '#25D610',
                  color: widget.backgroundColor || '#25D366'
                }}>
            {widget.position === 'right' ? 'Right' : 'Left'} aligned
          </span>
          <div className="text-xs text-gray-500">
            Created: {new Date(widget.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const WhatsAppWidgetPage = (props: IProps) => {
  const user = props.user ? JSON.parse(props.user) : {};
  const [search, setSearch] = useState('');
  const [widgets, setWidgets] = useState<IWidget[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchWidgets = async () => {
      if (!user?.id) return;
      
      try {
        const response = await axios.get('/api/widgets');
        if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
          setWidgets(response.data.data);
        } else {
          console.error('Unexpected response format:', response.data);
          toast.error('Failed to load widgets: Invalid response format');
          setWidgets([]);
        }
      } catch (error) {
        console.error('Error fetching widgets:', error);
        toast.error('Failed to fetch widgets');
      }
    };
    
    fetchWidgets();
  }, [user?.id]);

  const filteredWidgets = widgets.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteWidget = async (widgetId: string) => {
    try {
      console.log('Starting delete for widget:', widgetId);
      
      const widgetToDelete = widgets.find(w => w.id === widgetId);
      if (!widgetToDelete) {
        const errorMsg = `Widget with ID ${widgetId} not found in local state`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Get workspaceId from the widget data or fallback to user's first workspace
      const workspaceId = widgetToDelete.workspaceId || user.workspaces?.[0]?.id;
      console.log('Using workspaceId:', workspaceId);
      
      if (!workspaceId) {
        const errorMsg = 'No workspace found for this widget';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        const response = await fetch(`/api/whatsapp-widget/${widgetId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ workspaceId: Number(workspaceId) }),
        });

        let data = null;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
            console.log('Delete response data:', data);
          } catch (jsonError) {
            console.warn('Failed to parse JSON response:', jsonError);
          }
        }

        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
          const errorData = data || { message: response.statusText };
          throw new Error(
            `API Error: ${response.status} - ${errorData.message || 'Unknown error'}`
          );
        }
        
        setWidgets(widgets.filter(w => w.id !== widgetId));
        return true;
      } catch (error: any) {
        console.error('Error in DELETE request:', {
          message: error.message,
          status: error.status,
        });
        throw error;
      }
    } catch (error) {
      console.error('Error deleting widget:', error);
      throw error;
    }
  };

  const handleEditWidget = (widgetId: string) => {
    router.push(`/dashboard/automations/whatsapp-widget/edit/${widgetId}`);
  };

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">WhatsApp Widgets</h1>
            <div className="relative max-w-xs">
              <input
                type="text"
                placeholder="Search widgets..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg
                className="absolute right-3 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-lg transition text-sm sm:text-base whitespace-nowrap"
            onClick={() => router.push('/dashboard/automations/whatsapp-widget/create')}
          >
            + Create New Widget
          </button>
        </div>
        {filteredWidgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-100 p-8">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <MessageCircle size={48} className="text-green-600" />
            </div>
          
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">No WhatsApp Widgets Yet</h2>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              Create your first WhatsApp widget to start engaging with your customers. Add a floating chat button to your website and connect directly with visitors.
            </p>
            
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
              onClick={() => router.push('/dashboard/automations/whatsapp-widget/create')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWidgets.map(widget => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                onEdit={() => router.push(`/dashboard/automations/whatsapp-widget/edit/${widget.id}?workspaceId=${widget.workspaceId}`)}
                onDelete={() => deleteWidget(widget.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppWidgetPage; 