import { create } from "zustand";
import axios from "axios";

const useRatingStore = create((set) => ({
    isLoading: false,
    error: null,
    createRating: async (ratingData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/rating/v1/create`,
                ratingData,
                {
                    withCredentials: true,
                }
            );
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ isLoading: false, error: error.response?.data || error.message });
            throw error;
        }
    },
    checkRating: async (ratedUserId) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/rating/v1/check`,
                { ratedUserId },
                {
                    withCredentials: true,
                }
            );
            return response.data.data?.hasRated || false;
        } catch (error) {
            set({ error: error.response?.data || error.message });
            throw error;
        }
    }
}));

export default useRatingStore;
