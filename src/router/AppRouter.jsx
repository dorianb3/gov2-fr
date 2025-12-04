// src/router/AppRouter.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import AppLayout from "../layout/AppLayout"

// Pages principales
import Home from "../pages/Home"
import Login from "../pages/Login"

// Nouvelle vue compacte
import Agora from "../pages/Agora/Agora"

// Détail d'une proposition
import ProposalDetail from "../pages/ProposalDetail"

import Activity from "../pages/Activity"
import Profile from "../pages/Profile"  // <--- AJOUT

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // HOME
      { index: true, element: <Home /> },

      // AUTH
      { path: "login", element: <Login /> },

      // VUE PRINCIPALE COMPACTE
      { path: "agora", element: <Agora /> },

      // PROPOSITION DETAIL
      { path: "proposals/:id", element: <ProposalDetail /> },

      // ACTIVITY FEED (à implémenter plus tard)
      { path: "activity", element: <Activity /> },

      // PROFILE PUBLIC + MON PROFIL
      { path: "profile", element: <Profile /> },       // mon profil
      { path: "profile/:id", element: <Profile /> },   // profil public d'un user
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
