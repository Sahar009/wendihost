import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Eye, Copy, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

function MyTemplates(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2x3 grid for better pagination visibility

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchTemplates();
    }
  }, [currentWorkspace?.id]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/${currentWorkspace.id}/leadgen/forms/get`);
      if (response.data.status === 'success') {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyFormUrl = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      setDeleting(id);
      const response = await axios.delete(`/api/${currentWorkspace.id}/leadgen/forms/delete?id=${id}`);
      
      if (response.data.status === 'success') {
        toast.success('Template deleted successfully');
        fetchTemplates();
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleting(null);
    }
  };

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => {
    const query = searchQuery.toLowerCase();
    return (
      template.name?.toLowerCase().includes(query) ||
      template.slug?.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.title?.toLowerCase().includes(query)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/leadgen/templates')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Templates
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Templates</h1>
            <p className="text-gray-600 mt-1">Manage your custom web templates</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/leadgen/templates/create')}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600 ml-4">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
            {totalPages > 1 && (
              <span className="ml-2">
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">Create your first custom web template to get started</p>
          <button
            onClick={() => router.push('/dashboard/leadgen/templates/create')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Template
          </button>
        </div>
      ) : filteredTemplates.length === 0 && searchQuery ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">No templates match your search for &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTemplates.map((template) => (
            <div 
              key={template.id} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group"
            >
              {/* Template Preview Thumbnail */}
              <div className="relative h-48 overflow-hidden">
                {template.logoUrl || template.imageUrl ? (
                  <img
                    src={template.logoUrl || template.imageUrl}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full ${template.logoUrl || template.imageUrl ? 'hidden' : 'block'} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}>
                  <div className="text-center p-6">
                    <div className="text-4xl font-bold text-gray-400 mb-2">
                      {template.name.charAt(0)}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {template.formFields?.length || 0} fields
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
                
                {/* Quick Actions Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/f/${template.slug}`, '_blank');
                      }}
                      className="flex-1 px-2 py-1.5 bg-white/90 hover:bg-white text-gray-900 rounded text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyFormUrl(template.slug);
                      }}
                      className="flex-1 px-2 py-1.5 bg-white/90 hover:bg-white text-gray-900 rounded text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{template.name}</h3>
                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded block">
                      /f/{template.slug}
                    </code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Views</div>
                    <div className="text-lg font-bold text-gray-900">{template.views || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Submissions</div>
                    <div className="text-lg font-bold text-green-600">{template.submissions || 0}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/leadgen/templates/${template.id}`)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    disabled={deleting === template.id}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {deleting === template.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Show current page, first, last, and pages around current
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 || 
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyTemplatesPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <MyTemplates {...props} />
    </DashboardLayout>
  );
}
