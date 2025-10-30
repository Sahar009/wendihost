import React, { useState } from 'react';
import { useRouter } from 'next/router';
import ModalWrapper from "@/components/utils/ModalWrapper";
import LoadingButton from "@/components/utils/LoadingButton";
import Input from "@/components/auth/Input";
import axios from "axios";
import { toast } from "react-toastify";
import Image from "next/image"

const AccountSettings = () => {
  const router = useRouter();
  const [deleteModal, setDeleteModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const closeDelete = () => {
    setDeleteModal(false);
  };

  const closeChangePassword = () => {
    setChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const deleteAccount = async () => {
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/delete');
      
      toast.success(res.data.message);
      
      // Redirect to login page after successful deletion
      router.push('/auth/login');
      
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message || 'Failed to delete account');
      } else {
        toast.error('Failed to delete account');
        console.error(e);
      }
    }

    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success(res.data.message);
      closeChangePassword();
      
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message || 'Failed to change password');
      } else {
        toast.error('Failed to change password');
        console.error(e);
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">Account settings</h2>
      <p className="text-gray-500 mb-6">Update your account settings</p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Change Password</span>
          <button 
            className="px-4 py-2 border rounded-md"
            onClick={() => setChangePasswordModal(true)}
          >
            Change Password
          </button>
        </div>
        {/* <div className="flex items-center justify-between">
          <span>Reset Password</span>
          <button className="px-4 py-2 border rounded-md">Reset Password</button>
        </div> */}
        <div className="flex items-center justify-between">
          <span>Log out</span>
          <button
            className="px-4 py-2 border border-red-200 text-red-600 rounded-md"
            onClick={() => router.push('/dashboard/logout')}
          >
            Logout
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span>Delete Account</span>
          <button 
            className="px-4 py-2 border border-red-200 text-red-600 rounded-md"
            onClick={() => setDeleteModal(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <ModalWrapper title='Change Password' open={changePasswordModal} handleClose={closeChangePassword}>
        <div className="space-y-4 mt-6 md:px-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <Input
              type="password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <Input
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-10">
          <div className="w-24">
            <LoadingButton loading={loading} onClick={handleChangePassword} color="primary">
              Change
            </LoadingButton>
          </div>
          <div className="w-24">
            <LoadingButton onClick={closeChangePassword} color="gray">
              Cancel
            </LoadingButton>
          </div>
        </div>
      </ModalWrapper>

      {/* Delete Account Modal */}
      <ModalWrapper title='' open={deleteModal} handleClose={closeDelete}>
        <div className="flex flex-col items-center justify-center p-2">
          <div className="mb-2">
            <Image width={200} height={200} alt='delete' src={"/images/delete.png"}  />
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account</h3>
          <p className="text-center text-gray-700 mb-4 max-w-xs">
            Are you sure you want to delete this account? Know that when this is done, it cannot be reversed and all your data and settings on our database will be completely erased.
          </p>
          <div className="flex w-full gap-2 mt-2">
            <button
              className="flex-1 border border-gray-300 rounded-md py-2 font-medium text-gray-700 bg-white hover:bg-gray-100 transition"
              onClick={closeDelete}
              type="button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-md py-2 font-medium transition disabled:opacity-60"
              onClick={deleteAccount}
              type="button"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
};

export default AccountSettings; 