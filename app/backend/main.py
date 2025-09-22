import os
from datetime import datetime, timedelta
import asyncio
from typing import List, Optional
import logging
from redis import RedisError
import json

from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, text
from sqlalchemy.orm import sessionmaker, relationship, declarative_base, Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import redis

from fastapi.middleware.cors import CORSMiddleware


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/event_booking")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)
redis_client = None
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
    redis_client.ping()
    logger.info("Successfully connected to Redis.")
except RedisError as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user")

    bookings = relationship("Booking", back_populates="user")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    location = Column(String)
    date = Column(DateTime)
    total_seats = Column(Integer)
    available_seats = Column(Integer)

    bookings = relationship("Booking", back_populates="event")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    seats_booked = Column(Integer)
    status = Column(String, default="confirmed")

    user = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key")
ALGORITHM = "HS256"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class EventBase(BaseModel):
    title: str
    location: str
    date: datetime
    total_seats: int

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    available_seats: int

    class Config:
        orm_mode = True

class BookingCreate(BaseModel):
    event_id: int
    seats_booked: int

class BookingResponse(BaseModel):
    id: int
    event_id: int
    seats_booked: int
    status: str

    class Config:
        orm_mode = True

class AdminBookingResponse(BaseModel):
    id: int
    event_id: int
    event_title: str
    user_id: int
    user_name: str
    user_email: str
    seats_booked: int
    status: str

    class Config:
        orm_mode = True


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def create_superuser(name: str, email: str, password: str, db: Session):
    hashed_password = get_password_hash(password)
    new_user = User(name=name, email=email, password=hashed_password, role="admin")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def set_user_as_admin(email: str, password: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if user:
        if user.role != "admin":
            user.role = "admin"
            # Update password if provided
            if password:
                user.password = get_password_hash(password)
            db.commit()
            logger.info(f"User {email} has been set as an admin.")
            return True
        else:
            logger.info(f"User {email} is already an admin.")
            return False
    else:
        # Create new admin user if doesn't exist
        hashed_password = get_password_hash(password)
        new_user = User(name="Admin", email=email, password=hashed_password, role="admin")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"Admin user created successfully. Email: {email}")
        return True

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(name=user.name, email=user.email, password=hashed_password, role="user")

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/events", response_model=List[EventResponse])
def get_all_events(db: Session = Depends(get_db)):
    if redis_client:
        try:
            cached_events = redis_client.get("events")
            if cached_events:
                logger.info("Serving events from Redis cache.")
                events_data = json.loads(cached_events)
                for e in events_data:
                    e["date"] = datetime.fromisoformat(e["date"])
                return [EventResponse(**e) for e in events_data]
        except RedisError as e:
            logger.error(f"Redis cache access failed: {e}")

    events = db.query(Event).all()
    events_list = [
        EventResponse(
            id=event.id,
            title=event.title,
            location=event.location,
            date=event.date,
            total_seats=event.total_seats,
            available_seats=event.available_seats
        ) for event in events
    ]

    if redis_client:
        try:
            def event_response_to_dict(event: EventResponse):
                data = event.dict()
                data["date"] = data["date"].isoformat()
                return data
            events_serialized = [event_response_to_dict(evt) for evt in events_list]
            redis_client.setex("events", 60, json.dumps(events_serialized))
            logger.info("Events cached in Redis.")
        except RedisError as e:
            logger.error(f"Failed to cache events in Redis: {e}")

    return events_list

@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_tickets(booking: BookingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        with db.begin_nested():
            event = db.query(Event).filter(Event.id == booking.event_id).with_for_update().first()

            if not event:
                raise HTTPException(status_code=404, detail="Event not found")

            if event.available_seats < booking.seats_booked:
                raise HTTPException(status_code=400, detail="Not enough seats available")

            event.available_seats -= booking.seats_booked
            db.add(event)

            new_booking = Booking(
                user_id=current_user.id,
                event_id=booking.event_id,
                seats_booked=booking.seats_booked,
                status="confirmed"
            )
            db.add(new_booking)

        if redis_client:
            redis_client.delete("events")
            logger.info("Cleared 'events' cache in Redis.")

        logger.info(f"Booking confirmed for user {current_user.email} for event {event.title}. A confirmation email would be sent asynchronously.")

        db.commit()
        db.refresh(new_booking)  # Ensure new_booking is refreshed so its fields are populated

        # Ensure event_id is set on the Booking instance for the response
        # (This should always be the case, but for safety, add a fix if needed)
        if new_booking.event_id is None:
            new_booking.event_id = booking.event_id

        return new_booking

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database transaction failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/bookings/my", response_model=List[BookingResponse])
def get_my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    # Patch to ensure event_id is always an int (avoid None)
    for b in bookings:
        if b.event_id is None and hasattr(b, "event") and b.event:
            b.event_id = b.event.id
    return bookings

@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    event = db.query(Event).filter(Event.id == booking.event_id).first()
    if event:
        event.available_seats += booking.seats_booked
        db.add(event)
    booking.status = "cancelled"
    db.add(booking)
    db.commit()

    if redis_client:
        redis_client.delete("events")
        logger.info("Cleared 'events' cache in Redis after booking cancellation.")

    return {"detail": "Booking cancelled successfully"}

@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event: EventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to create events")

    new_event = Event(
        title=event.title,
        location=event.location,
        date=event.date,
        total_seats=event.total_seats,
        available_seats=event.total_seats
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    if redis_client:
        redis_client.delete("events")
        logger.info("Cleared 'events' cache in Redis after event creation.")

    return new_event

@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event_update: EventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update events")

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    old_total_seats = event.total_seats
    event.title = event_update.title
    event.location = event_update.location
    event.date = event_update.date
    event.total_seats = event_update.total_seats
    event.available_seats += (event.total_seats - old_total_seats)

    db.commit()
    db.refresh(event)

    if redis_client:
        redis_client.delete("events")
        logger.info("Cleared 'events' cache in Redis after event update.")

    return event

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete events")

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()

    if redis_client:
        redis_client.delete("events")
        logger.info("Cleared 'events' cache in Redis after event deletion.")

    return {"detail": "Event deleted successfully"}

@router.get("/admin/bookings", response_model=List[AdminBookingResponse])
def get_all_bookings_for_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    bookings = (
        db.query(Booking)
        .join(Booking.event)
        .join(Booking.user)
        .all()
    )
    resp = []
    for b in bookings:
        resp.append(AdminBookingResponse(
            id=b.id,
            event_id=b.event_id,
            event_title=b.event.title if b.event else "",
            user_id=b.user_id,
            user_name=b.user.name if b.user else "",
            user_email=b.user.email if b.user else "",
            seats_booked=b.seats_booked,
            status=b.status,
        ))
    return resp

@router.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

app.include_router(router)

@app.on_event("startup")
async def startup_event():
    while True:
        try:
            logger.info("Attempting to connect to the database...")
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            logger.info("Database connection successful.")
            break
        except SQLAlchemyError as e:
            logger.warning(f"Database not yet available: {e}")
            await asyncio.sleep(2)
    
    create_tables()
    db = SessionLocal()
    try:
        # Create admin user with password
        set_user_as_admin("admin@admin.com", "admin123", db)

    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
