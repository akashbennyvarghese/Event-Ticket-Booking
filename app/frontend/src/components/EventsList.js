import React, { useState, useEffect } from "react";
import EventCard from "./EventCard";

function EventsList({ token }) {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [bookingMsg, setBookingMsg] = useState({});

  const fetchEvents = () => {
    setLoading(true);
    setErr(null);
    fetch("http://localhost:8005/events", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((resp) => {
        if (!resp.ok) throw new Error("Failed to fetch events. Please log in.");
        return resp.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((e) => {
        setErr(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [token]);

  const handleBook = (eventId, seats) => {
    setBookingMsg((prev) => ({ ...prev, [eventId]: { status: "loading" } }));
    fetch("http://localhost:8005/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_id: eventId,
        seats_booked: parseInt(seats),
      }),
    })
      .then((resp) => {
        if (!resp.ok)
          return resp.json().then((d) => {
            throw new Error(d.detail || "Booking failed");
          });
        return resp.json();
      })
      .then(() => {
        setBookingMsg((prev) => ({
          ...prev,
          [eventId]: { status: "success", message: "Booking successful!" },
        }));
        fetchEvents();
      })
      .catch((e) => {
        setBookingMsg((prev) => ({
          ...prev,
          [eventId]: { status: "error", message: e.message },
        }));
      });
  };

  if (!token) {
    return (
      <div className="info-message">Please log in to view and book events.</div>
    );
  }
  if (loading) return <div className="info-message">Loading events...</div>;
  if (err) return <div className="info-message error">Error: {err}</div>;
  if (!events || events.length === 0)
    return <div className="info-message">No events found.</div>;

  return (
    <div className="events-grid">
      {events.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          onBook={handleBook}
          bookingMsg={bookingMsg[ev.id]}
        />
      ))}
    </div>
  );
}

export default EventsList;
