import React, { useState } from "react";

function LoginForm({ onLogin, goToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);

    fetch("http://localhost:8005/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })
      .then((resp) => {
        if (!resp.ok) throw new Error("Invalid credentials");
        return resp.json();
      })
      .then((data) => {
        if (data.access_token) {
          onLogin(data.access_token);
        } else {
          setError("No token received from server.");
        }
      })
      .catch((err) => setError(err.message));
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Login</h2>
      {error && <div className="message error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit">Log in</button>
        <button type="button" onClick={goToSignup} className="secondary-btn">
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
