import React from "react";

function Header({ page, setPage, authed, userRole, handleLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="logo" onClick={() => setPage("events")}>
          Event<span className="logo-highlight">Booking</span>
        </h1>
        <button
          onClick={() => setPage("events")}
          className={page === "events" ? "active" : ""}
        >
          Browse Events
        </button>
        {authed && (
          <button
            onClick={() => setPage("mybookings")}
            className={page === "mybookings" ? "active" : ""}
          >
            My Bookings
          </button>
        )}
        {userRole === "admin" && (
          <button
            onClick={() => setPage("admin")}
            className={page === "admin" ? "active" : ""}
          >
            Manage Events
          </button>
        )}
      </div>
      <div className="navbar-right">
        {!authed && (
          <>
            <button
              onClick={() => setPage("login")}
              className={page === "login" ? "active" : ""}
            >
              Login
            </button>
            <button
              onClick={() => setPage("signup")}
              className={page === "signup" ? "active" : ""}
            >
              Sign Up
            </button>
          </>
        )}
        {authed && (
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Header;
