import React, { useState, useEffect } from 'react';
import { FaPython, FaNodeJs, FaCopy } from 'react-icons/fa6';
import CodeBlock from './CodeBlock';
import axios from 'axios';
import { toast } from 'react-toastify';
import { TestTube, Phone, Trash2, Send, FileText, Code, AlertCircle, CheckCircle, XCircle, Key, RefreshCw } from 'lucide-react';
import { useSelector } from 'react-redux';

const API_ENDPOINT = "/api/wa-auth";

const Api = () => {
  const [testPhone, setTestPhone] = useState('+2349090909090'); // Pre-filled with test number
  const [testing, setTesting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const currentWorkspace = useSelector((state: any) => state.system.current);

  // Fetch API key on component mount
  useEffect(() => {
    if (currentWorkspace?.apiKey) {
      setApiKey(currentWorkspace.apiKey);
    }
  }, [currentWorkspace]);

  const generateNewApiKey = async () => {
    if (!currentWorkspace?.id) return;
    
    if (!window.confirm('Generating a new API key will invalidate the previous one. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/${currentWorkspace.id}/settings/generate-api-key`);
      setApiKey(response.data.data.apiKey);
      toast.success('New API key generated successfully!');
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleTestOTP = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    setTesting(true);
    try {
      // This will test the internal test API endpoint
      const response = await axios.post(`/api/1/waba/test-api`, {
        phone: testPhone
      });

      toast.success('OTP sent successfully! Check your WhatsApp.');
      console.log('Test response:', response.data);
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setTesting(false);
    }
  };

  const fillTestNumber = () => {
    setTestPhone('+2349090909090');
    toast.info('Test phone number filled!');
  };

  const clearPhone = () => {
    setTestPhone('');
    toast.info('Phone number cleared!');
  };

  return (
    <div className="flex flex-col gap-8 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
      {/* API Key Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Key
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Your API key provides access to the WhatsApp OTP API. Keep it secure and don't share it publicly.
          </p>
          
          {apiKey ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 p-3 rounded-md border border-gray-200 font-mono text-sm overflow-x-auto">
                {apiKey}
              </div>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title="Copy to clipboard"
              >
                <FaCopy className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No API key generated yet.
            </div>
          )}
        </div>
        
        <button
          onClick={generateNewApiKey}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              {apiKey ? 'Regenerate API Key' : 'Generate API Key'}
            </>
          )}
        </button>
      </div>

      {/* Test Section */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test OTP API
        </h3>
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Note:</strong> To test the external API, you&apos;ll need to:
              1. Generate an API key from the &quot;Generate API Key&quot; button above
              2. Use it in the Authorization header: <code>Bearer YOUR_API_KEY</code>
            </span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-3 flex gap-2">
          <button
            onClick={fillTestNumber}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
            title="Fill test phone number"
          >
            <Phone className="w-3 h-3" />
            Fill Test Number
          </button>
          <button
            onClick={clearPhone}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
            title="Clear phone number"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (with country code)
            </label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+2349090909090"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleTestOTP}
            disabled={testing || !testPhone}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Test OTP
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          Phone number comes pre-filled for easy testing! This will send a test OTP to the phone number via WhatsApp using your internal test endpoint
        </p>
      </div>

      {/* Overview */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Api Documentation
        </h3>
        <p className="text-sm text-gray-500">Read, Generate and test our api</p>
      </div>

      {/* Raw HTTP Request */}
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Raw HTTP Request
        </h4>
        <CodeBlock label="Post">
          {`POST /api/wa-auth HTTP/1.1
Host: wendi.app
Authorization: Bearer YOUR_SECRET_TOKEN
Content-Type: application/json

{"phone": "+2349090909090"}`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Request Details
        </h4>
        <CodeBlock label="Headers">
          {`Authorization: Bearer YOUR_SECRET_TOKEN
Content-Type: application/json`}
        </CodeBlock>
        <CodeBlock label="Body Parameters">
          {`{
  "phone": "+2349090909090"
}`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Successful Response (HTTP 200 OK)
        </h4>
        <CodeBlock>
          {`{
  "success": true,
  "message": "OTP sent successfully to +2349090909090"
}`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          Possible Errors
        </h4>
        <CodeBlock>
          {`401 Unauthorized
{
  "success": false,
  "message": "Invalid phone number format"
}

400 Bad request
{
  "success": false,
  "message": "Invalid or missing authorization token"
}

500 Internal server error
{
  "success": false,
  "message": "Something went wrong. Please try again later."
}`}
        </CodeBlock>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 mt-6">
          <FaNodeJs className="w-6 h-6" />
          <h4 className="text-lg font-semibold text-gray-700">Node JS</h4>
        </div>
        <h5 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Post /api/wa-auth
        </h5>
        <CodeBlock label="Post /api/wa-auth">
          {`const axios = require('axios');
const generateOtp = async () => {
  try {
    const response = await axios.post(
      '${API_ENDPOINT}',
      { phone: "+2349090909090" },
      {
        headers: {
          'Authorization': 'Bearer YOUR_SECRET_TOKEN',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(response.data);
  } catch (err) {
    console.error(err.response.data);
  }
};`}
        </CodeBlock>
        <CodeBlock label="Request Details">
          {`Headers:
Authorization: Bearer YOUR_SECRET_TOKEN
Content-Type: application/json

Body Parameters:
{
  "phone": "+2349090909090"
}`}
        </CodeBlock>
        <CodeBlock label="Successful Response (HTTP 200 OK)">
          {`{
  "success": true,
  "message": "OTP sent successfully to +2349090909090"
}`}
        </CodeBlock>
        <CodeBlock label="Possible error">
          {`{
  "success": false,
  "message": "Invalid or missing authorization token"
}`}
        </CodeBlock>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 mt-6">
          <FaPython className="w-6 h-6" />
          <h4 className="text-lg font-semibold text-gray-700">Python</h4>
        </div>
        <h5 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Post /api/wa-auth
        </h5>
        <CodeBlock label="Post /api/wa-auth">
          {`import requests

url = "${API_ENDPOINT}"
headers = {
  "Authorization": "Bearer YOUR_SECRET_TOKEN",
  "Content-Type": "application/json"
}
data = {
  "phone": "+2349090909090"
}
response = requests.post(url, json=data, headers=headers)
print(response.json())`}
        </CodeBlock>
        <CodeBlock label="Request Details">
          {`URL:
${API_ENDPOINT}

Headers:
Authorization: Bearer YOUR_SECRET_TOKEN
Content-Type: application/json

Json Body:
{
  "phone": "+2349090909090"
}`}
        </CodeBlock>
        <CodeBlock label="Successful Response (HTTP 200 OK)">
          {`{
  "success": true,
  "message": "OTP sent successfully to +2349090909090"
}`}
        </CodeBlock>
        <CodeBlock label="Possible error">
          {`# You should check the status code and handle errors like this:
if response.status_code != 201:
    print(response.status_code, response.json())

# Example error response
{
  "success": false,
  "message": "Invalid phone number format"
}`}
        </CodeBlock>
      </div>


      <div className="pb-4"></div>
    </div>
  );
};

export default Api; 