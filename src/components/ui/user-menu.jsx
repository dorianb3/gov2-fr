// src/components/ui/user-menu.jsx
import { supabase } from "@/supabase/client"
import { useAuth } from "@/context/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function UserMenu() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  if (!session) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/80"
      >
        Login
      </Link>
    )
  }

  const user = session.user
  const email = user.email ?? "User"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarImage src={session?.user?.avatar_url} />
          <AvatarFallback>
            {email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled className="opacity-80">
          {email}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
