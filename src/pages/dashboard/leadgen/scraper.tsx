import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { Search, MapPin, Target, Download, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
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

function LeadScraper(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessType: '',
    location: '',
    radius: 5000,
    maxResults: 50,
  });
  const [results, setResults] = useState<any>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const placesService = GooglePlacesService;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'radius' || name === 'maxResults' ? Number(value) : value,
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
    
    console.log('Fetching suggestions for:', input);
    setSuggestionsLoading(true);
    try {
      const predictions = await placesService.getPlacePredictions(input);
      console.log('Predictions received:', predictions);
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

  const saveToContacts = async () => {
    if (!results?.leads || !currentWorkspace?.id) {
      toast.error('No results to save or workspace not selected');
      return;
    }

    setSavingContacts(true);
    try {
      const response = await axios.post('/api/leadgen/save-scraped-contacts', {
        businesses: results.leads,
        workspaceId: currentWorkspace.id,
      });

      if (response.data.status === 'success') {
        const { savedContacts, skippedContacts, totalSaved, totalSkipped } = response.data.data;
        
        toast.success(
          `Successfully saved ${totalSaved} contacts${totalSkipped > 0 ? `. Skipped ${totalSkipped} duplicates.` : ''}`
        );

        // Show detailed results if there were skipped contacts
        if (skippedContacts.length > 0) {
          console.log('Skipped contacts:', skippedContacts);
        }
      } else {
        toast.error(response.data.message || 'Failed to save contacts');
      }
    } catch (error: any) {
      console.error('Error saving contacts:', error);
      toast.error(error.response?.data?.message || 'Failed to save contacts');
    } finally {
      setSavingContacts(false);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessType || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setResults(null);

      console.log('Current workspace:', currentWorkspace);
      console.log('Form data being sent:', formData);
      console.log('API endpoint:', `/api/${currentWorkspace.id}/leadgen/scrape-places`);

      const response = await axios.post(
        `/api/${currentWorkspace.id}/leadgen/scrape-places`,
        formData
      );

      console.log('Scrape response:', response.data);

      if (response.data.status === 'success') {
        setResults(response.data.data);
        toast.success(response.data.message);
      }
    } catch (error: any) {
      console.error('Error scraping leads:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to scrape leads';
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. You may not have access to this workspace.');
        
        // Try to fetch campaigns to see if it's a workspace access issue
        try {
          console.log('Testing workspace access with campaigns API...');
          const testResponse = await axios.get(`/api/${currentWorkspace.id}/leadgen/campaigns/get`);
          console.log('Campaigns test response:', testResponse.data);
          if (testResponse.data.status === 'success') {
            toast.info('Workspace access works for campaigns but not scraping. Check permissions.');
          }
        } catch (testError) {
          console.log('Campaigns API also failed:', testError);
          toast.error('No access to this workspace. Please select a different workspace.');
        }
      } else {
        toast.error(errorMessage);
      }
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
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Scrape Leads from Google Places</h1>
        <p className="text-gray-600 mt-1">Find businesses in your target location</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraper Form */}
        <div className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleScrape} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
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
                  required
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
                Current: {(formData.radius / 1000).toFixed(1)} km
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Results
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Scraping
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              How it works
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• We search Google Places for businesses matching your criteria</li>
              <li>• Extract contact information (phone, email, address)</li>
              <li>• Save leads to your workspace automatically</li>
              <li>• Duplicate leads are automatically skipped</li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Results</h2>

          {!results && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Fill in the form and click &quot;Start Scraping&quot; to find leads</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-gray-600">Searching for businesses...</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">Leads Found</p>
                  <p className="text-2xl font-bold text-green-900">{results.count}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 mb-1">Skipped</p>
                  <p className="text-2xl font-bold text-orange-900">{results.skipped}</p>
                </div>
              </div>

              {results.skippedReasons && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">{results.skippedReasons}</p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Sample Leads</h3>
                {results.leads.slice(0, 5).map((lead: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <p className="font-medium text-gray-900">{lead.businessName}</p>
                    <p className="text-sm text-gray-600">{lead.phoneNumber}</p>
                    {lead.address && (
                      <p className="text-xs text-gray-500 mt-1">{lead.address}</p>
                    )}
                  </div>
                ))}
                {results.leads.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    + {results.leads.length - 5} more leads
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveToContacts}
                  disabled={savingContacts}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingContacts ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Save to Contacts
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push('/dashboard/leadgen/leads')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  View All Leads
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadScraperPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <LeadScraper {...props} />
    </DashboardLayout>
  );
}
