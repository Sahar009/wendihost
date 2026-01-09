import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Save, ArrowLeft } from 'lucide-react';
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

function CreateCampaign(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    businessType: '',
    location: '',
    radius: 5000,
    maxResults: 50,
    messageTemplate: '',
    landingPageId: '',
  });

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchLandingPages();
    }
  }, [currentWorkspace?.id]);

  const fetchLandingPages = async () => {
    try {
      const response = await axios.get(`/api/${currentWorkspace.id}/leadgen/forms/get`);
      if (response.data.status === 'success') {
        setLandingPages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'radius' || name === 'maxResults' || name === 'landingPageId' 
        ? (value ? Number(value) : '') 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Campaign name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `/api/${currentWorkspace.id}/leadgen/campaigns/create`,
        {
          ...formData,
          landingPageId: formData.landingPageId || null,
        }
      );

      if (response.data.status === 'success') {
        toast.success('Campaign created successfully');
        router.push('/dashboard/leadgen/campaigns');
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create campaign';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    'restaurant',
    'cafe',
    'gym',
    'salon',
    'spa',
    'hotel',
    'retail_store',
    'pharmacy',
    'dentist',
    'doctor',
    'lawyer',
    'accountant',
    'real_estate_agency',
    'car_dealer',
    'plumber',
    'electrician',
    'contractor',
  ];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
        <p className="text-gray-600 mt-1">Set up a new lead generation campaign</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Lagos Restaurant Outreach"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe your campaign goals and target audience"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select type (optional)</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Nairobi, Kenya"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Radius (meters)
                </label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  min="1000"
                  max="50000"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.radius / 1000).toFixed(1)} km radius
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Results
                </label>
                <input
                  type="number"
                  name="maxResults"
                  value={formData.maxResults}
                  onChange={handleChange}
                  min="10"
                  max="100"
                  step="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Campaign Settings */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Message Template
                </label>
                <textarea
                  name="messageTemplate"
                  value={formData.messageTemplate}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Hi {name}, we noticed your business and would love to connect..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{name}'} for business name placeholder
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landing Page (Optional)
                </label>
                <select
                  name="landingPageId"
                  value={formData.landingPageId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">No landing page</option>
                  {landingPages.map(page => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
                {landingPages.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No landing pages available.{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/leadgen/forms/create')}
                      className="text-primary hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CreateCampaignPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <CreateCampaign {...props} />
    </DashboardLayout>
  );
}
