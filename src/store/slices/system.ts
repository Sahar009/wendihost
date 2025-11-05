import { Workspace } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';

interface IState {
    current: Workspace & { lastSyncAt: Date | null; facebookAppId?: string | null; facebookConfigId?: string | null; facebookPageId?: string | null },
    all: Workspace[]
}

const initialState : IState = {
  current: {
    id: 0,
    name: '',
    description: '',
    workspaceId: '',
    ownerId: 0,
    fbUserId: null,
    facebookAppId: null,
    facebookConfigId: null,
    facebookPageId: null,
    phone: null,
    accessToken: null,
    businessId: null,
    whatsappId: null,
    phoneId: null,
    apiKey: null,
    sync: false,
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  all: []
};

export const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    // Action to add conversation
    setCurrentWorkspace: (state, action) => {
      state.current = action.payload
    },
    setAllWorkspace: (state, action) => {
      state.all = action.payload
    },
   

    // Special reducer for hydrating the state
    // extraReducers: {
    //   [HYDRATE]: (state, action) => {
    //     return {
    //       ...state,
    //       ...action.payload.conversations,
    //     };
    //   },
    // },
  },
});

export const { setAllWorkspace, setCurrentWorkspace } = systemSlice.actions;
export const getCurrentWorkspace = (state: any) => state.system.current;
export const getAllWorkspace = (state: any) => state.system.all;

export default systemSlice.reducer;