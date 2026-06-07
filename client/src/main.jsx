import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom"
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Singup from './pages/Singup.jsx'
import Login from './pages/login.jsx'
import SignupGirls from './pages/SignupGirls.jsx'
import CheckApplication from './pages/CheckApplication.jsx'
import GirlsLogin from './pages/GirlsLogin.jsx'
import AddaLoveRecharge from './pages/Wallet.jsx'
import TranscationHistory from './pages/TranscationHistory.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <div>404 Not Found</div>,
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/signup",
        element: <Singup />
      },
      {
        path: "/login",
        element: <Login />

      },
      {
        path: "/signupgirl",
        element: <SignupGirls />

      },
      {
        path: "/check-application",
        element: <CheckApplication />

      },
      {
        path: "/girlslogin",
        element: <GirlsLogin />

      },
      {
        path: "/wallet",
        element: <AddaLoveRecharge />

      },
      {
        path: "/transcation-history",
        element: <TranscationHistory />

      },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
