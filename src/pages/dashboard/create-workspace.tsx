import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import Head from 'next/head';
import Input from '@/components/auth/Input';
import LoadingButton from '@/components/utils/LoadingButton';
import { DASHBOARD_ROUTES } from '@/libs/enums';
import { GetServerSideProps } from 'next';
import { getResellerInfo } from '@/services/session';
import Logo from '@/components/utils/Logo';

interface CreateWorkspacePageProps {
  reseller: any; 
}

const CreateWorkspacePage: React.FC<CreateWorkspacePageProps> = ({ reseller }) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  
  const validateName = (value: string) => {
    if (value.length < 3) {
      setNameError('Name must be at least 3 characters');
      return false;
    }
    setNameError('');
    return true;
  };
  
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (value.length > 0) validateName(value);
  };
  
  const handleNameBlur = () => {
    validateName(name);
  };
  
  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      toast.error('Please enter a valid workspace name (min 3 characters)');
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await axios.post('/api/workspace/create', {
        name,
        description
      });

      if (res.data?.status) {
        toast.success('Workspace created successfully!');
        router.push('/dashboard');
      } else {
        throw new Error(res.data?.message || 'Failed to create workspace');
      }
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast.error(error.response?.data?.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex "  style={{
      backgroundImage: 'url(/Background.png)'
    }} >
      <Head>
        <title>Create Workspace - Wendi</title>
      </Head>
      <div className="m-8">
           <Logo/>
          </div>
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:w-1/2">
     
       
        <div className="w-full max-w-md">
         
          
          {/* Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">Let&apos;s set up your first work space</h2>
              <p className="text-sm text-gray-500">
                Input the name for your workspace below, could be your business name, team name etc.
              </p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
              <div>
                <label htmlFor="workspace" className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace&apos;s name
                </label>
                <Input
                  id="workspace"
                  name="workspace"
                  type="text"
                  placeholder="Business name, team name"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  error={!!nameError}
                  helperText={nameError}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Tell us about your workspace"
                  value={description}
                  onChange={handleDescriptionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              
              <div>
                <LoadingButton
      
                  disabled={isLoading || !!nameError}
                  loading={isLoading}
                >
                  Create Workspace
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Right side - Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-50">
        <div 
          className="w-full max-w-md h-96 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/onboarding1.png)'
          }}
        />
      </div>
    </div>
  );
};

// Server-side props for any initial data fetching
export const getServerSideProps: GetServerSideProps = async (context) => {
  const reseller = await getResellerInfo(context.req);
  return { 
    props: { 
      reseller: JSON.parse(JSON.stringify(reseller)) // Ensure the object is serializable
    } 
  };
};

export default CreateWorkspacePage;
