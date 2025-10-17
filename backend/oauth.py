from fastapi import APIRouter
from fastapi.responses import RedirectResponse
import requests, os

router = APIRouter()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/oauth/callback"

@router.get("/login/google")
def login_google():
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={CLIENT_ID}&"
        "response_type=code&"
        f"redirect_uri={REDIRECT_URI}&"
        "scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.metadata.readonly"
    )
    return RedirectResponse(auth_url)

@router.get("/oauth/callback")
def oauth_callback(code: str):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    token_res = requests.post(token_url, data=data).json()
    access_token = token_res.get("access_token")

    # Fetch user profile & connected apps
    user_info = requests.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    # Simplified 3rd-party apps check (drive/other scopes)
    apps = {"Drive Files Accessible": "Yes" if access_token else "No"}

    return {"user_info": user_info, "connected_apps": apps}
