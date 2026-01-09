import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Target, Users, TrendingUp, Play, Pause, Trash2, Edit } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';

export const getServerSideProps = withIronSessionSsr(async({req, res}) => {
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

function CampaignsList(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchCampaigns();
    }
  }, [currentWorkspace?.id]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/${currentWorkspace.id}/leadgen/campaigns/get`);
      if (response.data.status === 'success') {
        setCampaigns(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId: number, newStatus: string) => {
    try {
      const response = await axios.put(`/api/${currentWorkspace.id}/leadgen/campaigns/update`, {
        id: campaignId,
        status: newStatus,
      });

      if (response.data.status === 'success') {
        toast.success(`Campaign ${newStatus.toLowerCase()}`);
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handleDelete = async (campaignId: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/${currentWorkspace.id}/leadgen/campaigns/delete?id=${campaignId}`
      );

      if (response.data.status === 'success') {
        toast.success('Campaign deleted successfully');
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.push('/dashboard/leadgen')}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Lead Gen
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your lead generation campaigns</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/leadgen/campaigns/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-6">Create your first campaign to start generating leads</p>
          <button
            onClick={() => router.push('/dashboard/leadgen/campaigns/create')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {campaign.businessType && (
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {campaign.businessType}
                        </span>
                      )}
                      {campaign.location && (
                        <span>📍 {campaign.location}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'PAUSED')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Pause campaign"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : campaign.status === 'PAUSED' || campaign.status === 'DRAFT' ? (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Activate campaign"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => router.push(`/dashboard/leadgen/campaigns/${campaign.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit campaign"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Total Leads
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{campaign.totalLeads || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">Contacted</div>
                    <div className="text-2xl font-bold text-blue-600">{campaign.contacted || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">Responded</div>
                    <div className="text-2xl font-bold text-green-600">{campaign.responded || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 text-xs mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Converted
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{campaign.converted || 0}</div>
                  </div>
                </div>

                {campaign.landingPage && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Landing Page:</span>
                      <a
                        href={`/f/${campaign.landingPage.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {campaign.landingPage.name}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignsListPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <CampaignsList {...props} />
    </DashboardLayout>
  );
}
