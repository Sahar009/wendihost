import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Eye, Copy, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';

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

interface IProps {
  user: string;
}

function EditTemplate(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    primaryColor: '#4F46E5',
    backgroundColor: '#ffffff',
    submitButtonText: 'Submit',
    thankYouMessage: 'Thank you for your submission!',
    whatsappTemplate: '',
  });

  useEffect(() => {
    if (currentWorkspace?.id && id) {
      fetchTemplate();
      fetchTemplates();
    }
  }, [currentWorkspace?.id, id]);

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

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/${currentWorkspace.id}/leadgen/forms/get?id=${id}`
      );
      if (response.data.status === 'success') {
        const data = response.data.data;
        setTemplate(data);
        setFormData({
          name: data.name,
          title: data.title,
          description: data.description || '',
          primaryColor: data.primaryColor || '#4F46E5',
          backgroundColor: data.backgroundColor || '#ffffff',
          submitButtonText: data.submitButtonText || 'Submit',
          thankYouMessage: data.thankYouMessage || 'Thank you for your submission!',
          whatsappTemplate: data.whatsappTemplate || '',
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put(
        `/api/${currentWorkspace.id}/leadgen/forms/update`,
        {
          id: Number(id),
          ...formData,
        }
      );

      if (response.data.status === 'success') {
        toast.success('Template updated successfully');
        fetchTemplate();
      }
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error(error.response?.data?.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const copyFormUrl = () => {
    if (template?.slug) {
      const url = `${window.location.origin}/f/${template.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('Form URL copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Template not found</h3>
          <button
            onClick={() => router.push('/dashboard/leadgen/templates')}
            className="text-primary hover:underline"
          >
            Back to templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/leadgen/templates')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
            <p className="text-gray-600 mt-1">Customize your web template</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/f/${template.slug}`, '_blank')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={copyFormUrl}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy URL
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Styling</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submit Button Text
                </label>
                <input
                  type="text"
                  name="submitButtonText"
                  value={formData.submitButtonText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thank You Message
                </label>
                <textarea
                  name="thankYouMessage"
                  value={formData.thankYouMessage}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Auto-Reply Template
                </label>
                <select
                  name="whatsappTemplate"
                  value={formData.whatsappTemplate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">No auto-reply (or use default: hello_world)</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a WhatsApp template to automatically send when someone submits this form
                </p>
                {templates.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No approved templates available. Create templates in Settings → Templates.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Template Info & Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Info</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Form URL:</span>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded">
                    {window.location.origin}/f/{template.slug}
                  </code>
                  <button
                    onClick={copyFormUrl}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-600 text-sm mb-1">Total Views</div>
                <div className="text-3xl font-bold text-gray-900">{template.views || 0}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-gray-600 text-sm mb-1">Submissions</div>
                <div className="text-3xl font-bold text-green-600">{template.submissions || 0}</div>
              </div>
            </div>
            {template.views > 0 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">Conversion Rate: </span>
                <span className="text-lg font-semibold text-primary">
                  {((template.submissions / template.views) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Fields</h2>
            <div className="space-y-2">
              {template.formFields?.map((field: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{field.label}</span>
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {field.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditTemplatePage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <EditTemplate {...props} />
    </DashboardLayout>
  );
}
