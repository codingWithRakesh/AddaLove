import { create } from "zustand";
import axios from "axios";
import { socket } from "../socket/socket.js";

let stopRoomSocketListeners = null;

const getRoomId = (room) => room?.roomId || room?._id;

const getSocketRoom = (payload) => {
    if (payload?.room) return payload.room;
    if (payload?.roomId && typeof payload.roomId === "object") return payload.roomId;
    if (payload?.roomId && payload?.createdBy) return payload;
    return null;
};

const getSocketRoomId = (payload) => {
    if (typeof payload?.roomId === "string") return payload.roomId;
    return getRoomId(getSocketRoom(payload));
};

const useRoomStore = create((set, get) => ({
    rooms: [],
    addRoom: (room) => {
        set((state) => {
            const incomingRoomId = getRoomId(room);
            if (!incomingRoomId) return state;

            const roomExists = state.rooms.some((item) => getRoomId(item) === incomingRoomId);
            if (roomExists) {
                return {
                    rooms: state.rooms.map((item) =>
                        getRoomId(item) === incomingRoomId ? { ...item, ...room } : item
                    ),
                };
            }
            return { rooms: [...state.rooms, room] };
        });
    },
    removeRoom: (roomId) => {
        set((state) => ({
            rooms: state.rooms.filter((room) => getRoomId(room) !== roomId),
        }));
    },
    updateRoom: (roomId, updates) => {
        if (!roomId) return;
        set((state) => ({
            rooms: state.rooms.map((room) =>
                getRoomId(room) === roomId ? { ...room, ...updates } : room
            ),
        }));
    },
    markRoomOccupied: (roomId, boyId) => get().updateRoom(roomId, {
        status: "occupied",
        currentBoy: boyId || true,
    }),
    markRoomAvailable: (roomId) => get().updateRoom(roomId, {
        status: "open",
        currentBoy: null,
        currentBoyJoinedAt: null,
        currentSessionDurationMs: null,
    }),
    startRoomSocketListeners: () => {
        if (stopRoomSocketListeners) return stopRoomSocketListeners;

        const handleRoomOpened = (payload) => {
            const room = getSocketRoom(payload);
            if (room) get().addRoom(room);
        };

        const handleRoomClosed = (payload) => {
            get().removeRoom(getSocketRoomId(payload));
        };

        const handleRoomOccupied = (payload) => {
            const room = getSocketRoom(payload);
            if (room) {
                get().addRoom(room);
                return;
            }
            get().markRoomOccupied(getSocketRoomId(payload), payload?.boyId);
        };

        const handleRoomAvailable = (payload) => {
            const room = getSocketRoom(payload);
            if (room) {
                get().addRoom(room);
                return;
            }
            get().markRoomAvailable(getSocketRoomId(payload));
        };

        socket.on("room_opened", handleRoomOpened);
        socket.on("room_closed", handleRoomClosed);
        socket.on("room_destroyed", handleRoomClosed);
        socket.on("room_occupied", handleRoomOccupied);
        socket.on("room_available", handleRoomAvailable);

        stopRoomSocketListeners = () => {
            socket.off("room_opened", handleRoomOpened);
            socket.off("room_closed", handleRoomClosed);
            socket.off("room_destroyed", handleRoomClosed);
            socket.off("room_occupied", handleRoomOccupied);
            socket.off("room_available", handleRoomAvailable);
            stopRoomSocketListeners = null;
        };

        return stopRoomSocketListeners;
    },
    stopRoomSocketListeners: () => {
        if (stopRoomSocketListeners) stopRoomSocketListeners();
    },
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
            set({ room: response.data.data, isLoading: false, isEnterTheRoom: true });
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
            set((state) => ({
                room: null,
                isLoading: false,
                isEnterTheRoom: false,
                rooms: state.rooms.filter((room) => getRoomId(room) !== roomId),
            }));
            console.log("Room destroyed:", response.data.data);
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
            set((state) => ({
                room: response.data.data,
                isLoading: false,
                isEnterTheRoom: true,
                rooms: state.rooms.map((room) =>
                    getRoomId(room) === roomId
                        ? { ...room, status: "occupied", currentBoy: true }
                        : room
                ),
            }));
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
            set((state) => ({
                room: null,
                isLoading: false,
                isEnterTheRoom: false,
                rooms: state.rooms.map((room) =>
                    getRoomId(room) === roomId
                        ? { ...room, status: "open", currentBoy: null, currentBoyJoinedAt: null, currentSessionDurationMs: null }
                        : room
                ),
            }));
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
