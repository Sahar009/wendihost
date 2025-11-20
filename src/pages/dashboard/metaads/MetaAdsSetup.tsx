import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentWorkspace, setCurrentWorkspace } from '@/store/slices/system';
import LoadingButton from '@/components/utils/LoadingButton';
import { FACEBOOK_CONFIG_ID } from '@/libs/constants';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function MetaAdsSetup() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adAccountInfo, setAdAccountInfo] = useState<any>(null);
  const [pageInfo, setPageInfo] = useState<any>(null);

  const currentWorkspace = useSelector(getCurrentWorkspace);
  const dispatch = useDispatch();

  const fbLoginCallback = (response: any) => {
    if (response.authResponse) {
      handleFacebookConnection(response.authResponse.code);
    }
  };

  const launchFacebookConnection = () => {
    setIsConnecting(true);
    window?.FB.login(fbLoginCallback, {
      config_id: FACEBOOK_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      scope: 'ads_management,pages_show_list,pages_read_engagement',
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: '2',
      }
    });
  };

  const handleFacebookConnection = async (code: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/${currentWorkspace.id}/metaads/connect-facebook`, {
        code
      });

      if (response.data.status === 'success') {
        console.log('✅ Connection response:', {
          workspace: response.data.data?.workspace,
          fbUserId: response.data.data?.fbUserId,
          facebookPageId: response.data.data?.facebookPageId,
          hasPermissionIssue: response.data.data?.hasPermissionIssue
        });
        
        // Update workspace in Redux with the new connection data
        if (response.data.data?.workspace) {
          console.log('📦 Updating Redux with workspace:', response.data.data.workspace);
          dispatch(setCurrentWorkspace(response.data.data.workspace));
          
          // Check if we got the required data
          const hasFbUserId = !!response.data.data.workspace.fbUserId;
          const hasFacebookPageId = !!response.data.data.workspace.facebookPageId;
          const hasPermissionIssue = response.data.data?.hasPermissionIssue;
          
          if (hasFbUserId && hasFacebookPageId) {
            toast.success('Facebook account connected successfully for Meta Ads!');
          } else if (hasPermissionIssue) {
            // Show permission error with instructions
            toast.error(
              'Permission Required: pages_show_list permission is needed.',
              { autoClose: 10000 }
            );
            // Also show an info toast with detailed instructions
            setTimeout(() => {
              toast.info(
                'How to fix: Go to developers.facebook.com/apps → Select your app → App Review → Permissions and Features → Find pages_show_list → Request it → Wait for approval, then reconnect',
                { autoClose: 15000 }
              );
            }, 1500);
          } else {
            toast.warning(response.data.message || 'Connected, but some data may be missing.');
            console.warn('⚠️ Missing data:', {
              hasFbUserId,
              hasFacebookPageId,
              workspace: response.data.data.workspace
            });
          }
        } else {
          // Fallback: fetch the updated workspace from the API
          console.log('🔄 Fetching workspace from API...');
          try {
            const workspaceRes = await axios.get(`/api/${currentWorkspace.id}/workspace`);
            if (workspaceRes.data.status === 'success' && workspaceRes.data.data) {
              console.log('📦 Updating Redux with fetched workspace:', workspaceRes.data.data);
              dispatch(setCurrentWorkspace(workspaceRes.data.data));
              toast.success('Facebook account connected successfully for Meta Ads!');
            }
          } catch (fetchError) {
            console.error('❌ Error fetching updated workspace:', fetchError);
            toast.error('Connected but failed to refresh. Please reload the page.');
          }
        }
      }
    } catch (error: any) {
      console.error('Error connecting Facebook:', error);
      const errorMessage = error.response?.data?.message || 'Failed to connect Facebook account';
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  const fetchAccountInfo = async () => {
    try {
      const response = await axios.get(`/api/${currentWorkspace.id}/waba/accounts`);
      if (response.data.status === 'success') {
        const data = response.data.data;
        if (data.adAccounts && data.adAccounts.length > 0) {
          setAdAccountInfo(data.adAccounts[0]); // Use the first ad account
        }
        if (data.pages && data.pages.length > 0) {
          setPageInfo(data.pages[0]); // Use the first page
        }
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  // Check if Meta Ads is connected (has fbUserId and facebookPageId)
  // This is different from WhatsApp connection which only needs accessToken
  const isMetaAdsConnected = currentWorkspace?.fbUserId && currentWorkspace?.facebookPageId;
  const isWhatsAppConnected = currentWorkspace?.phone;

  useEffect(() => {
    // Only fetch account info if Meta Ads is properly connected (has fbUserId and facebookPageId)
    if (isMetaAdsConnected) {
      fetchAccountInfo();
    }
  }, [isMetaAdsConnected]);

  return (
    <div className="w-full">
      {/* Setup card */}
      <div className="bg-white rounded-xl p-6 shadow flex flex-col gap-6">
        {/* Facebook Connection for Meta Ads */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="font-semibold mb-1">Connect your Facebook account for Meta Ads</div>
            <div className="text-gray-500 text-sm mb-2">
              {isMetaAdsConnected 
                ? 'Facebook account is connected for Meta Ads ✓' 
                : 'Connect your Facebook account with page permissions to create and manage Meta Ads'
              }
            </div>
            {!isMetaAdsConnected && currentWorkspace?.accessToken && (
              <div className="text-amber-600 text-xs mt-1">
                ⚠️ You have WhatsApp connected, but need to connect Facebook separately for Meta Ads with page permissions
              </div>
            )}
            {!isMetaAdsConnected && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 text-xs">
                <div className="font-semibold text-blue-900 mb-1">📋 Required Permissions:</div>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li><code className="bg-blue-100 px-1 rounded">pages_show_list</code> - To list your Facebook pages</li>
                  <li><code className="bg-blue-100 px-1 rounded">ads_management</code> - To create and manage ads</li>
                  <li><code className="bg-blue-100 px-1 rounded">pages_read_engagement</code> - To read page engagement data</li>
                </ul>
                <div className="mt-2 text-blue-700">
                  <strong>If you see permission errors:</strong>
                  <ol className="list-decimal list-inside space-y-1 mt-1">
                    <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com/apps</a></li>
                    <li>Select your app → <strong>Permissions</strong> → <strong>Add Permissions</strong></li>
                    <li>Add <code className="bg-blue-100 px-1 rounded">pages_show_list</code> permission</li>
                    <li>Submit for review if required (some permissions need Facebook approval)</li>
                    <li>Try connecting again after permissions are approved</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
          {isMetaAdsConnected ? (
            <span className="text-green-600 text-sm font-medium">Connected</span>
          ) : (
            <LoadingButton 
              onClick={launchFacebookConnection}
              loading={isConnecting}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium text-sm"
            >
              Connect Facebook for Meta Ads
            </LoadingButton>
          )}
        </div>

        {/* Connected Facebook Page Info */}
        {isMetaAdsConnected && currentWorkspace?.facebookPageId && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-semibold mb-1">Connected Facebook Page</div>
              <div className="text-gray-500 text-sm mb-2">Your Facebook page for publishing ads</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">Page ID: {currentWorkspace.facebookPageId}</div>
              {currentWorkspace.fbUserId && (
                <div className="text-xs text-gray-500">User ID: {currentWorkspace.fbUserId}</div>
              )}
            </div>
          </div>
        )}

        {/* Connected Ad Account Info */}
        {isMetaAdsConnected && adAccountInfo && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-semibold mb-1">Connected Ad Account</div>
              <div className="text-gray-500 text-sm mb-2">Your Facebook ad account for creating ads</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">{adAccountInfo.name}</div>
              <div className="text-xs text-gray-500">ID: {adAccountInfo.id}</div>
            </div>
          </div>
        )}


        {/* WhatsApp Connection */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="font-semibold mb-1">Link WhatsApp Number</div>
            <div className="text-gray-500 text-sm mb-2">
              {isWhatsAppConnected 
                ? 'WhatsApp is connected ✓' 
                : 'Link your WhatsApp business number with selected Facebook page to receive messages directly over WhatsApp'
              }
            </div>
          </div>
          {isWhatsAppConnected ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={currentWorkspace.phone}
                disabled
                className="px-4 py-2 rounded-md border border-gray-100 bg-gray-50 text-sm w-44 focus:outline-none"
              />
              <span className="text-green-600 text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="WhatsApp number"
                disabled
                className="px-4 py-2 rounded-md border border-gray-100 bg-gray-50 text-sm w-44 focus:outline-none"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-md font-medium text-sm">
                Connect WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Setup Status */}
        {isMetaAdsConnected && isWhatsAppConnected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">Setup Complete</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your Meta Ads account is ready! You can now create Facebook and WhatsApp ads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 