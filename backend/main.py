import os
import logging
import requests
from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from oauth import router as oauth_router
from audit import explain_risks

# ------------------------------------------------
# 🔧 Logging setup
# ------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)
logger.info("🚀 Starting Privacy Audit Backend (Hugging Face API)...")

# ------------------------------------------------
# ⚙️ FastAPI app init
# ------------------------------------------------
app = FastAPI(title="Privacy Audit API", version="1.1.0")

# Allow frontend access (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# 🔐 OAuth router
# ------------------------------------------------
try:
    app.include_router(oauth_router)
    logger.info("✅ OAuth router loaded successfully.")
except Exception as e:
    logger.exception(f"⚠️ Failed to include OAuth router: {e}")

# ------------------------------------------------
# 🤖 Hugging Face API setup
# ------------------------------------------------
HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-small"
HF_TOKEN = os.getenv("HF_TOKEN")  # Set in Hugging Face Space secrets
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

def generate_plain_text(input_text: str):
    """Call Hugging Face API instead of local model."""
    logger.info(f"🧩 Generating explanation for input: {input_text[:60]}...")
    try:
        payload = {"inputs": f"Explain privacy risks in plain language:\n{input_text}"}
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and "generated_text" in result[0]:
                explanation = result[0]["generated_text"]
            else:
                explanation = result[0].get("generated_text", str(result))
            logger.info("✅ Text generation complete.")
            return explanation
        else:
            logger.error(f"❌ HF API Error: {response.status_code} {response.text}")
            return f"Error: {response.text}"
    except Exception as e:
        logger.exception(f"❌ Error generating text: {e}")
        return "Error: Could not generate explanation."

# ------------------------------------------------
# 📤 Models
# ------------------------------------------------
class AuditInput(BaseModel):
    findings: str

# ------------------------------------------------
# 🔍 Endpoints
# ------------------------------------------------
@app.get("/ping")
def ping():
    return {"status": "ok", "message": "Backend is alive!"}

@app.post("/analyze")
def analyze(data: dict):
    try:
        os_apps = data.get("os_apps", [])
        browser_exts = data.get("browser_extensions", [])
        account_apps = data.get("account_apps", [])
        explanation = explain_risks(os_apps, browser_exts, account_apps)
        return {"plain_language": explanation}
    except Exception as e:
        logger.exception(f"❌ Error in /analyze: {e}")
        return {"error": str(e)}

@app.get("/audit")
def audit_mvp():
    findings = "App X has camera access, App Y has location access, Chrome has 5 extensions"
    explanation = generate_plain_text(findings)
    return {
        "findings": findings,
        "plain_language": explanation,
        "risk_level": "Medium"
    }

@app.post("/audit")
async def audit_mvp(data: dict):
    try:
        os_apps = data.get("os_apps", [])
        browser_exts = data.get("browser_extensions", [])
        account_apps = data.get("account_apps", [])

        findings_text = (
            f"Detected {len(os_apps)} installed apps, "
            f"{len(browser_exts)} browser extensions, and "
            f"{len(account_apps)} connected account apps."
        )
        explanation = generate_plain_text(findings_text)

        return {
            "findings": findings_text,
            "plain_language": explanation,
            "risk_level": "Medium"
        }
    except Exception as e:
        logger.exception(f"❌ Error in /audit: {e}")
        return {"error": str(e)}
