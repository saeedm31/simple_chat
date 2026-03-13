import os
import secrets
import base64
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Friend, Message
from auth import verify_password, create_access_token, verify_token, ADMIN_USERNAME

router = APIRouter(prefix="/api/admin")


# ── Schemas ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str


class FriendCreate(BaseModel):
    name: str


class FriendOut(BaseModel):
    id: int
    name: str
    token: str
    chat_key: str | None = None
    created_at: datetime.datetime
    unread_count: int = 0

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: int
    friend_id: int
    sender: str
    content_encrypted: str
    iv: str
    is_encoded: bool
    is_read: bool
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


class SendMessageBody(BaseModel):
    content_encrypted: str
    iv: str
    is_encoded: bool = False


# ── Endpoints ────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    if body.username != ADMIN_USERNAME or not verify_password(body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token({"sub": body.username})
    return {"access_token": token, "token_type": "bearer", "username": body.username}


@router.get("/friends", response_model=list[FriendOut])
def list_friends(db: Session = Depends(get_db), _=Depends(verify_token)):
    friends = db.query(Friend).order_by(Friend.created_at.desc()).all()
    result = []
    for f in friends:
        unread = (
            db.query(Message)
            .filter(Message.friend_id == f.id, Message.sender == "friend", Message.is_read == False)
            .count()
        )
        result.append(
            FriendOut(
                id=f.id,
                name=f.name,
                token=f.token,
                chat_key=f.chat_key,
                created_at=f.created_at,
                unread_count=unread,
            )
        )
    return result


@router.post("/friends", response_model=FriendOut)
def create_friend(body: FriendCreate, db: Session = Depends(get_db), _=Depends(verify_token)):
    invite_token = secrets.token_urlsafe(32)
    # Server no longer generates AES keys in True E2EE mode
    friend = Friend(name=body.name, token=invite_token, chat_key=None)
    db.add(friend)
    db.commit()
    db.refresh(friend)
    return FriendOut(
        id=friend.id,
        name=friend.name,
        token=friend.token,
        chat_key=friend.chat_key,
        created_at=friend.created_at,
        unread_count=0,
    )


@router.delete("/friends/{friend_id}")
def delete_friend(friend_id: int, db: Session = Depends(get_db), _=Depends(verify_token)):
    friend = db.query(Friend).filter(Friend.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")
    db.query(Message).filter(Message.friend_id == friend_id).delete()
    db.delete(friend)
    db.commit()
    return {"ok": True}


@router.get("/chat/{friend_id}", response_model=list[MessageOut])
def get_chat(friend_id: int, db: Session = Depends(get_db), _=Depends(verify_token)):
    messages = (
        db.query(Message)
        .filter(Message.friend_id == friend_id)
        .order_by(Message.timestamp.asc())
        .all()
    )
    # Mark friend messages as read
    db.query(Message).filter(
        Message.friend_id == friend_id, Message.sender == "friend", Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    return messages


@router.post("/chat/{friend_id}/reply", response_model=MessageOut)
def admin_reply(
    friend_id: int,
    body: SendMessageBody,
    db: Session = Depends(get_db),
    _=Depends(verify_token),
):
    friend = db.query(Friend).filter(Friend.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")
    msg = Message(
        friend_id=friend_id,
        sender="admin",
        content_encrypted=body.content_encrypted,
        iv=body.iv,
        is_encoded=body.is_encoded,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/messages/{msg_id}")
def delete_message(msg_id: int, db: Session = Depends(get_db), _=Depends(verify_token)):
    msg = db.query(Message).filter(Message.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return {"ok": True}
