import React, { useState } from "react";

function BookingForm({ eventId, onBook, message, availableSeats }) {
  const [seats, setSeats] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const isBookingLoading = message?.status === "loading";

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)} className="book-now-btn">
        Book Now
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onBook(eventId, seats);
      }}
      className="booking-form"
    >
      <input
        type="number"
        value={seats}
        onChange={(e) => setSeats(e.target.value)}
        min="1"
        max={availableSeats}
        required
      />
      <button type="submit" disabled={isBookingLoading}>
        {isBookingLoading ? "Booking..." : "Confirm"}
      </button>
      {message?.status === "success" && (
        <p className="message success">{message.message}</p>
      )}
      {message?.status === "error" && (
        <p className="message error">{message.message}</p>
      )}
    </form>
  );
}

function EventCard({ event, onBook, bookingMsg }) {
  const isSoldOut = event.available_seats <= 0;
  const defaultImageUrl = "https:/media.istockphoto.com/id/1500283713/vector/cinema-ticket-on-white-background-movie-ticket-on-white-background.jpg?s=612x612&w=0&k=20&c=4J15lHFXyjEs6xBoagcZqq5GYHKk5sMwCJRP8pNM3Zg=";

  return (
    <div className="event-card">
      <div className="event-card-image">
        <img
          src={defaultImageUrl}
          alt="Event Tickets"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div className="event-card-content">
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-info">
          Location: {event.location}
          <br />
          Date: {new Date(event.date).toLocaleString()}
          <br />
          Seats: {event.available_seats} / {event.total_seats}
        </p>
        {isSoldOut ? (
          <p className="sold-out">Sold Out!</p>
        ) : (
          <BookingForm
            eventId={event.id}
            onBook={onBook}
            message={bookingMsg}
            availableSeats={event.available_seats}
          />
        )}
      </div>
    </div>
  );
}

export default EventCard;
