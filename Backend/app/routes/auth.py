from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
from app.config import get_database
from typing import Optional
import uuid
import bcrypt

router = APIRouter()

# 📦 Modèles Pydantic
class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)

class UserOut(BaseModel):
    username: str
    email: EmailStr
    pseudonym: str

class UserSignin(BaseModel):
    # Changer username -> email
    email: EmailStr  # ou str si vous préférez
    password: str



# 🔐 Signup avec hash du mot de passe
@router.post("/signup", response_model=UserOut)
def signup(user: UserSignup):
    # Get database connection
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if user exists
    existing_user = db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    
    # Generate pseudonym
    pseudonym = f"user-{uuid.uuid4().hex[:6]}"
    
    # Create user document
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_pw,
        "pseudonym": pseudonym
    }
    
    # Insert into database
    result = db.users.insert_one(new_user)
    
    # Remove the MongoDB ObjectId before returning
    new_user.pop('_id', None)
    
    return UserOut(**new_user)

@router.post("/signin")
def signin(credentials: UserSignin):
    # Get database connection
    db = get_database()
    # Chercher par email au lieu de username
    user = db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Vérification du mot de passe hashé
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Return token and basic user identity for frontend session management
    user_out = {
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "pseudonym": user.get("pseudonym", "")
    }
    return JSONResponse(content={
        "message": "Signed in successfully",
        "token": "jwt_token",
        "user": user_out
    })

# 🔍 Lecture d’un utilisateur par pseudonyme
@router.get("/user/{pseudonym}", response_model=UserOut)
def get_user(pseudonym: str):
    db = get_database()
    user = db.users.find_one({"pseudonym": pseudonym})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**user)

# ✏️ Mise à jour dynamique
@router.put("/user/{pseudonym}")
def update_user(pseudonym: str, update: UserUpdate):
    db = get_database()
    update_data = {k: v for k, v in update.dict().items() if v is not None}

    if "password" in update_data:
        update_data["password"] = bcrypt.hashpw(update_data["password"].encode(), bcrypt.gensalt()).decode()

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    result = db.users.update_one({"pseudonym": pseudonym}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}

# 🗑️ Suppression
@router.delete("/user/{pseudonym}")
def delete_user(pseudonym: str):
    db = get_database()
    result = db.users.delete_one({"pseudonym": pseudonym})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# 📋 Liste des utilisateurs
@router.get("/users", response_model=list[UserOut])
def list_users():
    db = get_database()
    users = list(db.users.find())
    return [UserOut(**user) for user in users]
