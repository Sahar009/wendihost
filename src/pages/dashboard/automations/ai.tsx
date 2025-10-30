import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';

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

interface AssistantItem {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'Inactive': 'bg-gray-200 text-gray-700',
} as const;

const toStatusColor = (status: string) => (status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700');

interface AIBotCardProps {
  id: number;
  name: string;
  type: string;
  status: keyof typeof statusColors;
  created: string;
  updated: string;
  onClick?: () => void;
}

const AIBotCard = ({ id, name, type, status, created, updated, onClick }: AIBotCardProps) => {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { id: workspaceId } = useSelector(getCurrentWorkspace);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    router.push(`/dashboard/automations/ai/${id}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (confirm('Are you sure you want to delete this AI bot? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/${workspaceId}/ai/assistant/${id}`);
        // Trigger a refresh of the list in the parent
        if (onClick) onClick();
      } catch (error) {
        console.error('Error deleting AI bot:', error);
        alert('Failed to delete AI bot. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-xl min-h-[280px] flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300 relative group" onClick={onClick} style={{ minWidth: '320px' }}>
      <div className="absolute right-2 top-2" ref={menuRef}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded-xl bg-white hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            <button
              onClick={handleEdit}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
      
      <div 
        className="bg-cover bg-center bg-no-repeat rounded-xl h-28 mb-3" 
        style={{ backgroundImage: 'url(/images/ai-automation.png)' }}
      />
      <div className="font-semibold text-lg mb-2">{name}</div>
      <div className="text-sm text-gray-600 mb-2">
        <div className="capitalize">{type || 'General'}</div>
      </div>
      <div className="text-xs text-gray-400 mt-auto">
        <div>Created: {created}</div>
        {updated && <div>Updated: {updated}</div>}
      </div>
    </div>
  );
};

const AIAutomationPage = (props: IProps) => {
  const router = useRouter();
  const user = props.user ? JSON.parse(props.user) : {};
  const { id: workspaceId } = useSelector(getCurrentWorkspace);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [items, setItems] = useState<AssistantItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssistants = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/${workspaceId}/ai/assistant`);
      const data = (res?.data?.data || []) as any[];
      setItems(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          status: d.status,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, [workspaceId]);

  const handleDelete = async (id: number) => {
    if (!workspaceId) return;
    if (!confirm('Delete this assistant?')) return;
    await axios.delete(`/api/${workspaceId}/ai/${id}`);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const filteredBots = items.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bot.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <h1 className="text-2xl font-bold mb-2 text-black">AI Automation</h1>
          <button 
            onClick={() => router.push('/dashboard/automations/ai/create')} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition text-base mt-4 sm:mt-0 flex items-center gap-2"
          >
            <Plus size={18} />
            New AI Bot
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="Search AI Bots..."
            className="w-full max-w-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Bots</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredBots.length} of {items.length} bots
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : filteredBots.length > 0 ? (
            filteredBots.map((bot) => (
            
              <div key={bot.id} className="relative">
                <AIBotCard 
                  id={bot.id}
                  name={bot.name}
                  type={''}
                  status={toStatusColor(bot.status) as any}
                  created={new Date(bot.createdAt).toLocaleDateString()}
                  updated={new Date(bot.updatedAt).toLocaleDateString()}
                  
                  onClick={() => router.push(`/dashboard/automations/ai/${bot.id}/edit`)}
                />
                {/* <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(bot.id); }}
                  className="absolute -right-2 -top-2 bg-white border border-gray-200 rounded-full p-1 shadow"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button> */}
              </div>
            ))
          ) : (
            <div className="w-full text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="flex flex-col items-center">
                <img 
                  src="/images/ai-automation.png" 
                  alt="AI Automation" 
                  className="w-35 h-35 mb-4 opacity-60"
                />
                <h3 className="text-lg font-medium text-gray-900">No AI Bots found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or create a new AI bot</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAutomationPage;
