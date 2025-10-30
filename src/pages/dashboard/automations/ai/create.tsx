import React, { useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import axios from 'axios'; 
import { useSelector } from 'react-redux'; 
import { getCurrentWorkspace } from '@/store/slices/system'; 
import { toast } from 'react-toastify';

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

export default function CreateAIBotPage({ user: userString }: IProps) {
  const router = useRouter();
  const user = userString ? JSON.parse(userString) : {};
  const { id: workspaceId } = useSelector(getCurrentWorkspace); 
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'chatbot',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [knowledgeText, setKnowledgeText] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [urls, setUrls] = useState<string[]>(['']);
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        status: formData.status,
        knowledge: {
          text: knowledgeText.trim() || null,
          documents: uploadedDocs.map((d: any) => ({ url: d.url, filename: d.filename, type: d.type, size: d.size })),
          urls: urls.filter(url => url.trim() && isValidUrl(url.trim()))
        }
      };

      const res = await axios.post(`/api/${workspaceId}/ai/assistant`, payload);
      const created = res?.data?.data;
      const assistantId = created?.id;

      if (assistantId && (knowledgeText.trim() || uploadedDocs.length > 0)) {
        console.log('📚 PROCESSING KNOWLEDGE: Starting knowledge processing...', {
          assistantId,
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
          await uploadKnowledgeChunks(assistantId, allText);
        } else {
          console.log('📚 PROCESSING KNOWLEDGE: No text content to upload');
        }
      }

      router.push('/dashboard/automations/ai');
    } catch (error) {
      console.error('Error creating AI bot:', error);
      toast.error("Error creating AI bot")
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

  const addUrl = () => {
    setUrls(prev => [...prev, '']);
  };

  const removeUrl = (idx: number) => {
    if (urls.length > 1) {
      setUrls(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const updateUrl = (idx: number, value: string) => {
    setUrls(prev => prev.map((url, i) => i === idx ? value : url));
  };

  const processUrls = async () => {
    const validUrls = urls.filter(url => url.trim() && isValidUrl(url.trim()));
    if (validUrls.length === 0) return;

    setIsUrlProcessing(true);
    try {
      const res = await axios.post(`/api/${workspaceId}/ai/process-urls`, {
        urls: validUrls
      });
      
      if (res.data?.data?.content) {
        const extractedContent = res.data.data.content;
        setKnowledgeText(prev => prev + '\n\n' + extractedContent);
        toast.success(`Successfully processed ${validUrls.length} URL(s)`);

        setUrls(['']);
      }
    } catch (error) {
      console.error('Error processing URLs:', error);
      toast.error('Failed to process URLs. Please check the URLs and try again.');
    } finally {
      setIsUrlProcessing(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Create New AI Bot</h1>
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
                    placeholder="What does this AI bot do?"
                  />
                </div>

                <div>
                  <label htmlFor="knowledgeText" className="block text-sm font-medium text-gray-700 mb-1">
                    Knowledge Text
                  </label>
                  <textarea
                    id="knowledgeText"
                    name="knowledgeText"
                    rows={6}
                    value={knowledgeText}
                    onChange={(e) => setKnowledgeText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paste any FAQs, policies, or product info you want the AI to use."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional. For best results, keep under 8,000 characters or split across files.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extract Knowledge from URLs
                  </label>
                  <div className="space-y-2">
                    {urls.map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateUrl(idx, e.target.value)}
                          placeholder="https://example.com/article"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {urls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUrl(idx)}
                            className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addUrl}
                        className="px-3 py-2 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 text-sm"
                      >
                        + Add Another URL
                      </button>
                      <button
                        type="button"
                        onClick={processUrls}
                        disabled={isUrlProcessing || !urls.some(url => url.trim() && isValidUrl(url.trim()))}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUrlProcessing ? 'Processing...' : 'Extract Content'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Extract content from web pages to add to your AI bot&apos;s knowledge base.
                    <br />
                    <span className="text-orange-600 font-medium">💡 Tip:</span> Use public pages like blog posts, documentation, or public articles. 
                    Dashboard pages, login pages, and admin areas cannot be accessed.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Documents
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.doc,.docx"
                    multiple
                    onChange={handleFilesSelected}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported: PDF, TXT, MD, CSV, DOC, DOCX</p>

                  {uploadedDocs.length > 0 && (
                    <div className="mt-3 border border-gray-200 rounded-md divide-y">
                      {uploadedDocs.map((doc, idx) => (
                        <div key={`${doc.url}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="min-w-0 mr-3">
                            <p className="truncate text-gray-800">{doc.filename || doc.url}</p>
                            <p className="text-xs text-gray-500">{doc.type} • {Math.round((doc.size || 0) / 1024)} KB</p>
                          </div>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-700 text-xs"
                            onClick={() => removeDoc(idx)}
                            disabled={isUploading}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Bot Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="chatbot">Chatbot</option>
                      <option value="assistant">Assistant</option>
                      <option value="automation">Automation</option>
                      <option value="other">Other</option>
                    </select>
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
                </div>
                
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/automations/ai')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      'Creating...'
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Bot
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
