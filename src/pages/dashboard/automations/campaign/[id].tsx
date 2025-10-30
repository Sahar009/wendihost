import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { SquarePen, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Campaign {
  id: number;
  name: string;
  category: string;
  trigger?: string;
  startDate: string | Date;
  endDate: string | Date;
  image?: string;
  messageType?: string;
  responseTemplate?: string;
  sequences: Array<{
    id: number;
    date: Date;
    time: string;
    template: string;
  }>;
  workspace?: {
    id: number;
    name: string;
  };
  reach?: number;
}

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

interface CampaignDetailsProps {
  user: string;
}

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const CampaignDetailsPage = ({ user: userString }: CampaignDetailsProps) => {
  const router = useRouter();
  const { id, workspaceId } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const user = JSON.parse(userString);
  const campaignId = Array.isArray(id) ? id[0] : id;
  const workspaceIdValue = Array.isArray(workspaceId) ? workspaceId[0] : workspaceId || user.workspaces?.[0]?.id;

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId || !workspaceIdValue) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/campaign/${campaignId}?workspaceId=${workspaceIdValue}`);
        if (response.data.status === 'success') {
          setCampaign(response.data.data);
        } else {
          throw new Error('Failed to fetch campaign');
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast.error('Failed to load campaign details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId, workspaceIdValue]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`/api/campaign/${campaignId}?workspaceId=${workspaceIdValue}`);
      toast.success('Campaign deleted successfully');
      router.push(`/dashboard/automations/campaign?workspaceId=${workspaceIdValue}`);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout user={user}>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Campaign not found</h2>
            <p className="mb-4">The requested campaign could not be found.</p>
            <button
              onClick={() => router.push(`/dashboard/automations/campaign?workspaceId=${workspaceIdValue}`)}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              Back to campaigns
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-2 text-black">Campaign Details</h1>

        <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-6">   
          <div className="flex gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-gray-500 mb-1">Reach</span>
            <span className="text-2xl font-bold">{campaign.reach}</span>
          </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <button 
              onClick={() => router.push(`/dashboard/automations/campaign/${campaignId}/edit?workspaceId=${workspaceIdValue}`)}
              className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-50"
            >
              <SquarePen className="h-4 w-4"/>
              Edit Campaign
            </button>
            <span className="text-xs text-gray-400">You can only edit before the campaign start date</span>
            <button 
              onClick={() => router.push('/dashboard/automations/campaign')}
              className="text-blue-500 underline text-xs mt-2 sm:mt-0"
            >
              Back to list
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex-1">
            <h2 className="font-semibold text-lg mb-4">Details</h2>
            <div className="flex gap-6 mb-4">
              <div className="bg-gray-100 rounded-lg w-28 h-28 flex items-center justify-center text-gray-300 overflow-hidden">
                {campaign.image ? (
                  <img 
                    src={campaign.image} 
                    alt={campaign.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Campaign name</div>
                  <div className="font-medium">{campaign.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Category</div>
                  <div className="font-medium">{campaign.category}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Start Date</div>
                  <div className="font-medium">{formatDate(campaign.startDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">End date</div>
                  <div className="font-medium">{formatDate(campaign.endDate)}</div>
                </div>
                {campaign.trigger && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500">Trigger Message</div>
                    <div className="font-medium">{campaign.trigger}</div>
                  </div>
                )}
                {campaign.responseTemplate && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500">Response Template</div>
                    <div className="font-medium">{campaign.responseTemplate}</div>
                  </div>
                )}
              </div>
            </div>
            {campaign.sequences.length > 0 ? (
              campaign.sequences.map((seq, idx) => (
                <div key={seq.id || idx} className="mb-4">
                  <div className="font-semibold mb-1">Sequence {idx + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Message Date</div>
                      <div className="font-medium">{formatDate(seq.date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Message Time</div>
                      <div className="font-medium">{formatTime(seq.time)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Template</div>
                      <div className="font-medium">{seq.template}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No sequences found for this campaign.</div>
            )}
          
          </div>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-6 bg-red-50 text-red-600 px-6 py-2 rounded-lg font-medium text-small flex items-center gap-2 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Campaign
              </>
            )}
          </button>
         
        
      </div>
    </DashboardLayout>
  );
};

export default CampaignDetailsPage;
