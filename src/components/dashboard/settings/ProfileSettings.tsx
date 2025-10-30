import React, { useState, useEffect } from 'react';
import Input from "@/components/auth/Input";
import LoadingButton from "@/components/utils/LoadingButton";
import axios from "axios";
import { toast } from "react-toastify";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const ProfileSettings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('/api/auth/profile');
      const userData = res.data.data;
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || ''
      });
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message || 'Failed to fetch profile');
      } else {
        toast.error('Failed to fetch profile');
        console.error(e);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/update-profile', formData);
      
      toast.success(res.data.message);
      
      // Update local user state with new data
      if (res.data.data) {
        setUser(res.data.data);
      }
      
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message || 'Failed to update profile');
      } else {
        toast.error('Failed to update profile');
        console.error(e);
      }
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">Profile Info</h2>
      <p className="text-gray-500 mb-6">Update your profile info</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">First name</label>
            <Input
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Last name</label>
            <Input
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled
          />
        </div>
        {/* <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-gray-700 mb-1">Your profile photo</span>
            <span className="text-xs text-gray-400 mb-2">This will be displayed on your profile</span>
            <div className="w-20 h-20 rounded-full bg-gray-200 mb-2 flex items-center justify-center">
              <span className="text-gray-500 text-2xl">
                {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-1">Upload photo</label>
            <div className="w-full h-20 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md bg-gray-50 cursor-pointer">
              <span className="text-gray-400">Click to upload image</span>
            </div>
          </div>
        </div> */}
        <div>
          <label className="block text-gray-700 mb-1">Email Verification Status</label>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs ${
              user.emailVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.emailVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
        </div>
        <div className="flex justify-end">
          <LoadingButton 
            loading={loading} 
           
            color="primary"
            className="px-8 py-2"
          >
            Save Changes
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings; 