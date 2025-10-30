import { IReduxState } from '@/libs/interfaces';
import { Conversation, Message } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

interface IState {
  value: Conversation[],
  filterBy: "open" | "closed",
  sortedBy: "open" | "closed",
  view: "all" | 'mine' | 'unassigned',
  chatId: number | null
}

const initialState : IState = {
  value: [],
  filterBy: "open",
  sortedBy: "open",
  view: 'all',
  chatId: null
};

export const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    // Action to add conversation
    addConversation: (state, action) => {
      state.value = [...state.value, action.payload];
    },
    addMessage: (state, action) => {
      state.value = [...state.value, action.payload];
    },
    setFilterBy: (state, action) => {
      state.filterBy = action.payload
    },
    setSortedBy: (state, action) => {
      state.sortedBy = action.payload
    },
    setView: (state, action) => {
      state.view = action.payload
    },
    setChatId: (state, action) => {
      state.chatId = action.payload
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

export const { addConversation, setFilterBy, setSortedBy, setChatId, setView } = conversationSlice.actions;
export const selectConversations = (state: IReduxState) => state.conversations.value;
export const getSort = (state: any) => state.conversations.sortedBy;
export const getFilter = (state: any) => state.conversations.filterBy;
export const getChatId = (state: any) => state.conversations.chatId;
export const getView = (state: any) => state.conversations.view;
export default conversationSlice.reducer;