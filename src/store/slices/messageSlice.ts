import { Message } from '@prisma/client';
import { createSlice } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

interface IState {
  value: Message[]
}

const initialState : IState = {
  value: [],
};

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.value =  [...state.value, action.payload];
    },
    loadMessage: (state, action) => {
      state.value =  action.payload;
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

export const { addMessage, loadMessage } = messagesSlice.actions;
export const fetchMessages = (state: any) => state.messages.value;
export default messagesSlice.reducer;