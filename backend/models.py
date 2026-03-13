from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
import datetime
from database import Base


class Friend(Base):
    __tablename__ = "friends"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    token = Column(String(64), unique=True, index=True, nullable=False)
    chat_key = Column(Text, nullable=True)  # AES key in base64 (Optional in True E2EE mode)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    friend_id = Column(Integer, nullable=False, index=True)
    sender = Column(String(10), nullable=False)  # "admin" or "friend"
    content_encrypted = Column(Text, nullable=False)  # base64 ciphertext
    iv = Column(String(64), nullable=False)  # base64 AES IV
    is_encoded = Column(Boolean, default=False)  # True if sent as number sequence
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
