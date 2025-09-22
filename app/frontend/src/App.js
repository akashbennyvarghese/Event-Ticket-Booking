import React, { useState, useEffect } from "react";
import "./App.css";

import EventsList from "./components/EventsList";
import MyBookings from "./components/MyBookings";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import AdminEvents from "./components/AdminEvents";
import AdminBookingsDashboard from "./components/AdminBookingsDashboard";
import Header from "./components/Header";
import { saveToken, loadToken, clearToken } from "./auth";

function App() {
  const [page, setPage] = useState("events");
  const [token, setToken] = useState(loadToken());
  const [authed, setAuthed] = useState(!!loadToken());
  const [userRole, setUserRole] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (token) {
      fetch("http://localhost:8005/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Could not fetch user info");
          return res.json();
        })
        .then((data) => {
          setUserRole(data.role);
          setAuthed(true);
        })
        .catch(() => {
          setAuthed(false);
          setUserRole(null);
          clearToken();
          setToken(null);
        });
    } else {
      setAuthed(false);
      setUserRole(null);
    }
  }, [token]);

  function handleLogin(tok) {
    saveToken(tok);
    setToken(tok);
    setAuthed(true);
    setPage("events");
  }

  function handleLogout() {
    clearToken();
    setToken(null);
    setAuthed(false);
    setUserRole(null);
    setPage("login");
  }

  function goToSignup() {
    setPage("signup");
  }

  function goToLogin() {
    setPage("login");
  }

  function afterSignup() {
    setMsg("Sign up successful! Please log in.");
    setPage("login");
  }

  return (
    <div className="container">
      <Header
        page={page}
        setPage={setPage}
        authed={authed}
        userRole={userRole}
        handleLogout={handleLogout}
      />
      <div className="page-content">
        {msg && (
          <div className="message success" style={{ marginBottom: "12px" }}>
            {msg}
          </div>
        )}
        {page === "events" && <EventsList token={token} />}
        {page === "mybookings" && authed && <MyBookings token={token} />}
        {page === "login" && (
          <LoginForm onLogin={handleLogin} goToSignup={goToSignup} />
        )}
        {page === "signup" && (
          <SignupForm onSignup={afterSignup} goToLogin={goToLogin} />
        )}
        {page === "mybookings" && !authed && (
          <p>You must be logged in to view your bookings.</p>
        )}
        {page === "admin" && userRole === "admin" && (
          <>
            <AdminEvents token={token} />
            <AdminBookingsDashboard token={token} />
          </>
        )}
        {page === "admin" && userRole !== "admin" && (
          <p>Access denied. You must be an admin to view this page.</p>
        )}
      </div>
    </div>
  );
}

export default App;
