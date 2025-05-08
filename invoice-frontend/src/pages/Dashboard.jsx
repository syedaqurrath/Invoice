// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { logout } = useAuth();
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/dashboard", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        logout();
        navigate("/register");
      }
    };

    fetchData();
  }, [logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/register");
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <p>{message}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
