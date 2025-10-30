import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { conversationSlice } from './slices/conversationSlice';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist'
import { messagesSlice } from './slices/messageSlice';
import { chatbotBuilderSlice } from './slices/chatbotBuilderSlice';
import { systemSlice } from './slices/system';

const persistConfig = {
  key: 'root',
  storage,
}

const rootReducer = combineReducers({ 
  [systemSlice.name]: systemSlice.reducer,
  [conversationSlice.name]: conversationSlice.reducer,
  [messagesSlice.name]: messagesSlice.reducer,
  [chatbotBuilderSlice.name]: chatbotBuilderSlice.reducer,
})
  
const persistedReducer = persistReducer(persistConfig, rootReducer)


export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store)