import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EnhancedSignupForm() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main signup page
    navigate("/signup", { replace: true });
  }, [navigate]);

  return <div>Redirecting to signup...</div>;
}
