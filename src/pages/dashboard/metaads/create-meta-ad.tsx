import React, { useState, useEffect } from 'react';
import { Upload } from '@/components/utils/Upload';

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
    onSubmit(e);
  };

  // Update objectives and CTAs based on ad type
  const currentObjectives = adObjectives[adType];
  const currentCTAs = callToActions[adType];

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 min-h-screen bg-gray-50">
      <form
        className="flex-1 max-w-xl bg-white rounded-xl shadow p-6 flex flex-col gap-6"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <h2 className="text-xl font-semibold mb-2">Create a new ad</h2>
        {/* Ad Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Type</label>
          <div className="flex space-x-4">
            {(['facebook', 'whatsapp'] as AdType[]).map((type) => (
              <div key={type} className="flex items-center">
                <input
                  type="radio"
                  id={type}
                  name="adType"
                  checked={adType === type}
                  onChange={() => setAdType(type)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor={type} className="ml-2 block text-sm text-gray-700 capitalize">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>
        {/* Basic Info */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-3">Basic info</h3>
          <div className="flex flex-col gap-3">
            <label className="text-sm">Ad name
              <input type="text" className="mt-1 w-full border rounded px-3 py-2" value={adName} onChange={e => setAdName(e.target.value)} required />
            </label>
            <label className="text-sm">Color
              <input type="color" className="ml-2 align-middle" value={color} onChange={e => setColor(e.target.value)} />
            </label>
            <div>
              <label htmlFor="objective" className="block text-sm font-medium text-gray-700">
                Objective
              </label>
              <select
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
            <label className="text-sm">Target Audience
              <input type="text" className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g. 'Nigerian young adults (18–35)'" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
            </label>
            <label className="text-sm">Budget
              <input type="number" className="mt-1 w-full border rounded px-3 py-2" placeholder="In Naira" value={budget} onChange={e => setBudget(e.target.value)} />
            </label>
            <div className="flex gap-3">
              <label className="text-sm flex-1">Start date
                <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </label>
              <label className="text-sm flex-1">End date
                <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </label>
            </div>
          </div>
        </div>
        {/* Ad Content */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-3">Ad content</h3>
          <p className="text-xs mb-3 text-blue-500">Change your brand name, welcome text and default user message</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white hover:bg-gray-50">
              <Upload 
                link={mediaUrl}
                accept=".jpg,.jpeg,.png,.mp4"
                workspaceId={workspaceId}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Supported formats: .jpg, .jpeg, .png, .mp4
              </p>
            </div>
            <div>
              <label htmlFor="adText" className="block text-sm font-medium text-gray-700">
                Ad Text
              </label>
              <div className="mt-1">
                <textarea
                  id="adText"
                  rows={4}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
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
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  WhatsApp Business Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    id="phoneNumber"
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
            )}
            {adType === 'facebook' && (
              <>
                <div>
                  <label htmlFor="pageId" className="block text-sm font-medium text-gray-700">
                    Facebook Page ID
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="pageId"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      placeholder="e.g., 123456789012345"
                      required={adType === 'facebook'}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Your Facebook page ID where the ad will be published
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
            <label className="text-sm">Call to action button
              <select className="mt-1 w-full border rounded px-3 py-2" value={cta} onChange={e => setCta(e.target.value)}>
                {currentCTAs.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Ad'}
          </button>
        </div>
      </form>
      {/* Preview */}
      <div className="flex-1 max-w-md mt-10 md:mt-0">
        <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
          <h3 className="font-medium mb-4">Preview</h3>
          {/* Simple preview mockup */}
          <div className="border rounded-lg p-4 flex flex-col gap-2" style={{ borderColor: color }}>
            <span className="font-bold text-lg">{adName || 'Ad name'}</span>
            <span className="text-xs text-gray-500">{objective}</span>
            {mediaUrl && (
              <div className="mt-2">
                <img 
                  src={mediaUrl} 
                  alt="Ad preview" 
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}
            <span className="text-sm">{adText || 'Ad text will appear here.'}</span>
            <button className="mt-2 px-3 py-1 rounded bg-green-500 text-white text-xs">{cta}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMetaAd; 