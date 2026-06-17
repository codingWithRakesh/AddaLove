import { create } from 'zustand';
import axios from 'axios';

const useMessageStore = create((set) => ({
    messages: [],
    isLoading: false,
    error: null,
    addMessage: (message) => {
        set((state) => {
            if (message?._id && state.messages.some((item) => item._id === message._id)) {
                return state;
            }

            return { messages: [...state.messages, message] };
        });
    },
    clearMessages: () => set({ messages: [] }),
    getMessages: async (roomId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/${roomId}/messages`,
                {
                    withCredentials: true,
                }
            );
            set({ messages: response.data.data.messages, isLoading: false });
            console.log("Messages retrieved:", response.data.data.messages);
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },
    sendMessage: async (roomId, messageData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/${roomId}/message`,
                messageData,
                {
                    withCredentials: true,
                }
            );
            set({ isLoading: false });
            console.log("Message sent:", response.data.data);
            return response.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    }
}));

export default useMessageStore;
