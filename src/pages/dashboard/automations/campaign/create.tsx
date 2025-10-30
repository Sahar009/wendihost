import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import axios from 'axios';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Upload } from '@/components/utils/Upload';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { withIronSessionSsr } from 'iron-session/next';
import { Trash2, Loader2 } from 'lucide-react';
import { getCurrentWorkspace } from '@/store/slices/system';
import { DASHBOARD_ROUTES } from '@/libs/enums';


const categories = ['Utility', 'Sales', 'Marketing'];

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
interface Template {
  id: string;
  name: string;
}

const CreateCampaignPage = (props: IProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const workspace = useSelector(getCurrentWorkspace);
  
  const { data: templatesData, error, isLoading } = useSWR<Template[]>(
    workspace?.id ? `/api/${workspace.id}/template/get?page=1` : null,
    async (url: string) => {
      const response = await axios.get(url);
      return response.data.data || []; 
    }
  );
  
  const { data: chatbotsData } = useSWR<{data: Array<{id: number; name: string; trigger: string}>, status: string} | undefined>(
    workspace?.id ? `/api/${workspace.id}/chatbot/gets?page=1` : null,
    async (url: string) => {
      const response = await axios.get(url);
      return response.data;
    }
  );
  
  const templates = Array.isArray(templatesData) ? templatesData : [];
  const chatbots = chatbotsData?.data && Array.isArray(chatbotsData.data) ? chatbotsData.data : [];
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [responseTemplate, setResponseTemplate] = useState('');
  const [trigger, setTrigger] = useState('');
  const [messageType, setMessageType] = useState<'exact' | 'string'>('exact');
  const [sequences, setSequences] = useState([
    { date: '', time: '', template: '' }
  ]);

  const user = props.user ? JSON.parse(props.user) : {};
  const handleImageUpload = (results: any[]) => {
    if (results && results.length > 0) {
      setImageUrl(results[0].secure_url);
    }
  };
  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    toast.error('Failed to upload image. Please try again.');
  };
  const handleSequenceChange = (idx: number, field: string, value: string) => {
    setSequences(seqs => seqs.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const addSequence = () => {
    setSequences(seqs => [...seqs, { date: '', time: '', template: '' }]);
  };
  const removeSequence = (index: number) => {
    if (sequences.length > 1) {
      setSequences(seqs => seqs.filter((_, i) => i !== index));
    } else {
      toast.error('At least one sequence is required');
    }
  };
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id: workspaceId } = useSelector(getCurrentWorkspace);

  const validateForm = () => {
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return false;
    }
    if (!startDate) {
      toast.error('Please select a start date');
      return false;
    }
    if (!endDate) {
      toast.error('Please select an end date');
      return false;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('End date must be after start date');
      return false;
    }
    for (let i = 0; i < sequences.length; i++) {
      const seq = sequences[i];
      if (!seq.date) {
        toast.error(`Please select a date for sequence ${i + 1}`);
        return false;
      }
      if (!seq.time) {
        toast.error(`Please select a time for sequence ${i + 1}`);
        return false;
      }
      if (!seq.template) {
        toast.error(`Please select a template for sequence ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) {
      toast.error('No workspace selected');
      return;
    }
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const campaignData = {
        name,
        category,
        startDate,
        endDate,
        workspaceId,
        trigger,
        messageType,
        image: imageUrl, 
        sequences: sequences.map(seq => ({
          date: `${seq.date}T${seq.time}:00`,
          template: seq.template
        })),
        responseTemplate
      };
      const response = await fetch('/api/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Campaign created successfully!');
        router.push('/dashboard/automations/campaign');
      } else {
        throw new Error(result.message || 'Failed to create campaign');
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6 mb-6 lg:mb-8 w-full max-w-5xl mx-auto">
  <div className="mb-4 md:mb-6">
    <h2 className="font-semibold text-base sm:text-lg mb-1">Campaign Details</h2>
    <p className="text-gray-500 text-xs sm:text-sm">Set the details of the campaign such as name, time etc.</p>
  </div>
  
  <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
    <div className="w-full sm:w-48 lg:w-56 flex-shrink-0">
      <label className="block text-xs sm:text-sm font-medium mb-1">Campaign Image</label>
      <Upload
        link={imageUrl}
        accept="image/*"
        workspaceId={workspaceId}
        onUploadComplete={handleImageUpload}
        onError={handleUploadError}
       
      />
      {imageUrl && (
        <div className="mt-2 flex justify-center lg:justify-start">
          <img 
            src={imageUrl} 
            alt="Campaign" 
            className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-md"
          />
        </div>
      )}
    </div>

    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div className="space-y-1">
        <label className="text-xs sm:text-sm font-medium">Campaign name</label>
        <input 
          type="text" 
          className="w-full text-sm sm:text-base border rounded-lg px-3 py-2" 
          placeholder="e.g. sale marketing" 
          value={name} 
          onChange={e => setName(e.target.value)} 
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs sm:text-sm font-medium">Category</label>
        <select 
          className="w-full text-sm sm:text-base border rounded-lg px-3 py-2 text-gray-700"
          value={category} 
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c} className="text-sm">
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs sm:text-sm font-medium">Start date</label>
        <input 
          type="date" 
          className="w-full text-sm sm:text-base border rounded-lg px-3 py-2" 
          value={startDate} 
          onChange={e => setStartDate(e.target.value)} 
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs sm:text-sm font-medium">End date</label>
        <input 
          type="date" 
          className="w-full text-sm sm:text-base border rounded-lg px-3 py-2" 
          value={endDate} 
          onChange={e => setEndDate(e.target.value)} 
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs sm:text-sm font-medium">Response Template</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <select 
              className="w-full text-sm sm:text-base border rounded-lg px-3 py-2 disabled:opacity-75 disabled:bg-gray-50"
              value={responseTemplate} 
              onChange={e => setResponseTemplate(e.target.value)}
              disabled={isLoading || !!error}
            >
              <option value="" className="text-gray-400">
                {isLoading ? 'Loading templates...' : 'Select template'}
              </option>
              {templates.map(template => (
                <option key={template.id} value={template.id} className="text-sm">
                  {template.name}
                </option>
              ))}
            </select>
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {error && (
            <p className="text-red-500 text-xs mt-1">
              Failed to load templates. {error.message}
            </p>
          )}
          <button 
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
            onClick={() => router.push(DASHBOARD_ROUTES.TEMPLATE_BUILDER)}
          >
            + New Template
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:col-span-2"> 
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs sm:text-sm font-medium">Trigger</label>
            <div className="flex items-center">
              <input 
                id="trigger-type"
                type="checkbox" 
                className="mr-2 h-4 w-4"
                checked={!trigger}
                onChange={() => setTrigger(trigger ? '' : '/start')}
              />
              <label htmlFor="trigger-type" className="text-xs text-gray-600">
                {trigger ? 'Use text input' : 'Use chatbot trigger'}
              </label>
            </div>
          </div>
          
          {trigger ? (
            <input 
              type="text" 
              className="w-full text-sm sm:text-base border rounded-lg px-3 py-2" 
              placeholder="e.g. /start" 
              value={trigger} 
              onChange={e => setTrigger(e.target.value)}
            />
          ) : (
            <select
              className="w-full text-sm sm:text-base border rounded-lg px-3 py-2 text-gray-700"
              value={trigger}
              onChange={e => setTrigger(e.target.value)}
            >
              <option value="">Select a chatbot trigger</option>
              {chatbots?.map((bot: any) => (
                <option key={bot.id} value={bot.trigger}>
                  {bot.name} - {bot.trigger || 'No trigger'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs sm:text-sm font-medium block">Message Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`text-xs sm:text-sm px-3 py-2 rounded-lg font-medium border ${
                messageType === 'exact' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              } transition-colors`}
              onClick={() => setMessageType('exact')}
            >
              Exact Message {messageType === 'exact' && '✓'}
            </button>
            <button
              type="button"
              className={`text-xs sm:text-sm px-3 py-2 rounded-lg font-medium border ${
                messageType === 'string' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              } transition-colors`}
              onClick={() => setMessageType('string')}
            >
              String Message {messageType === 'string' && '✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
          <div className="bg-white rounded-xl shadow p-4 md:p-6 max-w-5xl mx-auto mb-8">
            <h2 className="font-semibold text-lg mb-1">Message Automation</h2>
            <p className="text-gray-500 text-sm mb-6">Set automation sequence for your messages throughout the campaign</p>
            {sequences.map((seq, idx) => (
              <div key={idx} className="mb-6 relative group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                  <h3 className="font-semibold text-base">Sequence {idx + 1}</h3>
                  {sequences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSequence(idx)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1 md:-mr-2"
                      title="Remove sequence"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium">Message Date</label>
                    <input
                      type="date"
                      className="mt-1 w-full border rounded px-3 py-2 text-gray-500 text-base"
                      value={seq.date}
                      onChange={e => handleSequenceChange(idx, 'date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message time</label>
                    <input
                      type="time"
                      className="mt-1 w-full border rounded px-3 py-2 text-gray-500 text-base"
                      value={seq.time}
                      onChange={e => handleSequenceChange(idx, 'time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Choose response template</label>
                    <div className="relative">
                      <select
                        className="w-full border rounded px-3 py-2 text-gray-500 text-base disabled:opacity-75 disabled:bg-gray-50"
                        value={seq.template}
                        onChange={e => handleSequenceChange(idx, 'template', e.target.value)}
                        disabled={isLoading || !!error}
                      >
                        <option value="" className="text-gray-500 text-sm">
                          {isLoading ? 'Loading templates...' : 'Select template'}
                        </option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id} className="text-sm">
                            {template.name}
                          </option>
                        ))}
                      </select>
                      {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold mt-2 w-full md:w-auto"
              onClick={addSequence}
            >
              Add new sequence
            </button>
          </div>
          <div className="mt-8 flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-4 max-w-5xl mx-auto">
            <button
              type="button"
              onClick={() => router.push('/dashboard/automations/campaign')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 w-full md:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateCampaignPage;