import React, { useState, useEffect } from "react";

function AdminEvents({ token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createTitle, setCreateTitle] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createSeats, setCreateSeats] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const fetchAdminEvents = () => {
    setLoading(true);
    fetch("http://localhost:8005/events", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch events as admin.");
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminEvents();
  }, [token]);

  const handleCreate = (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    const newEvent = {
      title: createTitle,
      location: createLocation,
      date: new Date(createDate).toISOString(),
      total_seats: parseInt(createSeats, 10),
    };

    fetch("http://localhost:8005/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newEvent),
    })
      .then((res) => {
        if (!res.ok)
          throw new Error("Failed to create event. Is this user an admin?");
        return res.json();
      })
      .then(() => {
        setMsg("Event created successfully!");
        setCreateTitle("");
        setCreateLocation("");
        setCreateDate("");
        setCreateSeats("");
        fetchAdminEvents();
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const handleDelete = (eventId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    ) {
      fetch(`http://localhost:8005/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete event.");
          setMsg("Event deleted successfully!");
          fetchAdminEvents();
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  };

  if (loading) return <div className="info-message">Loading admin view...</div>;

  return (
    <div className="admin-container">
      <h2 className="page-title">Manage Events</h2>
      <div className="create-event-form">
        <h3>Create New Event</h3>
        {msg && <p className="message success">{msg}</p>}
        {error && <p className="message error">{error}</p>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={createLocation}
              onChange={(e) => setCreateLocation(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Total Seats</label>
            <input
              type="number"
              value={createSeats}
              onChange={(e) => setCreateSeats(e.target.value)}
              min="1"
              required
            />
          </div>
          <button type="submit">Create Event</button>
        </form>
      </div>

      <div className="event-list-admin">
        <h3>All Events</h3>
        {events.length > 0 ? (
          <ul className="admin-events-list">
            {events.map((ev) => (
              <li key={ev.id} className="admin-event-item">
                <div>
                  {ev.title} - {ev.location}
                  <br />
                  Date: {new Date(ev.date).toLocaleString()}
                  <br />
                  Seats: {ev.available_seats} / {ev.total_seats}
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No events to manage.</p>
        )}
      </div>
    </div>
  );
}

export default AdminEvents;
