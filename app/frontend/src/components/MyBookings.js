import React, { useState, useEffect } from "react";

function MyBookings({ token, fetchEvents }) {
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [cancelMsg, setCancelMsg] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    setErr(null);
    fetch("http://localhost:8005/bookings/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((resp) => {
        if (!resp.ok) throw new Error("Failed to fetch bookings");
        return resp.json();
      })
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((e) => {
        setErr(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  const handleCancelBooking = (bookingId) => {
    setCancelMsg(null);
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      fetch(`http://localhost:8005/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((resp) => {
          if (!resp.ok)
            return resp.json().then((d) => {
              throw new Error(d.detail || "Cancellation failed");
            });
          setCancelMsg("Booking cancelled successfully!");
          fetchBookings();
          if (fetchEvents) {
            fetchEvents();
          }
        })
        .catch((e) => {
          setCancelMsg(`Cancellation failed: ${e.message}`);
        });
    }
  };

  if (loading)
    return <div className="info-message">Loading your bookings...</div>;
  if (err)
    return (
      <div className="info-message error">
        Error: {err}. Please log in and try again.
      </div>
    );
  if (!bookings || bookings.length === 0)
    return <div className="info-message">You have no bookings yet.</div>;

  return (
    <div>
      <h2 className="page-title">My Bookings</h2>
      {cancelMsg && <div className="message success">{cancelMsg}</div>}
      <ul className="booking-list">
        {bookings.map((b) => (
          <li key={b.id} className="booking-item">
            <div>
              Event ID: {b.event_id}
              <br />
              Seats booked: {b.seats_booked}
              <br />
              Status: {b.status}
            </div>
            {b.status !== "cancelled" && (
              <button onClick={() => handleCancelBooking(b.id)}>
                Cancel Booking
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyBookings;
