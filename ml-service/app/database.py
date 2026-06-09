import json
import os
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://safesight:safesight@postgres:5432/safesight"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    bbox = Column(Text, nullable=False)
    image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String)
    severity = Column(String)
    timestamp = Column(String)
    confidence = Column(Float)
    bbox = Column(Text)
    image_url = Column(String)


def _to_native(value):
    """Convert numpy scalars to plain Python types for PostgreSQL."""
    if hasattr(value, "item"):
        return value.item()
    return value


def init_db():
    Base.metadata.create_all(bind=engine)


def save_detections(detections, image_url):
    db = SessionLocal()
    stored_ids = []

    for det in detections:
        bbox = [_to_native(v) for v in det["bbox"]]
        record = Detection(
            label=det["label"],
            confidence=float(_to_native(det["confidence"])),
            bbox=json.dumps(bbox),
            image_url=image_url,
        )
        db.add(record)
        db.flush()
        stored_ids.append(record.id)

    db.commit()
    db.close()
    return stored_ids


def save_incidents(incidents):
    db = SessionLocal()

    for inc in incidents:
        bbox = [_to_native(v) for v in inc["bbox"]]
        record = Incident(
            incident_type=inc["incident_type"],
            severity=inc["severity"],
            timestamp=inc["timestamp"],
            confidence=float(_to_native(inc["confidence"])),
            bbox=json.dumps(bbox),
            image_url=inc.get("image_url"),
        )
        db.add(record)

    db.commit()
    db.close()
