import './App.css'
import { useEffect, Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ToastContainer, Flip } from "react-toastify";
import { connectSocket, disconnectSocket } from './socket/socket.js';
import useUserStore from './store/userStore.js';
import useRoomStore from './store/roomStore.js';
import lodescreen from './assets/LodingScreen.mp4'
import TopNavbar from './components/TopNavbar'
import ButtomNavbar from './components/ButtomNavbar'

function App() {
  const { fetchUser, isAuthenticated, user, userRole } = useUserStore();
  const {getOpenRooms} = useRoomStore();
  const [screenloder, setScreenloder] = useState(true)

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

    loadInitialData();
  }, [fetchUser, getOpenRooms]);

  useEffect(() => {
    if (isAuthenticated && user?._id && userRole) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user?._id, userRole]);
  
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
      <TopNavbar/>
      <Suspense>
        <Outlet />
      </Suspense>
      <ButtomNavbar/>
    </div>
  )
}

export default App
