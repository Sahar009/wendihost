import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { withIronSessionSsr } from 'iron-session/next';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {

  const user = await validateUser(req)

  const data = user as any

  if (data?.redirect) return sessionRedirects(data?.redirect)

  return {
      props: {
          user: JSON.stringify(user),
      },
  }

}, sessionCookie())

interface IProps {
  user: string;
}

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';

interface Campaign {
  id: number;
  name: string;
  category: string;
  status: CampaignStatus;
  startDate: string | Date;
  endDate: string | Date;
  image?: string;
  workspaceId: number;
  workspace?: {
    id: number;
    name: string;
  };
  sequences?: Array<{
    id: number;
    date: Date;
    time: string;
    template: string;
    status: 'pending' | 'sending' | 'sent' | 'failed';
    sentAt?: Date | null;
    deliveredCount?: number;
    failedCount?: number;
    totalRecipients?: number;
  }>;
  stats?: {
    totalRecipients: number;
    messagesSent: number;
    messagesDelivered: number;
    messagesRead: number;
    messagesFailed: number;
    deliveryRate: number;
    openRate: number;
  };
}

const statusColors: Record<string, string> = {
  'draft': 'bg-gray-200 text-gray-700',
  'scheduled': 'bg-blue-100 text-blue-700',
  'active': 'bg-green-100 text-green-700',
  'paused': 'bg-yellow-100 text-yellow-700',
  'completed': 'bg-purple-100 text-purple-700',
  'failed': 'bg-red-100 text-red-700',
  'pending': 'bg-yellow-100 text-yellow-700',
  'sending': 'bg-blue-100 text-blue-700',
  'sent': 'bg-green-100 text-green-700'
} as const;

const statusLabels: Record<string, string> = {
  'draft': 'Draft',
  'scheduled': 'Scheduled',
  'active': 'Active',
  'paused': 'Paused',
  'completed': 'Completed',
  'failed': 'Failed'
};

interface CampaignCardProps {
  title: string;
  category: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  image?: string;
  onClick?: () => void;
}

const CampaignCard = ({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) => {
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNextSequence = () => {
    if (!campaign.sequences || campaign.sequences.length === 0) return null;
    const now = new Date();
    return campaign.sequences.find(seq => new Date(seq.date) >= now) || campaign.sequences[campaign.sequences.length - 1];
  };

  const nextSequence = getNextSequence();
  const status = statusLabels[campaign.status] || campaign.status;
  const statusColor = statusColors[campaign.status] || 'bg-gray-100 text-gray-700';
  
  // Calculate progress
  const totalSequences = campaign.sequences?.length || 0;
  const completedSequences = campaign.sequences?.filter(s => s.status === 'sent').length || 0;
  const progress = totalSequences > 0 ? Math.round((completedSequences / totalSequences) * 100) : 0;

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full max-w-sm flex flex-col cursor-pointer hover:shadow-md transition-all duration-200" 
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">{campaign.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {status}
            </span>
            {campaign.category && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {campaign.category}
              </span>
            )}
          </div>
        </div>
        {campaign.image ? (
          <div className="ml-3 flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden">
            <img src={campaign.image} alt={campaign.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="ml-3 flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100" />
        )}
      </div>
      
      {/* Progress bar */}
      {totalSequences > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{completedSequences} of {totalSequences} messages sent</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Next sequence */}
      {nextSequence && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Next message</span>
            <span className="font-medium text-gray-900">
              {formatDate(nextSequence.date)} at {formatTime(nextSequence.time)}
            </span>
          </div>
        </div>
      )}
      
      {/* Campaign dates */}
      <div className="mt-2 text-xs text-gray-500">
        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
      </div>
    </div>
  );
};

const CampaignAutomationPage = (props: IProps) => {
  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = props.user ? JSON.parse(props.user) : {};
  const router = useRouter();
  const workspaceId = router.query.workspaceId || user.workspaces?.[0]?.id;

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!workspaceId) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/campaign?workspaceId=${workspaceId}`);
        if (response.data.status === 'success') {
          setCampaigns(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error('Failed to load campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [workspaceId]);

  const filtered = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <h1 className="text-2xl font-bold mb-2 text-black">Campaign Automation</h1>
          <button onClick={() => router.push('/dashboard/automations/campaign/create')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition text-base mt-4 sm:mt-0">
            Create new campaign
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="Search"
            className="w-full max-w-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-blue-600 border border-blue-100">
            <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M8.25 11.25l-3-4.5M9.75 11.25l3-4.5" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All
          </button>
        </div>
        {isLoading ? (
          <div className="w-full flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 text-sm">Loading campaigns...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="w-full flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium text-lg">
                  {search ? 'No matching campaigns found' : 'No campaigns yet'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {search ? 'Try adjusting your search terms' : 'Create your first campaign to get started with automation'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => router.push(`/dashboard/automations/campaign/${campaign.id}?workspaceId=${workspaceId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CampaignAutomationPage;
