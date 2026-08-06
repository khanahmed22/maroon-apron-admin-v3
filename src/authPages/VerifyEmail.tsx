import { useParams } from "react-router";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function VerifyEmail() {
  const { token,role } = useParams();
  const navigate = useNavigate()

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/verify-email/${role}/${token}`
        );

        const data = await res.json();
        console.log(data);
        navigate('/login')
      } catch (err) {
        console.error(err);
      }
    };

    if (token) verify();
  }, [token]);

  return <div className="flex items-center justify-center font-bold text-2xl min-h-screen">
    <h1>Verifying Email....</h1>
  </div>;
}