import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Singup from './pages/Singup.jsx'
import Login from './pages/Login.jsx'
import SignupGirls from './pages/SignupGirls.jsx'
import CheckApplication from './pages/CheckApplication.jsx'
import GirlsLogin from './pages/GirlsLogin.jsx'
import AddaLoveRecharge from './pages/Wallet.jsx'
import TranscationHistory from './pages/TranscationHistory.jsx'
// import MessageRoom from './pages/MessageRoom.jsx'
// import AudioRoom from './pages/AudioRoom.jsx'
// import VideoRoom from './pages/VideoRoom.jsx'
// import History from './pages/History.jsx'
import { AuthenticatedUserRoute, ProtectRoute } from './utils/ProtectRoute.jsx'
import MessageRoom from './pages/MessageRoom.jsx'
// import Tmp from './pages/Tmp.jsx'
import { UserdataProvider } from './context/UserdataContext.jsx'
import Profile from './pages/Profile.jsx'
import Earning from './pages/Earning.jsx'
import WithdrawMoney from './pages/WithdrawMoney.jsx'
import AudioRoom from './pages/AudioRoom.jsx'
import SendOtp from './pages/SendOtp.jsx'
import ForgetPassword from './pages/ForgetPassword.jsx'
import Leaderboard from './pages/Leaderboard.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <div>404 Not Found</div>,
    element: <App />,
    children: [
      {
        path: "/",
        element: <ProtectRoute><Home /></ProtectRoute>
      },
      {
        path: "/signup",
        element: <AuthenticatedUserRoute><Singup /></AuthenticatedUserRoute>
      },
      {
        path: "/login",
        element: <AuthenticatedUserRoute><Login /></AuthenticatedUserRoute>

      },
      {
        path: "/forget-password",
        element: <AuthenticatedUserRoute><ForgetPassword /></AuthenticatedUserRoute>

      },
      {
        path: "/sendotp",
        element: <ProtectRoute><SendOtp /></ProtectRoute>

      },
      {
        path: "/signupgirl",
        element: <AuthenticatedUserRoute><SignupGirls /></AuthenticatedUserRoute>

      },
      {
        path: "/check-application",
        element: <AuthenticatedUserRoute><CheckApplication /></AuthenticatedUserRoute>

      },
      {
        path: "/girlslogin",
        element: <AuthenticatedUserRoute><GirlsLogin /></AuthenticatedUserRoute>

      },
      {
        path: "/wallet",
        element: <ProtectRoute><AddaLoveRecharge /></ProtectRoute>

      },
      {
        path: "/transcation-history",
        element: <ProtectRoute><TranscationHistory /></ProtectRoute>
      },
      {
        path: "/profile",
        element: <ProtectRoute><Profile /></ProtectRoute>
      },
      {
        path: "/earning",
        element: <ProtectRoute><Earning /></ProtectRoute>
      },
      {
        path: "/withdraw",
        element: <ProtectRoute><WithdrawMoney /></ProtectRoute>
      },
      {
        path: "/leaderboard",
        element: <ProtectRoute><Leaderboard /></ProtectRoute>
      },
      {
        path: "/messageRoom/:roomId",
        element: <ProtectRoute><MessageRoom /></ProtectRoute>
      },
      {
        path: "/voiceRoom/:roomId",
        element: <ProtectRoute><AudioRoom /></ProtectRoute>
      },
      // {
      //   path: "/videoRoom/:roomId",
      //   element: <ProtectRoute><VideoRoom /></ProtectRoute>
      // },
      // {
      //   path: "/history",
      //   element: <ProtectRoute><History /></ProtectRoute>
      // },
      // {
      //   path: "/tmp",
      //   element: <Tmp />
      // }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserdataProvider>
    <RouterProvider router={router} />
    </UserdataProvider>
  </StrictMode>
)
