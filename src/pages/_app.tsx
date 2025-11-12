import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import React, { useEffect } from 'react';

// Load Inter font with specific subsets and weights
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
import Router from 'next/router';
import Script from "next/script";
import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify';
import NProgress from 'nprogress';
import { Provider } from 'react-redux';
import 'nprogress/nprogress.css';
import 'react-tooltip/dist/react-tooltip.css'
import 'react-toastify/dist/ReactToastify.css';
//import { wrapper } from '../store';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './../store'
import { FACEBOOK_APP_ID } from '@/libs/constants';


export default function App({ Component, ...props }: AppProps) {

  const { pageProps } = props;

  useEffect(() => {
    const dispatchReady = () => window.dispatchEvent(new Event('facebook-sdk-ready'));

    const initializeFacebookSdk = () => {
      if (!FACEBOOK_APP_ID) {
        console.warn('Facebook App ID is missing; SDK init skipped.');
        return;
      }

      if (!window.FB) {
        return;
      }

      if (window.FB._initialized) {
        dispatchReady();
        return;
      }

      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });

      window.FB?.AppEvents?.logPageView?.();
      dispatchReady();
    };

    window.fbAsyncInit = initializeFacebookSdk;

    initializeFacebookSdk();
  }, [])


// function checkLoginState() {
//   FB.getLoginStatus(function(response) {
//     statusChangeCallback(response);
//   });
// }

  Router.events.on('routeChangeStart', () => NProgress.start()); 
  Router.events.on('routeChangeComplete', () => NProgress.done()); 
  Router.events.on('routeChangeError', () => NProgress.done());

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Script
          id="facebook-sdk"
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="afterInteractive"
        />
          <Component {...pageProps} /> 
        <ToastContainer autoClose={5000} hideProgressBar={true} position="top-right" />
      </PersistGate>
    </Provider>
  )
}
