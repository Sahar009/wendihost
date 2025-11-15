import React, { useState, useEffect } from 'react';
import { Upload } from '@/components/utils/Upload';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';

type AdType = 'facebook' | 'whatsapp';

interface CreateMetaAdProps {
  workspaceId: number;
  adName: string;
  setAdName: (value: string) => void;
  color: string;
  setColor: (value: string) => void;
  objective: string;
  setObjective: (value: string) => void;
  targetAudience: string;
  setTargetAudience: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  budgetType: 'daily' | 'monthly';
  setBudgetType: (value: 'daily' | 'monthly') => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  mediaUrl: string | null;
  setMediaUrl: (value: string | null) => void;
  adText: string;
  setAdText: (value: string) => void;
  cta: string;
  setCta: (value: string) => void;
  adType: AdType;
  setAdType: (value: AdType) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  pageId: string;
  setPageId: (value: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  onCancel: () => void;
}

const adObjectives = {
  facebook: ['Traffic', 'Engagement', 'Leads', 'Sales'],
  whatsapp: ['Messages', 'Conversions']
};

const callToActions = {
  facebook: ['Learn More', 'Shop Now', 'Sign Up', 'Contact Us'],
  whatsapp: ['Send WhatsApp Message', 'Contact Us', 'Get Help']
};

const CreateMetaAd: React.FC<CreateMetaAdProps> = ({
  workspaceId,
  adName,
  setAdName,
  color,
  setColor,
  objective,
  setObjective,
  targetAudience,
  setTargetAudience,
  budget,
  setBudget,
  budgetType,
  setBudgetType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  mediaUrl,
  setMediaUrl,
  adText,
  setAdText,
  cta,
  setCta,
  adType = 'facebook',
  setAdType,
  phoneNumber = '',
  setPhoneNumber,
  pageId = '',
  setPageId,
  websiteUrl = '',
  setWebsiteUrl,
  onSubmit,
  isLoading,
  error,
  onCancel,
}) => {

  const handleUploadComplete = (results: any[]) => {
    if (results && results.length > 0) {
      setMediaUrl(results[0].secure_url);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation is handled in the parent component (index.tsx)
    // Just call onSubmit which will handle validation and API call
    onSubmit(e);
  };

  // Get workspace for billing info and pages
  const workspace = useSelector(getCurrentWorkspace);
  const [availablePages, setAvailablePages] = useState<Array<{id: string; name: string; category?: string}>>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  // Fetch available Facebook pages
  useEffect(() => {
    const fetchPages = async () => {
      if (!workspace?.accessToken || !workspaceId) return;
      
      setIsLoadingPages(true);
      try {
        const response = await fetch(`/api/${workspaceId}/metaads/pages`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            setAvailablePages(data.data);
            // Auto-select if only one page or if workspace has saved pageId
            if (data.data.length === 1) {
              setPageId(data.data[0].id);
            } else if (workspace?.facebookPageId && !pageId) {
              setPageId(workspace.facebookPageId);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      } finally {
        setIsLoadingPages(false);
      }
    };

    if (workspace?.accessToken) {
      fetchPages();
    }
  }, [workspace?.accessToken, workspaceId, workspace?.facebookPageId, setPageId]);

  // Auto-fill pageId from workspace if available
  useEffect(() => {
    if (workspace?.facebookPageId && !pageId && availablePages.length === 0) {
      setPageId(workspace.facebookPageId);
    }
  }, [workspace?.facebookPageId, pageId, availablePages.length, setPageId]);
  
  // Update objectives and CTAs based on ad type
  const currentObjectives = adObjectives[adType];
  const currentCTAs = callToActions[adType];

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <form
        className="flex-1 max-w-2xl bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border border-gray-200"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        noValidate
      >
        <div className="border-b border-gray-200 pb-4 mb-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create a new ad</h2>
          <p className="text-sm text-gray-500">Fill in the details below to create your Meta ad campaign</p>
        </div>
        {/* Ad Type Selection */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <label className="block text-sm font-semibold text-gray-800 mb-3">Ad Type</label>
          <div className="flex space-x-4">
            {(['facebook', 'whatsapp'] as AdType[]).map((type) => (
              <label
                key={type}
                htmlFor={type}
                className={`flex items-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                  adType === type
                    ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  id={type}
                  name="adType"
                  checked={adType === type}
                  onChange={() => setAdType(type)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 mr-2"
                />
                <span className="text-sm font-medium capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Basic Info */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 mb-4 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Basic Information
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="adName" 
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                value={adName} 
                onChange={e => setAdName(e.target.value)} 
                placeholder="Enter a descriptive name for your ad"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preview Color (UI Only)
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  className="w-16 h-10 rounded-lg border-2 border-gray-300 cursor-pointer" 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">
                    This color is only used for the preview. Facebook ads use their own styling.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-1.5">
                Campaign Objective <span className="text-red-500">*</span>
              </label>
              <select
                id="objective"
                name="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="mt-1 block w-full pl-4 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white"
                required
              >
                <option value="">Select an objective</option>
                {currentObjectives.map((obj) => (
                  <option key={obj} value={obj}>
                    {obj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Audience (Country Codes) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                placeholder="e.g. NG,US,GB (comma-separated country codes)" 
                value={targetAudience} 
                onChange={e => setTargetAudience(e.target.value)} 
                required
              />
              <p className="mt-1.5 text-xs text-gray-500 flex items-start gap-1">
                <span className="text-primary">ℹ️</span>
                <span>Enter 2-letter country codes (ISO 3166-1 alpha-2). Examples: NG for Nigeria, US for United States, GB for United Kingdom</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Budget <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                  placeholder="Enter amount" 
                  value={budget} 
                  onChange={e => setBudget(e.target.value)} 
                  required
                  min="0"
                  step="0.01"
                />
                <select 
                  className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white font-medium" 
                  id="budgetType"
                  name="budgetType"
                  value={budgetType}
                  onChange={e => setBudgetType(e.target.value as 'daily' | 'monthly')}
                >
                  <option value="daily">Daily (NGN)</option>
                  <option value="monthly">Monthly (NGN)</option>
                </select>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 flex items-start gap-1">
                <span className="text-primary">💰</span>
                <span>Budget will be converted to USD cents for Facebook API. Charges are billed directly to your connected Facebook ad account.</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-colors" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  required
                />
              </div>
            </div>
          </div>
        </div>
        {/* Ad Content */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 mb-4 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Ad Content
          </h3>
          <p className="text-sm mb-4 text-gray-600">Upload media, write your ad copy, and configure your call-to-action</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 bg-white hover:bg-gray-50 hover:border-primary transition-all cursor-pointer">
              <Upload 
                link={mediaUrl}
                accept=".jpg,.jpeg,.png,.mp4"
                workspaceId={workspaceId}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                Supported formats: .jpg, .jpeg, .png, .mp4
              </p>
            </div>
            <div className="w-full" style={{ display: 'block', width: '100%' }}>
              <label htmlFor="adText" className="block text-sm font-medium text-gray-700 mb-1">
                Ad Text <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 w-full" style={{ display: 'block', width: '100%', position: 'relative' }}>
                <textarea
                  id="adText"
                  name="adText"
                  rows={4}
                  style={{ 
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1,
                    width: '100%',
                    minWidth: '100%',
                    maxWidth: '100%',
                    minHeight: '100px',
                    height: 'auto',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem',
                    color: '#111827',
                    boxSizing: 'border-box',
                    position: 'relative',
                    zIndex: 1,
                    resize: 'vertical',
                    overflow: 'auto',
                    fontFamily: 'inherit',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900"
                  value={adText}
                  onChange={(e) => setAdText(e.target.value)}
                  placeholder={adType === 'whatsapp' ? 'Enter your WhatsApp message...' : 'Enter your ad text...'}
                  required
                />
                {adType === 'whatsapp' && (
                  <p className="mt-1 text-xs text-gray-500">
                    This message will be sent when users click on your ad
                  </p>
                )}
              </div>
            </div>
            {adType === 'whatsapp' && (
              <>
                <div>
                  <label htmlFor="pageId" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Facebook Page <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {isLoadingPages ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading pages...
                      </div>
                    ) : availablePages.length > 0 ? (
                      <select
                        id="pageId"
                        name="pageId"
                        className="mt-1 block w-full pl-4 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                        required={adType === 'whatsapp'}
                      >
                        <option value="">Select a Facebook page</option>
                        {availablePages.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.name} {page.category ? `(${page.category})` : ''} - {page.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        id="pageId"
                        name="pageId"
                        className="shadow-sm focus:ring-2 focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-lg px-4 py-2.5"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                        placeholder="e.g., 123456789012345"
                        required={adType === 'whatsapp'}
                      />
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      {availablePages.length > 0 
                        ? 'Select your Facebook page from the list above'
                        : 'Enter your Facebook page ID manually or connect your account to see available pages'
                      }
                    </p>
                  </div>
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    WhatsApp Business Number <span className="text-red-500">*</span>
                  </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., 1234567890"
                    required={adType === 'whatsapp'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The WhatsApp number where messages will be sent
                  </p>
                </div>
              </div>
              </>
            )}
            {adType === 'facebook' && (
              <>
                <div>
                  <label htmlFor="pageId" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Facebook Page <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    {isLoadingPages ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading pages...
                      </div>
                    ) : availablePages.length > 0 ? (
                      <select
                        id="pageId"
                        name="pageId"
                        className="mt-1 block w-full pl-4 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                        required={adType === 'facebook'}
                      >
                        <option value="">Select a Facebook page</option>
                        {availablePages.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.name} {page.category ? `(${page.category})` : ''} - {page.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        id="pageId"
                        name="pageId"
                        className="shadow-sm focus:ring-2 focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-lg px-4 py-2.5"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                        placeholder="e.g., 123456789012345"
                        required={adType === 'facebook'}
                      />
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      {availablePages.length > 0 
                        ? 'Select your Facebook page from the list above'
                        : 'Enter your Facebook page ID manually or connect your account to see available pages'
                      }
                    </p>
                  </div>
                </div>
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
                    Website URL
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="websiteUrl"
                      name="websiteUrl"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      required={adType === 'facebook'}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      The website URL where users will be directed when they click the ad
                    </p>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Call to Action Button <span className="text-red-500">*</span>
              </label>
              <select 
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white" 
                value={cta} 
                onChange={e => setCta(e.target.value)}
                required
              >
                {currentCTAs.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Ad...
              </span>
            ) : (
              'Create Ad'
            )}
          </button>
        </div>
      </form>
      {/* Preview & Billing Info */}
      <div className="flex-1 max-w-md mt-10 md:mt-0 space-y-6">
        {/* Preview */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Ad Preview
          </h3>
          <div className="border-2 rounded-xl p-5 flex flex-col gap-3 bg-gradient-to-br from-gray-50 to-white" style={{ borderColor: color }}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-gray-900">{adName || 'Ad name'}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{adType}</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">{objective || 'Objective'}</span>
            {mediaUrl && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <img 
                  src={mediaUrl} 
                  alt="Ad preview" 
                  className="max-w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )}
            <span className="text-sm text-gray-700 leading-relaxed">{adText || 'Ad text will appear here.'}</span>
            <button className="mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-md hover:bg-primary/90 transition-colors">
              {cta || 'Call to Action'}
            </button>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Billing Information
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <div>
                <p className="font-medium">Direct Facebook Billing</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Charges are billed directly to your connected Facebook ad account{workspace?.fbUserId ? ` (ID: act_${workspace.fbUserId})` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <div>
                <p className="font-medium">No Platform Fees</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  We don&apos;t charge any additional fees. You only pay Facebook for the ad spend.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <div>
                <p className="font-medium">Budget Control</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Your daily/monthly budget limit is set and enforced by Facebook. You can pause or stop ads anytime.
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-gray-800 mb-1">💡 Important:</p>
              <p className="text-xs text-gray-600">
                Make sure your Facebook ad account has a valid payment method configured. You can manage billing settings in your Facebook Business Manager.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMetaAd; 