import React, { useState } from "react";

function SignupForm({ onSignup, goToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    fetch("http://localhost:8005/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })
      .then((resp) => {
        if (!resp.ok)
          return resp.json().then((d) => {
            throw new Error(d.detail || "Signup failed");
          });
        return resp.json();
      })
      .then(() => {
        setMsg("Sign up successful! Please log in.");
        onSignup();
      })
      .catch((err) => setError(err.message));
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Sign Up</h2>
      {error && <div className="message error">{error}</div>}
      {msg && <div className="message success">{msg}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            value={email}
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="new-password"
          />
        </div>
        <button type="submit">Sign Up</button>
        <button type="button" onClick={goToLogin} className="secondary-btn">
          Back to Login
        </button>
      </form>
    </div>
  );
}

export default SignupForm;
