import React, { useEffect } from "react";

export default function EnhancedSignupForm() {
  useEffect(() => {
    window.location.href = "/signup-enhanced.html";
  }, []);

  return <div>Redirecting...</div>;
}
