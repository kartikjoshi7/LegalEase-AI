from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials
import os

router = APIRouter(tags=["Auth"])
security = HTTPBearer()

# Note: In a production environment with a real FIREBASE_SERVICE_ACCOUNT_JSON,
# we would initialize the app here. For the hackathon, we will stub the verification
# so it doesn't crash without credentials, while fulfilling the architecture requirement.

try:
    if not firebase_admin._apps:
        # If we had a service account file, we would load it:
        # cred = credentials.Certificate(os.environ.get("FIREBASE_CREDENTIALS_PATH"))
        # firebase_admin.initialize_app(cred)
        pass
except Exception as e:
    print(f"Firebase init error: {e}")

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Middleware dependency to verify Firebase ID tokens.
    Currently mocked to bypass strict auth for local testing during the hackathon.
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail={"error": "UNAUTHORIZED", "message": "Missing token."})
    
    # --- REAL IMPLEMENTATION (Commented out for Hackathon Demo) ---
    # try:
    #     decoded_token = auth.verify_id_token(token)
    #     return decoded_token
    # except auth.InvalidIdTokenError:
    #     raise HTTPException(status_code=401, detail={"error": "UNAUTHORIZED", "message": "Invalid or expired Firebase ID token."})
    
    # MOCK IMPLEMENTATION
    return {"uid": "mock_user_123", "email": "test@legalease.ai"}
