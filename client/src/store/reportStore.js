import { create } from "zustand";
import axios from "axios";

const useReportStore = create((set) => ({
    isLoading: false,
    error: null,
    createReport: async (reportData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/report/v1/create`,
                reportData,
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
    }
}));

export default useReportStore;