import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Friend, Message

router = APIRouter(prefix="/api/friend")


# ── Schemas ──────────────────────────────────────────────
class FriendInfo(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: int
    sender: str
    content_encrypted: str
    iv: str
    is_encoded: bool
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


class SendMessageBody(BaseModel):
    content_encrypted: str
    iv: str
    is_encoded: bool = False


# ── Helpers ───────────────────────────────────────────────
def get_friend_by_token(token: str, db: Session) -> Friend:
    friend = db.query(Friend).filter(Friend.token == token).first()
    if not friend:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    return friend


# ── Endpoints ────────────────────────────────────────────
@router.get("/{token}", response_model=FriendInfo)
def get_friend_info(token: str, db: Session = Depends(get_db)):
    friend = get_friend_by_token(token, db)
    return friend


@router.get("/{token}/messages", response_model=list[MessageOut])
def get_messages(token: str, db: Session = Depends(get_db)):
    friend = get_friend_by_token(token, db)
    messages = (
        db.query(Message)
        .filter(Message.friend_id == friend.id)
        .order_by(Message.timestamp.asc())
        .all()
    )
    return messages


@router.post("/{token}/send", response_model=MessageOut)
def send_message(token: str, body: SendMessageBody, db: Session = Depends(get_db)):
    friend = get_friend_by_token(token, db)
    msg = Message(
        friend_id=friend.id,
        sender="friend",
        content_encrypted=body.content_encrypted,
        iv=body.iv,
        is_encoded=body.is_encoded,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
