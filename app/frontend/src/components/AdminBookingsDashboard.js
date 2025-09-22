import React, { useEffect, useState } from "react";

function AdminBookingsDashboard({ token }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    fetch("http://localhost:8005/admin/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch all bookings.");
        return res.json();
      })
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        setErr(err.message);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="admin-container" style={{ marginTop: "2rem" }}>
      <h2 className="page-title">All Bookings</h2>
      {loading && <p className="info-message">Loading bookings...</p>}
      {err && <p className="message error">{err}</p>}
      {(!loading && bookings.length === 0) && (
        <div className="info-message">No bookings found.</div>
      )}
      {bookings.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: "8px" }}>Booking ID</th>
              <th style={{ border: "1px solid #eee", padding: "8px" }}>User</th>
              <th style={{ border: "1px solid #eee", padding: "8px" }}>Email</th>
              <th style={{ border: "1px solid #eee", padding: "8px" }}>Event</th>
              <th style={{ border: "1px solid #eee", padding: "8px" }}>Seats</th>
              <th style={{ border: "1px solid #eee", padding: "8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.id}</td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.user_name}</td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.user_email}</td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.event_title}</td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.seats_booked}</td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminBookingsDashboard;
