import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, FileText, Eye, ExternalLink, Copy } from 'lucide-react';
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

function FormsList(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchForms();
    }
  }, [currentWorkspace?.id]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/${currentWorkspace.id}/leadgen/forms/get`);
      if (response.data.status === 'success') {
        setForms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const copyFormUrl = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
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
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages & Forms</h1>
          <p className="text-gray-600 mt-1">Create forms to capture leads from your campaigns</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/leadgen/forms/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Form
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-600 mb-6">Create your first landing page to capture leads</p>
          <button
            onClick={() => router.push('/dashboard/leadgen/forms/create')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{form.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{form.title}</p>
                    <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      /f/{form.slug}
                    </code>
                  </div>
                </div>

                {form.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{form.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">Views</div>
                    <div className="text-xl font-bold text-gray-900">{form.views || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">Submissions</div>
                    <div className="text-xl font-bold text-green-600">{form.submissions || 0}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => window.open(`/f/${form.slug}`, '_blank')}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => copyFormUrl(form.slug)}
                    className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
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

export default function FormsListPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <FormsList {...props} />
    </DashboardLayout>
  );
}
