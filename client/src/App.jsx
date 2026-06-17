import './App.css'
import { useEffect, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { ToastContainer, Flip } from "react-toastify";
import { connectSocket, disconnectSocket } from './socket/socket.js';
import useUserStore from './store/userStore.js';
import useRoomStore from './store/roomStore.js';
function App() {
  const { fetchUser, isAuthenticated, user, userRole } = useUserStore();
  const {getOpenRooms} = useRoomStore();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchUser();
        await getOpenRooms();
      } catch (error) {
        disconnectSocket();
      }
    };

    loadInitialData();
  }, [fetchUser, getOpenRooms]);

  useEffect(() => {
    if (isAuthenticated && user?._id && userRole) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user?._id, userRole]);

  return (
    <div className="App">
      <ToastContainer transition={Flip} />
      <Suspense>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default App
