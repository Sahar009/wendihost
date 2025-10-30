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

    window.fbAsyncInit = function() {
      //2. FB JavaScript SDK configuration and setup
      window?.FB.init({
        appId      : FACEBOOK_APP_ID, // FB App ID
        cookie     : true,  // enable cookies to allow the server to access the session
        xfbml      : true,  // parse social plugins on this page
        version    : 'v21.0' // uses graph api version v4.0
      });

      window?.FB?.AppEvents?.logPageView?.();   
    };  

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
        <Script id="facebook-sdk" src="https://connect.facebook.net/en_US/sdk.js" />
          <Component {...pageProps} /> 
        <ToastContainer autoClose={5000} hideProgressBar={true} position="top-right" />
      </PersistGate>
    </Provider>
  )
}
