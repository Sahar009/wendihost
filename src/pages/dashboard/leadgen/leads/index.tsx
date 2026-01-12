import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Filter, Phone, Mail, MapPin, Star, Eye, Upload } from 'lucide-react';
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

function LeadsList(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignFilter, setCampaignFilter] = useState('');

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchLeads();
      fetchCampaigns();
    }
  }, [currentWorkspace?.id, statusFilter, campaignFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (campaignFilter) params.append('campaignId', campaignFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(
        `/api/${currentWorkspace.id}/leadgen/leads/get?${params.toString()}`
      );
      if (response.data.status === 'success') {
        setLeads(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`/api/${currentWorkspace.id}/leadgen/campaigns/get`);
      if (response.data.status === 'success') {
        setCampaigns(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleSearch = () => {
    fetchLeads();
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      const response = await axios.put(`/api/${currentWorkspace.id}/leadgen/leads/update`, {
        id: leadId,
        status: newStatus,
      });

      if (response.data.status === 'success') {
        toast.success('Lead status updated');
        fetchLeads();
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      INTERESTED: 'bg-green-100 text-green-800',
      NOT_INTERESTED: 'bg-red-100 text-red-800',
      CONVERTED: 'bg-purple-100 text-purple-800',
      INVALID: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'INVALID'];

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
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track your leads</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/leadgen/scraper')}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Import Leads
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, phone, or email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600 mb-6">Start by scraping leads or importing from CSV</p>
          <button
            onClick={() => router.push('/dashboard/leadgen/scraper')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Leads Near You
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
              onClick={() => router.push(`/dashboard/leadgen/leads/${lead.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{lead.businessName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                    {lead.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{lead.phoneNumber}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                    {lead.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{lead.address}</span>
                      </div>
                    )}
                  </div>

                  {lead.rating && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{lead.rating}</span>
                      {lead.reviewCount && (
                        <span className="text-gray-500">({lead.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}

                  {lead.campaign && (
                    <div className="mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Campaign: {lead.campaign.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(lead.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/leadgen/leads/${lead.id}`);
                    }}
                    className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadsListPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <LeadsList {...props} />
    </DashboardLayout>
  );
}
