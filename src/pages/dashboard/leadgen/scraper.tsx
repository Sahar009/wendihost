import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { Search, MapPin, Target, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'radius' || name === 'maxResults' ? Number(value) : value,
    }));
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

      const response = await axios.post(
        `/api/${currentWorkspace.id}/leadgen/scrape-places`,
        formData
      );

      if (response.data.status === 'success') {
        setResults(response.data.data);
        toast.success(response.data.message);
      }
    } catch (error: any) {
      console.error('Error scraping leads:', error);
      const errorMessage = error.response?.data?.message || 'Failed to scrape leads';
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
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Nairobi, Kenya"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
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

              <button
                onClick={() => router.push('/dashboard/leadgen/leads')}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                View All Leads
              </button>
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
