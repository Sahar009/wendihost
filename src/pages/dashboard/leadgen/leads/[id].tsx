import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Phone, Mail, MapPin, Globe, Star, MessageSquare, FileText, Save } from 'lucide-react';
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

function LeadDetail(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (currentWorkspace?.id && id) {
      fetchLead();
    }
  }, [currentWorkspace?.id, id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/${currentWorkspace.id}/leadgen/leads/get?id=${id}`
      );
      if (response.data.status === 'success') {
        const leadData = response.data.data;
        setLead(leadData);
        setNotes(leadData.notes || '');
        setTags(leadData.tags?.join(', ') || '');
        setStatus(leadData.status);
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast.error('Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put(`/api/${currentWorkspace.id}/leadgen/leads/update`, {
        id: Number(id),
        status,
        notes,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
      });

      if (response.data.status === 'success') {
        toast.success('Lead updated successfully');
        fetchLead();
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const statuses = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'INVALID'];

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Lead not found</h3>
          <button
            onClick={() => router.push('/dashboard/leadgen/leads')}
            className="text-primary hover:underline"
          >
            Back to leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/leadgen/leads')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.businessName}</h1>
            <p className="text-gray-600 mt-1">Lead Details</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
            {lead.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {lead.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{lead.phoneNumber}</p>
                  </div>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{lead.email}</p>
                  </div>
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{lead.address}</p>
                  </div>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {lead.website}
                    </a>
                  </div>
                </div>
              )}
              {lead.rating && (
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-medium text-gray-900">
                      {lead.rating} / 5 {lead.reviewCount && `(${lead.reviewCount} reviews)`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Add notes about this lead..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Outreach History */}
          {lead.outreachLogs && lead.outreachLogs.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Outreach History
              </h2>
              <div className="space-y-3">
                {lead.outreachLogs.map((log: any) => (
                  <div key={log.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{log.messageType}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.messageContent}</p>
                    <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                      log.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Submissions */}
          {lead.formSubmissions && lead.formSubmissions.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Form Submissions
              </h2>
              <div className="space-y-3">
                {lead.formSubmissions.map((submission: any) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(submission.formData, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Tags */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Management</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

          {/* Campaign Info */}
          {lead.campaign && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign</h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{lead.campaign.name}</p>
                <button
                  onClick={() => router.push(`/dashboard/leadgen/campaigns/${lead.campaign.id}`)}
                  className="text-sm text-primary hover:underline"
                >
                  View Campaign
                </button>
              </div>
            </div>
          )}

          {/* Lead Source */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Source</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Source:</span>
                <span className="font-medium text-gray-900">{lead.source}</span>
              </div>
              {lead.businessType && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">{lead.businessType}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium text-gray-900">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <LeadDetail {...props} />
    </DashboardLayout>
  );
}
