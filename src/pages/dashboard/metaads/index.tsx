import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { useState, useCallback } from 'react';
import MetaAdsTable from './MetaAdsTable';
import MetaAdsSetup from './MetaAdsSetup';
import { withIronSessionSsr } from 'iron-session/next'
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session'
import CreateMetaAd from './create-meta-ad';

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

const adObjectives = [
  'WEBSITE_TRAFFIC',
  'CONVERSIONS',
  'REACH',
  'BRAND_AWARENESS',
  'LEAD_GENERATION'
];

const callToActions = [
  'SEND_MESSAGE',
  'CONTACT_US',
  'LEARN_MORE',
  'SIGN_UP',
  'BOOK_NOW',
  'SHOP_NOW'
];

export default function MetaAds(props: IProps) {
  const { id: workspaceId } = useSelector(getCurrentWorkspace);
const [tab, setTab] = useState<'manager' | 'setup' | 'create'>('manager');
  const user = props.user ? JSON.parse(props.user) : {};

  const [adName, setAdName] = useState('');
  const [color, setColor] = useState('#40E0B');
  const [objective, setObjective] = useState(adObjectives[0]);
  const [targetAudience, setTargetAudience] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [adText, setAdText] = useState('');
  const [cta, setCta] = useState(callToActions[0]);
  const [adType, setAdType] = useState<'facebook' | 'whatsapp'>('facebook');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pageId, setPageId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!workspaceId) {
        setError('No workspace selected');
        return;
      }

      const adData = {
        adName,
        color,
        objective,
        targetAudience,
        budget: parseFloat(budget),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        mediaUrl: mediaUrl || '',
        adText,
        cta,
        adType,
        phoneNumber,
        pageId,
        websiteUrl,
        workspaceId
      };

      const requiredFields = ['adName', 'objective', 'targetAudience', 'budget', 'startDate', 'endDate', 'adText', 'cta'];
      const missingFields = requiredFields.filter(field => !adData[field as keyof typeof adData]);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      const response = await fetch('/api/metaads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ad');
      }

      setTab('manager');
      // Reset form
      setAdName('');
      setColor('#40E0B');
      setObjective(adObjectives[0]);
      setTargetAudience('');
      setBudget('');
      setStartDate('');
      setEndDate('');
      setMediaUrl(null);
      setAdText('');
      setCta(callToActions[0]);
      setAdType('facebook');
      setPhoneNumber('');
      setPageId('');
      setWebsiteUrl('');
    } catch (err) {
      console.error('Error creating ad:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [adName, color, objective, targetAudience, budget, startDate, endDate, mediaUrl, adText, cta, adType, phoneNumber, pageId, websiteUrl, workspaceId]);
  
  return (
    <DashboardLayout user={user}>
      <div className="w-full max-w-6xl mx-auto py-8 px-2 sm:px-6">
        <h1 className="text-2xl font-bold mb-6 text-black">Meta Ads</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          {/* Tab switcher left */}
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none ${tab === 'manager' ? 'bg-gray-100 text-black' : 'bg-gray-100 text-gray-400'}`}
              onClick={() => setTab('manager')}
            >
              Ads manager
            </button>
            <button
              className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none ${tab === 'setup' ? 'bg-gray-100 text-black' : 'bg-gray-100 text-gray-400'}`}
              onClick={() => setTab('setup')}
            >
              Setup
            </button>
          </div>
          {/* Action buttons right */}
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:gap-2">
            <button className="w-full sm:w-auto bg-white border border-blue-100 text-primary px-4 py-2 rounded-md font-medium text-xs sm:text-sm">
              Connect and setup a meta add account
            </button>
            <button className={`w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-md font-medium text-xs sm:text-sm ${tab === 'create' ? 'bg-blue-700 text-white' : 'bg-primary text-white'}`} onClick={() => setTab('create')}>
              Create Ad
            </button>
          </div>
        </div>
        {tab === 'manager' && <MetaAdsTable />}
        {tab === 'setup' && <MetaAdsSetup />}
        {tab === 'create' && (
          <div className="flex flex-col md:flex-row gap-8 p-6 min-h-screen bg-gray-50">
            <CreateMetaAd 
              adName={adName}
              setAdName={setAdName}
              color={color}
              setColor={setColor}
              objective={objective}
              setObjective={setObjective}
              targetAudience={targetAudience}
              setTargetAudience={setTargetAudience}
              budget={budget}
              setBudget={setBudget}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              mediaUrl={mediaUrl}
              setMediaUrl={setMediaUrl}
              adText={adText}
              setAdText={setAdText}
              cta={cta}
              setCta={setCta}
              adType={adType}
              setAdType={setAdType}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              pageId={pageId}
              setPageId={setPageId}
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              onCancel={() => setTab('manager')}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}