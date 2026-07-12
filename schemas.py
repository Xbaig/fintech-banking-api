from pydantic import BaseModel, EmailStr
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric (no spaces or symbols)")
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True
        
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
class AccountResponse(BaseModel):
    id: int
    account_number: str
    balance: float

    class Config:
        from_attributes = True

class AccountCreate(BaseModel):
    account_number: str = Field(min_length=5, max_length=20)


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)

class TransactionResponse(BaseModel):
    id: int
    amount: float
    transaction_type: str
    timestamp: datetime

    class Config:
        from_attributes = True