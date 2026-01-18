import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Save, ArrowLeft, MapPin, X } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import GooglePlacesService from '@/services/leadgen/google-places';

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
  const [templates, setTemplates] = useState<any[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const placesService = GooglePlacesService;
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
      fetchTemplates();
    }
  }, [currentWorkspace?.id]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`/api/${currentWorkspace.id}/template/get?status=APPROVED`);
      if (response.data.status === 'success') {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

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

    // Handle location autocomplete
    if (name === 'location') {
      if (value.length > 2) {
        fetchLocationSuggestions(value);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const fetchLocationSuggestions = async (input: string) => {
    if (input.length < 3) return;
    
    setSuggestionsLoading(true);
    try {
      const predictions = await placesService.getPlacePredictions(input);
      setLocationSuggestions(predictions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Show fallback message instead of hiding suggestions
      setLocationSuggestions([{
        place_id: 'fallback',
        description: 'Type location manually (autocomplete unavailable)',
        structured_formatting: {
          main_text: 'Manual Entry',
          secondary_text: 'Google Places API not configured'
        }
      }]);
      setShowSuggestions(true);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const selectLocation = (prediction: any) => {
    if (prediction.place_id === 'fallback') {
      // For fallback, just close suggestions and let user type manually
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      location: prediction.description
    }));
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  const clearLocation = () => {
    setFormData(prev => ({
      ...prev,
      location: ''
    }));
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                <div className="relative" ref={locationInputRef}>
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi, Kenya"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoComplete="off"
                  />
                  {formData.location && (
                    <button
                      type="button"
                      onClick={clearLocation}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Autocomplete Suggestions Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {suggestionsLoading ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          Loading suggestions...
                        </div>
                      ) : (
                        locationSuggestions.map((prediction, index) => (
                          <button
                            key={prediction.place_id || index}
                            type="button"
                            onClick={() => selectLocation(prediction)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                          >
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {prediction.structured_formatting?.main_text || prediction.description}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {prediction.structured_formatting?.secondary_text || prediction.description}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
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
                <select
                  name="messageTemplate"
                  value={formData.messageTemplate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a message template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.name}>
                      {template.name} ({template.status})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select an approved WhatsApp message template to send to leads
                </p>
                {templates.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No approved templates available. Please create and approve templates first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Gen Form (Optional)
                </label>
                <select
                  name="landingPageId"
                  value={formData.landingPageId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">No form</option>
                  {landingPages.map(page => (
                    <option key={page.id} value={page.id}>
                      {page.name} - /f/{page.slug}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a lead gen form to include in the message. The form link will be sent to leads.
                </p>
                {landingPages.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No lead gen forms available.{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/leadgen/forms/create')}
                      className="text-primary hover:underline"
                    >
                      Create a form
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
