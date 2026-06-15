import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ToastContainer, Flip } from "react-toastify";
import { useUserData } from './context/UserdataContext';
import lodescreen from './assets/LodingScreen.mp4'
import TopNavbar from './components/TopNavbar'
import ButtomNavbar from './components/ButtomNavbar'
function App() {
  const { setUseralldata } = useUserData();
  const [screenloder, setScreenloder] = useState(true)
  const naviget = useNavigate();
  useEffect(() => {
    const fecthCurrentUserData = async () => {
      setScreenloder(true)
      
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/current-user`
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include',
        })
        const data = await res.json();
        console.log(data)
        if(!data.success){
          return naviget('/login')
        }
        setUseralldata(data.data.userData);
      } catch (error) {
        console.log(error)
      } finally {
        // await new Promise(resolve => setTimeout(resolve, 10000));
        setScreenloder(false)
      }
    }
    fecthCurrentUserData();
  }, [])
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
