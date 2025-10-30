import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-toastify';
import LoadingButton from '@/components/utils/LoadingButton';
import { GetServerSideProps } from 'next';
import { getResellerInfo } from '@/services/session';
import Logo from '@/components/utils/Logo';
import { FACEBOOK_CONFIG_ID } from '@/libs/constants';

interface LinkMetaAccountPageProps {
  reseller: any;
}

const LinkMetaAccountPage: React.FC<LinkMetaAccountPageProps> = ({ reseller }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const [accessCode, setAccessCode] = useState<string | null>(null);

  useEffect(() => {
    // Load Facebook SDK
    loadFacebookSDK();
  }, []);

  const loadFacebookSDK = () => {
    // Only load if not already loaded
    if (window.FB) return;

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    (function(d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  };

  const fbLoginCallback = (response: any) => {
    if (response.authResponse) {
      setAccessCode(response.authResponse.code);
      toast.success('Successfully connected to Meta!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      toast.error('Failed to connect to Meta. Please try again.');
    }
    setIsLoading(false);
  };

  const handleLinkAccount = () => {
    setIsLoading(true);
    try {
      if (!window.FB) {
        throw new Error('Facebook SDK not loaded');
      }
      
      window.FB.login(fbLoginCallback, {
        config_id: FACEBOOK_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '2',
        }
      });
    } catch (error) {
      console.error('Error linking Meta account:', error);
      toast.error('Failed to initiate Meta account linking');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div 
      className="min-h-screen flex"
      style={{
        backgroundImage: 'url(/Background.png)'
      }}
    >
      <Head>
        <title>Link Meta Account - Wendi</title>
      </Head>
      
      {/* Logo */}
      <div className="m-8">
        <Logo />
      </div>

      {/* Left side - Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#0072E9] mb-4">
                We will like you to link your meta account
              </h1>
              
              <ul className="mt-6 space-y-4 text-gray-600 text-left">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The seamless integration will open in a pop-up. Make sure your browser is not blocking pop-ups.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You will be asked to provide a phone number for WhatsApp Business Integration. We strongly recommend using a new phone number.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>However, if you already have a WhatsApp account associated with that number, back up your WhatsApp data and then delete that account.</span>
                </li>
              </ul>

              <div className="mt-8 space-y-4">
                <LoadingButton
                  onClick={handleLinkAccount}
                  loading={isLoading}
                  className="w-full py-3 bg-[#0072E9] hover:bg-blue-700 text-white font-medium rounded-lg text-lg"
                >
                  Link Business Account
                </LoadingButton>
                
                <button
                  onClick={handleSkip}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="w-full h-full max-w-md flex items-center justify-center">
          <div 
            className="w-full h-96 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/onboarding1.png)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const reseller = await getResellerInfo(context.req);
  
  return {
    props: {
      reseller: JSON.parse(JSON.stringify(reseller || null))
    },
  };
};

export default LinkMetaAccountPage;
