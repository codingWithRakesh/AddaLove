import { create } from "zustand";
import axios from "axios";

const useRoomStore = create((set) => ({
    rooms: [],
    room: null,
    isLoading: false,
    error: null,
    isEnterTheRoom:false,
    resetRoomState: () => set({ room: null, isEnterTheRoom: false, error: null }),
    getOpenRooms: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/openRooms`,
                {
                    withCredentials: true,
                }
            );
            set({ rooms: response.data.data, isLoading: false });
            console.log("Open rooms retrieved:", response.data.data);
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },
    createRoom: async (roomType, languages) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/create`,
                { roomType, languages },
                {
                    withCredentials: true,
                }
            );
            set({ room: response.data.data, isLoading: false , isEnterTheRoom:true });
            console.log("Room created:", response.data.data);
            return response.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },
    destroyRoom: async (roomId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/destroy/${roomId}`,
                {
                    withCredentials: true,
                }
            );
            set({ room: null, isLoading: false ,isEnterTheRoom:false });
            console.log("Room destroyed:", response.data.data );
            return response.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },
    joinRoom: async (roomId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/join/${roomId}`,
                { roomId },
                {
                    withCredentials: true,
                }
            );
            set({ room: response.data.data, isLoading: false ,isEnterTheRoom:true });
            console.log("Room joined:", response.data.data);
            return response.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },
    leaveRoom: async (roomId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/leave/${roomId}`,
                {},
                {
                    withCredentials: true,
                }
            );
            set({ room: null, isLoading: false ,isEnterTheRoom:false});
            console.log("Room left:", response.data.data);
            return response.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    },
    getRoomDetails: async (roomId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/rooms/v1/${roomId}/details`,
                {
                    withCredentials: true,
                }
            );
            set({ room: response.data.data, isLoading: false });
            console.log("Room details:", response.data.data);
            return response.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, isLoading: false });
            throw error;
        }
    }
}));

export default useRoomStore;
