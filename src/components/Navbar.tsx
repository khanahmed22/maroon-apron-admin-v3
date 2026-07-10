import { UserAuth } from "../context/AuthContext"
import { Link } from "react-router"
export default function Navbar(){
  const {session} = UserAuth()
  return(
    <nav>
      <div>
        navbar
      </div>
    </nav>
  )
}