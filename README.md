# Event Booking System

A full-stack app for managing and booking events, with separate admin and user functionalities.

## Features

- **User Registration & Login**: Sign up and log in securely with JWT authentication.
- **Browse Events**: All users can browse upcoming events.
- **Book Events**: Authenticated users can book seats for events.
- **Manage Bookings**: Users can view and cancel their own bookings.
- **Admin Dashboard**:
  - Create, update, or delete events.
  - View all bookings across the system, including user and event details.

## Tech Stack

- **Backend**: FastAPI (Python), PostgreSQL, SQLAlchemy, Redis (caching)
- **Frontend**: React.js
- **Auth**: JWT tokens

---

## How to Run

### Prerequisites

- Docker & Docker Compose (recommended)
OR
- Python 3.9+, Node.js, PostgreSQL, and Redis installed locally

---

### 1. Clone the Repository

```bash
git clone https://github.com/akashbennyvarghese/Event-Ticket-Booking.git
cd event-booking-system
```

---

### 2. Run with Docker Compose (Recommended)

```bash
docker-compose up --build
```

- Backend: http://localhost:8005
- FastAPI: http://localhost:8005/docs
- Frontend: http://localhost:3000

---

### 3. Manual Local Setup

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Set environment variables if needed (see .env file)
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

- Ensure PostgreSQL and Redis are running

#### Frontend

```bash
cd ../frontend
npm install
npm start
```

---

## Default Admin

- After setup, the user `admin@admin.com` is made an admin automatically  with password 'admin123'(see startup routines in backend).

---

## Notes

- CORS is enabled so frontend and backend can communicate locally.
- Bookings and events can be wiped for testing by truncating tables in the database (see PostgreSQL docs).
- All API endpoints are protected; admins have extra routes for managing events and viewing all bookings.

---

