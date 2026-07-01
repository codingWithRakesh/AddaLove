import './App.css'
import { useEffect, Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ToastContainer, Flip } from "react-toastify";
import { connectSocket, disconnectSocket } from './socket/socket.js';
import useUserStore from './store/userStore.js';
import useRoomStore from './store/roomStore.js';
import lodescreen from './assets/LodingScreen.mp4'
import TopNavbar from './components/TopNavbar'
import ButtomNavbar from './components/ButtomNavbar'

function App() {
  const { fetchUser, isAuthenticated, user, userRole } = useUserStore();
  const {getOpenRooms, isEnterTheRoom, startRoomSocketListeners, stopRoomSocketListeners } = useRoomStore();
  const [screenloder, setScreenloder] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadInitialData = async () => {
      setScreenloder(true);
      try {
        await fetchUser();
        await getOpenRooms();
      } catch (error) {
        disconnectSocket();
      }finally {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setScreenloder(false);
      }
    };
   console.log(location.pathname)
    loadInitialData();
  }, [fetchUser, getOpenRooms]);

  useEffect(() => {
    if (isAuthenticated && user?._id && userRole) {
      connectSocket();
      startRoomSocketListeners();
    } else {
      stopRoomSocketListeners();
      disconnectSocket();
    }
  }, [isAuthenticated, user?._id, userRole, startRoomSocketListeners, stopRoomSocketListeners]);
  
  if (screenloder) {
    return (
      <div className='h-full w-full bg-[#0c1014]'>
        <video autoPlay muted loop className='h-screen'>
          <source src={lodescreen} />
        </video>
      </div>
    )
  }
  return (
    <div className="App">
      <ToastContainer transition={Flip} />
     {isAuthenticated && !isEnterTheRoom? <TopNavbar/>:''}
      <Suspense>
        <Outlet />
      </Suspense>
      {isAuthenticated && !isEnterTheRoom?<ButtomNavbar/>:''}
    </div>
  )
}

export default App
