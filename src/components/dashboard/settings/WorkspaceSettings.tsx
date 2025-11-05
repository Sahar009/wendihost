import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModalWrapper from "@/components/utils/ModalWrapper";
import LoadingButton from "@/components/utils/LoadingButton";
import axios from "axios";
import { toast } from "react-toastify";
import Image from "next/image";
import { Phone } from "lucide-react";

interface Workspace {
  id: number;
  name: string;
  description: string;
  phone: string | null;
  phoneId?: string | null;
  whatsappId?: string | null;
  businessId?: string | null;
  accessToken?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerId: number;
}

interface WorkspaceSettingsProps {
  userId: number;
  workspaces: Workspace[];
}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ userId, workspaces: initialWorkspaces }) => {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces || []);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [removePhoneModal, setRemovePhoneModal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingPhone, setRemovingPhone] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [workspaceToRemovePhone, setWorkspaceToRemovePhone] = useState<Workspace | null>(null);

  useEffect(() => {
    setWorkspaces(initialWorkspaces || []);
  }, [initialWorkspaces]);

  const openDeleteModal = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setDeleteModal(workspace.id);
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setWorkspaceToDelete(null);
  };

  const openRemovePhoneModal = (workspace: Workspace) => {
    setWorkspaceToRemovePhone(workspace);
    setRemovePhoneModal(workspace.id);
  };

  const closeRemovePhoneModal = () => {
    setRemovePhoneModal(null);
    setWorkspaceToRemovePhone(null);
  };

  const removePhoneNumber = async () => {
    if (!workspaceToRemovePhone) return;

    setRemovingPhone(true);

    try {
      const res = await axios.delete(`/api/${workspaceToRemovePhone.id}/settings/remove-phone`);
      
      toast.success(res.data.message);
      
      // Update the workspace in the list
      setWorkspaces(prev => prev.map(w => 
        w.id === workspaceToRemovePhone.id 
          ? { ...w, phone: null, phoneId: null, whatsappId: null, businessId: null, accessToken: null }
          : w
      ));
      
      closeRemovePhoneModal();
      
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message || 'Failed to remove phone number');
      } else {
        toast.error('Failed to remove phone number');
        console.error(e);
      }
    }

    setRemovingPhone(false);
  };

  const deleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setLoading(true);

    try {
      const res = await axios.delete(`/api/${workspaceToDelete.id}/settings/delete`);
      
      toast.success(res.data.message);
      
      // Remove the deleted workspace from the list
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceToDelete.id));
      
      // If we're currently viewing the deleted workspace, redirect to dashboard
      if (router.pathname.includes('/dashboard')) {
        router.push('/dashboard');
      }
      
      closeDeleteModal();
      
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast.error(e?.response?.data?.message || 'Failed to delete workspace');
      } else {
        toast.error('Failed to delete workspace');
        console.error(e);
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">Workspace Management</h2>
      <p className="text-gray-500 mb-6">Manage your workspaces. You can only delete workspaces you own.</p>
      
      {workspaces.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No workspaces found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workspaces.map((workspace) => {
            const isOwner = workspace.ownerId === userId;
            return (
              <div
                key={workspace.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{workspace.name}</h3>
                    {isOwner && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{workspace.description || 'No description'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {(workspace.phone || workspace.phoneId) && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{workspace.phone || 'Connected'}</span>
                      </span>
                    )}
                    <span>
                      Created: {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* {isOwner && (workspace.phone || workspace.phoneId) && (
                    <button
                      className="px-4 py-2 border border-orange-200 text-orange-600 rounded-md hover:bg-orange-50 transition text-sm"
                      onClick={() => openRemovePhoneModal(workspace)}
                    >
                      Remove Phone
                    </button>
                  )} */}
                  {isOwner ? (
                    <button
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition"
                      onClick={() => openDeleteModal(workspace)}
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                      Cannot delete
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Workspace Modal */}
      <ModalWrapper title='' open={deleteModal !== null} handleClose={closeDeleteModal}>
        <div className="flex flex-col items-center justify-center p-2">
          <div className="mb-2">
            <Image width={200} height={200} alt='delete' src={"/images/delete.png"} />
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Delete Workspace</h3>
          <p className="text-center text-gray-700 mb-4 max-w-xs">
            Are you sure you want to delete <strong>&quot;{workspaceToDelete?.name}&quot;</strong>? 
            This action cannot be reversed and will permanently delete all data associated with this workspace, including:
            <ul className="list-disc list-inside mt-2 text-sm text-left space-y-1">
              <li>Contacts and conversations</li>
              <li>Chatbots and automation</li>
              <li>Campaigns and broadcasts</li>
              <li>Templates and snippets</li>
              <li>Meta Ads and integrations</li>
              <li>All other workspace data</li>
            </ul>
          </p>
          <div className="flex w-full gap-2 mt-2">
            <button
              className="flex-1 border border-gray-300 rounded-md py-2 font-medium text-gray-700 bg-white hover:bg-gray-100 transition"
              onClick={closeDeleteModal}
              type="button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-md py-2 font-medium transition disabled:opacity-60"
              onClick={deleteWorkspace}
              type="button"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Workspace'}
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* Remove Phone Number Modal */}
      <ModalWrapper title='' open={removePhoneModal !== null} handleClose={closeRemovePhoneModal}>
        <div className="flex flex-col items-center justify-center p-2">
          <h3 className="text-xl font-bold text-orange-600 mb-2">Remove Phone Number</h3>
          <p className="text-center text-gray-700 mb-4 max-w-xs">
            Are you sure you want to remove the phone number from <strong>&quot;{workspaceToRemovePhone?.name}&quot;</strong>? 
            This will disconnect the WhatsApp Business account from this workspace. You can reconnect it later if needed.
          </p>
          <div className="flex w-full gap-2 mt-2">
            <button
              className="flex-1 border border-gray-300 rounded-md py-2 font-medium text-gray-700 bg-white hover:bg-gray-100 transition"
              onClick={closeRemovePhoneModal}
              type="button"
              disabled={removingPhone}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md py-2 font-medium transition disabled:opacity-60"
              onClick={removePhoneNumber}
              type="button"
              disabled={removingPhone}
            >
              {removingPhone ? 'Removing...' : 'Remove Phone'}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
};

export default WorkspaceSettings;
