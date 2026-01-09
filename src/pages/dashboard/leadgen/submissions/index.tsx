import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Eye, Calendar, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
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

function FormSubmissions(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchSubmissions();
    }
  }, [currentWorkspace?.id]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      if (!currentWorkspace?.id) {
        toast.error('No workspace selected');
        return;
      }
      
      console.log('Current workspace:', currentWorkspace);
      console.log('Fetching submissions for workspace:', currentWorkspace.id);
      const response = await axios.get(`/api/${currentWorkspace.id}/leadgen/submissions/get`);
      console.log('Submissions response:', response.data);
      
      if (response.data.status === 'success') {
        setSubmissions(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to fetch submissions');
      }
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. You may not have access to this workspace.');
        // Try to fetch campaigns to see if it's a workspace access issue
        try {
          console.log('Testing workspace access with campaigns API...');
          const testResponse = await axios.get(`/api/${currentWorkspace.id}/leadgen/campaigns/get`);
          console.log('Campaigns test response:', testResponse.data);
          if (testResponse.data.status === 'success') {
            toast.info('Workspace access works for campaigns but not submissions. Check permissions.');
          }
        } catch (testError) {
          console.log('Campaigns API also failed:', testError);
          toast.error('No access to this workspace. Please select a different workspace.');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch form submissions');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions based on search
  const filteredSubmissions = submissions.filter(submission => {
    const query = searchQuery.toLowerCase();
    return (
      submission.landingPage?.name?.toLowerCase().includes(query) ||
      submission.landingPage?.slug?.toLowerCase().includes(query) ||
      submission.email?.toLowerCase().includes(query) ||
      submission.phoneNumber?.includes(query) ||
      Object.values(submission.formData || {}).some(value => 
        String(value).toLowerCase().includes(query)
      )
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFormDataDisplay = (formData: any) => {
    if (!formData || typeof formData !== 'object') return [];
    
    return Object.entries(formData).map(([key, value]: [string, any]) => ({
      key,
      value: String(value),
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/leadgen')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Lead Gen
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
            <p className="text-gray-600 mt-1">View all form submissions and their details</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard/leadgen/templates')}
              className=" text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Templates
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search submissions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'submission' : 'submissions'} found
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No form submissions yet</h3>
          <p className="text-gray-500 mb-6">Form submissions will appear here when users fill out your forms</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard/leadgen/templates')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Templates
            </button>
            <button
              onClick={() => router.push('/dashboard/leadgen')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ← Back to Lead Gen
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => window.open(`/f/${submission.landingPage?.slug}`, '_blank')}
                            className="text-sm font-medium text-primary hover:text-primary/80 hover:underline text-left"
                          >
                            {submission.landingPage?.name || 'Unknown Form'}
                          </button>
                          <div className="text-sm text-gray-500">
                            /f/{submission.landingPage?.slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {submission.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {submission.phoneNumber}
                            </div>
                          )}
                          {submission.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {submission.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getFormDataDisplay(submission.formData).slice(0, 3).map((field, idx) => (
                            <div key={idx} className="mb-1">
                              <span className="font-medium">{field.key}:</span> {field.value}
                            </div>
                          ))}
                          {Object.keys(submission.formData || {}).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{Object.keys(submission.formData).length - 3} more fields
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(submission.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/f/${submission.landingPage?.slug}`, '_blank')}
                            className="bg-primary text-white px-3 py-1 rounded-md text-xs hover:bg-primary/90 flex items-center gap-1"
                            title="View Template"
                          >
                            <Eye className="w-3 h-3" />
                            View Template
                          </button>
                          {submission.ipAddress && (
                            <div className="text-xs text-gray-400" title={`IP: ${submission.ipAddress}`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function FormSubmissionsPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <FormSubmissions {...props} />
    </DashboardLayout>
  );
}
