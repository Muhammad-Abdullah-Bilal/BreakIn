from fastapi import APIRouter, HTTPException, status
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
    role: Optional[str] = Field("developer", description="User role: developer, employer, or mentor")

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)

class UserOut(BaseModel):
    username: str
    email: EmailStr
    pseudonym: str
    role: str = "developer"

class UserSignin(BaseModel):
    email: EmailStr
    password: str

def normalize_role(role_str: Optional[str]) -> str:
    if not role_str:
        return "developer"
    r = role_str.lower().strip()
    if r in ["admin", "super_admin"]:
        return "admin"
    if r in ["mentor"]:
        return "mentor"
    if r in ["employer", "recruiter", "company", "company_admin", "hiring_manager", "hr_specialist"]:
        return "employer"
    return "developer"

# 🔐 Signup avec hash du mot de passe
@router.post("/signup", response_model=UserOut)
def signup(user: UserSignup):
    # Get database connection
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if user exists
    existing_user = db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already taken")
    
    raw_role = (user.role or "developer").lower().strip()
    # Guard against public admin registration
    if raw_role in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts cannot be registered publicly"
        )
    
    assigned_role = normalize_role(raw_role)

    # Hash password
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    
    # Generate pseudonym
    pseudonym = f"user-{uuid.uuid4().hex[:6]}"
    
    # Create user document
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_pw,
        "pseudonym": pseudonym,
        "role": assigned_role,
        "roles": [assigned_role]
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
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
        
    # Chercher par email
    user = db.users.find_one({"email": credentials.email.lower().strip()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Vérification du mot de passe hashé
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_role = normalize_role(user.get("role") or (user.get("roles", ["developer"])[0] if user.get("roles") else "developer"))

    # Return token and basic user identity for frontend session management
    user_out = {
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "pseudonym": user.get("pseudonym", ""),
        "role": user_role
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
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    user = db.users.find_one({"pseudonym": pseudonym})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_role = normalize_role(user.get("role") or (user.get("roles", ["developer"])[0] if user.get("roles") else "developer"))
    user["role"] = user_role
    return UserOut(**user)

# ✏️ Mise à jour dynamique
@router.put("/user/{pseudonym}")
def update_user(pseudonym: str, update: UserUpdate):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    update_data = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}

    if "password" in update_data:
        update_data["password"] = bcrypt.hashpw(update_data["password"].encode(), bcrypt.gensalt()).decode()

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    result = db.users.update_one({"pseudonym": pseudonym}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}
