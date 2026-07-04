import { create } from "zustand";
import axios from "axios";

const useUserStore = create((set) => ({
    user: null,
    userRate: null,
    onlineUsers: [],
    setOnlineUsers: (users) => set({ onlineUsers: users }),
    removeOnlineUser: (userId) => {
        set((state) => ({
            onlineUsers: state.onlineUsers.filter((user) => user._id !== userId),
        }));
    },
    userRole: null,
    isLoading: false,
    error: null,
    message: null,
    isAuthenticated: false,
    fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/current-user`,
                {
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                
                set({ user: response.data.data.userInfo,userRate: response.data.data.userRateAVG ,isAuthenticated: true, userRole: response.data.data.userInfo.userType.toLowerCase(), isLoading: false });
                console.log("from store", response.data.data);
            } else {
                set({ user: null, isAuthenticated: false, userRole: null });
            }
        } catch (error) {
            set({ user: null, isAuthenticated: false, userRole: null });
            throw error;
        }
    }
}));

export default useUserStore;