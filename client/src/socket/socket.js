import { io } from "socket.io-client";
import useUserStore from "../store/userStore.js";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
});

let currentAuthKey = null;

export const connectSocket = () => {
  const { userRole, user } = useUserStore.getState();

  if (!user?._id || !["boy", "girl"].includes(userRole)) {
    return;
  }

  const authKey = `${user._id}:${userRole}`;

  if ((socket.connected || socket.active) && currentAuthKey === authKey) {
    return;
  }

  socket.auth = {
    userId: user._id,
    userType: userRole,
  };
  currentAuthKey = authKey;

  socket.connect();
};

socket.on("connect_error", () => {
  currentAuthKey = null;
});

export const disconnectSocket = () => {
  currentAuthKey = null;
  if (socket.connected || socket.active) {
    socket.disconnect();
  }
};

export { socket };
