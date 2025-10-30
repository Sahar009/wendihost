import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { ArrowLeft, Save, Trash2, Edit } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { Plus } from 'lucide-react';
import { FileText } from 'lucide-react';
import { toast } from 'react-toastify';

export const getServerSideProps = withIronSessionSsr(async ({ req, res, params }) => {
  const user = await validateUser(req);
  const data = user as any;

  if (data?.redirect) return sessionRedirects(data?.redirect);

  return {
    props: {
      user: JSON.stringify(user),
      botId: params?.id || null,
    },
  };
}, sessionCookie());

interface IProps {
  user: string;
  botId: string;
}

export default function EditAIBotPage({ user: userString, botId }: IProps) {
  const router = useRouter();
  const user = userString ? JSON.parse(userString) : {};
  const { id: workspaceId } = useSelector(getCurrentWorkspace);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [knowledgeText, setKnowledgeText] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const res = await axios.get(`/api/${workspaceId}/ai/${botId}`);
        if (res.data.status === 'success') {
          const bot = res.data.data;
          setFormData({
            name: bot.name,
            description: bot.description || '',
            status: bot.status,
          });
          if (bot.knowledge) {
            setKnowledgeText(bot.knowledge.text || '');
            setUploadedDocs(bot.knowledge.documents || []);
          }
        } else {
          console.error('Failed to fetch bot:', res.data.message);
        }
      } catch (error) {
        console.error('Error fetching bot:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId && botId) {
      fetchBot();
    }
  }, [workspaceId, botId]);

  const extractTextFromDocuments = async (documents: any[]): Promise<string[]> => {
    const extractedTexts: string[] = [];
    
    for (const doc of documents) {
      try {
        console.log('📄 EXTRACTING TEXT: Processing document...', {
          filename: doc.filename,
          type: doc.type,
          url: doc.url
        });
        
        const response = await axios.post(`/api/${workspaceId}/ai/extract-document-text`, {
          documentUrl: doc.url,
          fileType: doc.type
        });
        
        if (response.data?.data?.extractedText) {
          extractedTexts.push(response.data.data.extractedText);
          console.log(`📄 EXTRACTING TEXT: Successfully extracted ${response.data.data.textLength} characters from ${doc.filename}`);
        }
      } catch (error) {
        console.error(`📄 EXTRACTING TEXT: Error processing ${doc.filename}:`, error);
        // Continue with other documents even if one fails
        extractedTexts.push(`[Error extracting text from ${doc.filename}]`);
      }
    }
    
    return extractedTexts;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadKnowledgeChunks = async (assistantId: number, text: string) => {
    try {
      console.log('📚 UPLOADING KNOWLEDGE: Starting knowledge upload...', {
        assistantId,
        textLength: text.length
      });
      
      const res = await axios.post(`/api/${workspaceId}/ai/knowledge-upload`, {
        assistantId,
        text,
      });
      
      if (res.data && res.data.chunks) {
        console.log(`📚 UPLOADING KNOWLEDGE: Successfully uploaded ${res.data.chunks} chunks`);
        toast.success(`Knowledge uploaded successfully! Created ${res.data.chunks} knowledge chunks.`);
      }
    } catch (err) {
      console.error('📚 UPLOADING KNOWLEDGE: Error:', err);
      toast.error('Failed to upload and embed knowledge');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !botId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        status: formData.status,
        knowledge: {
          text: knowledgeText.trim() || null,
          documents: uploadedDocs.map((d: any) => ({
            url: d.url,
            filename: d.filename,
            type: d.type,
            size: d.size
          }))
        }
      };

      const response = await axios.put(`/api/${workspaceId}/ai/${botId}`, payload);
      
      if (response.data.status === 'success') {
        // Process knowledge if there's text or documents
        if (knowledgeText.trim() || uploadedDocs.length > 0) {
          console.log('📚 PROCESSING KNOWLEDGE: Starting knowledge processing...', {
            botId,
            hasText: !!knowledgeText.trim(),
            documentCount: uploadedDocs.length
          });
          
          let allText = knowledgeText.trim();
          
          // Extract text from uploaded documents
          if (uploadedDocs.length > 0) {
            console.log('📄 PROCESSING DOCUMENTS: Extracting text from documents...');
            const extractedTexts = await extractTextFromDocuments(uploadedDocs);
            
            if (extractedTexts.length > 0) {
              const documentText = extractedTexts.join('\n\n');
              allText = allText ? `${allText}\n\n${documentText}` : documentText;
              console.log(`📄 PROCESSING DOCUMENTS: Combined text length: ${allText.length} characters`);
            }
          }
          
          if (allText.trim()) {
            console.log('📚 UPLOADING KNOWLEDGE: Uploading combined text to knowledge base...');
            await uploadKnowledgeChunks(Number(botId), allText);
          } else {
            console.log('📚 PROCESSING KNOWLEDGE: No text content to upload');
          }
        }
        
        router.push('/dashboard/automations/ai');
      } else {
        console.error('Failed to update bot:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating AI bot:', error);
      toast.error("Error updating AI bot")
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const form = new FormData();
      for (let i = 0; i < files.length; i++) {
        form.append('files', files[i]);
      }
      const res = await fetch(`/api/${workspaceId}/uploads`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const newDocs = Array.isArray(data?.data) ? data.data : [];
      setUploadedDocs(prev => [...prev, ...newDocs]);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '' as any;
    }
  };

  const removeDoc = (idx: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit AI Bot</h1>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Customer Support Bot"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What does this bot do?"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Knowledge Base
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Text Content
                      </label>
                      <textarea
                        value={knowledgeText}
                        onChange={(e) => setKnowledgeText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                        placeholder="Add information that the bot should know..."
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-600">
                          Documents
                        </label>
                        <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                          <span className="flex items-center">
                            <Plus className="w-4 h-4 mr-1" />
                            <span>Add Files</span>
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={handleFilesSelected}
                              accept=".pdf,.txt,.doc,.docx,.md"
                            />
                          </span>
                        </label>
                      </div>
                      
                      {uploadedDocs.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {uploadedDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700 truncate max-w-xs">
                                  {doc.filename || 'Document ' + (idx + 1)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDoc(idx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-md">
                          <p className="text-sm text-gray-500">No documents added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/automations/ai')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 -ml-1" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
