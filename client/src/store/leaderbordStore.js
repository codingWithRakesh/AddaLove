import { create } from 'zustand';
import axios from 'axios';

const useLeaderboardStore = create((set) => ({
    leaderboard: [],
    isLoading: false,
    error: null,
    fetchLeaderboard: async (userType) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/leaderboard/v1/leaderboard/${userType}`,
                {
                    withCredentials: true,
                }
            );
            set({ leaderboard: response.data.data, isLoading: false });
            console.log('Leaderboard fetched:', response.data.data);
            return response.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    }
}));

export default useLeaderboardStore;