import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import axios from 'axios';
import { MetaAd } from '@/types/meta-ads';

interface MetaAdDetailsModalProps {
  open: boolean;
  onClose: () => void;
  ad: MetaAd | null;
}

export default function MetaAdDetailsModal({ open, onClose, ad }: MetaAdDetailsModalProps) {
  const [detailedAd, setDetailedAd] = useState<MetaAd | null>(null);
  const [loading, setLoading] = useState(false);
  const currentWorkspace = useSelector(getCurrentWorkspace);

  const fetchAdDetails = async (adId: number) => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/metaads/${adId}/get`, {
        params: {
          workspaceId: currentWorkspace.id,
        }
      });

      if (response.data.status === 'success') {
        setDetailedAd(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching ad details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && ad) {
      fetchAdDetails(ad.id);
    }
  }, [open, ad, currentWorkspace]);

  // Always render for smooth transition
  return (
    <div className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${open ? 'bg-opacity-40' : 'bg-opacity-0'}`}
        onClick={onClose}
      ></div>
      {/* Sliding panel */}
      <div
        className={`
          fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg z-50
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {ad && (
          <>
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-bold">{ad.name}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : detailedAd ? (
                <>
              {/* Stats */}
                  {detailedAd.stats && detailedAd.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                      {detailedAd.stats.map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                          <div className="text-xl font-bold">{stat.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
                  )}
              {/* Details */}
              <div className="mb-2 font-semibold">Advert Details</div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ad name</span>
                      <span className="font-medium">{detailedAd.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                      <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                        detailedAd.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        detailedAd.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                        detailedAd.status === 'PENDING_REVIEW' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {detailedAd.status}
                      </span>
                    </div>
                    {detailedAd.adType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ad Type</span>
                        <span className="font-medium capitalize">{detailedAd.adType.toLowerCase()}</span>
                      </div>
                    )}
                    {detailedAd.objective && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Objective</span>
                        <span className="font-medium">{detailedAd.objective}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-medium">₦{detailedAd.budget.toLocaleString()}</span>
                    </div>
                    {detailedAd.targetAudience && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Target Audience</span>
                        <span className="font-medium">{detailedAd.targetAudience}</span>
                      </div>
                    )}
                    {detailedAd.startDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Start Date</span>
                        <span className="font-medium">{new Date(detailedAd.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {detailedAd.endDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">End Date</span>
                        <span className="font-medium">{new Date(detailedAd.endDate).toLocaleDateString()}</span>
                </div>
                    )}
                    {detailedAd.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Created at</span>
                        <span className="font-medium">{new Date(detailedAd.createdAt).toLocaleString()}</span>
                      </div>
                    )}
                    {detailedAd.phoneNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone Number</span>
                        <span className="font-medium">{detailedAd.phoneNumber}</span>
                      </div>
                    )}
                    {detailedAd.facebookAdId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Facebook Ad ID</span>
                        <span className="font-medium text-xs">{detailedAd.facebookAdId}</span>
                      </div>
                    )}
                  </div>
                  {/* Ad Content */}
                  <div className="mt-6">
                    <div className="mb-2 font-semibold">Ad Content</div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm">{detailedAd.adText}</p>
                      {detailedAd.mediaUrl && (
                        <div className="mt-3">
                          <img 
                            src={detailedAd.mediaUrl} 
                            alt="Ad media" 
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Failed to load ad details</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 