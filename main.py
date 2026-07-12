from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_user
from typing import List
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Fintech Banking API is running"}

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed = hash_password(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token(data={"sub": db_user.username})

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/accounts/me", response_model=List[schemas.AccountResponse])
def get_my_accounts(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(
        models.User.username == current_user
    ).first()

    accounts = db.query(models.Account).filter(
        models.Account.owner_id == db_user.id
    ).all()

    return accounts


@app.post("/accounts", response_model=schemas.AccountResponse)
def create_account(
    account: schemas.AccountCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(
        models.User.username == current_user
    ).first()

    existing = db.query(models.Account).filter(
        models.Account.account_number == account.account_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account number already exists")

    new_account = models.Account(
        account_number=account.account_number,
        owner_id=db_user.id
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


@app.post("/accounts/{account_id}/deposit", response_model=schemas.TransactionResponse)
def deposit(
    account_id: int,
    transaction: schemas.TransactionCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    db_user = db.query(models.User).filter(
        models.User.username == current_user
    ).first()

    account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.owner_id == db_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.balance += transaction.amount

    new_transaction = models.Transaction(
        amount=transaction.amount,
        transaction_type="deposit",
        account_id=account.id
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

@app.post("/accounts/{account_id}/withdraw", response_model=schemas.TransactionResponse)
def withdraw(
    account_id: int,
    transaction: schemas.TransactionCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")

    db_user = db.query(models.User).filter(
        models.User.username == current_user
    ).first()

    account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.owner_id == db_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if account.balance < transaction.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    account.balance -= transaction.amount

    new_transaction = models.Transaction(
        amount=transaction.amount,
        transaction_type="withdraw",
        account_id=account.id
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction