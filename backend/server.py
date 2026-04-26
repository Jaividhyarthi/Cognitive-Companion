from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
import math
import httpx
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from googleapiclient.discovery import build
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    university: Optional[str] = None
    student_id: Optional[str] = None
    role: str = "student"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    onboarding_completed: bool = False

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    university: Optional[str] = None
    student_id: Optional[str] = None
    role: str = "student"

class LoginRequest(BaseModel):
    email: str
    password: str

class Consent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    granted: bool
    granted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    withdrawn_at: Optional[datetime] = None

class BaselineProfileCreate(BaseModel):
    stress_personality: Dict[str, Any]
    sleep_baseline: Dict[str, Any]
    social_baseline: Dict[str, Any]
    academic_relationship: Dict[str, Any]
    treatment_preferences: Dict[str, Any]
    emotional_awareness: Dict[str, Any] = {}

class BaselineProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    stress_personality: Dict[str, Any]
    sleep_baseline: Dict[str, Any]
    social_baseline: Dict[str, Any]
    academic_relationship: Dict[str, Any]
    treatment_preferences: Dict[str, Any]
    emotional_awareness: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TwinState(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    stress_level: float
    fatigue_index: float
    emotional_stability: float
    cognitive_load: float
    burnout_risk: float
    crisis_risk: float
    unified_input_vector: Dict[str, Any] = {}
    contributing_factors: List[Dict[str, Any]] = []

class Intervention(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    severity_tier: int
    triggered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "shown"
    outcome_delta: Optional[float] = None
    contributing_factors: List[str] = []

class MoodReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood_score: int
    notes: Optional[str] = None
    stressor_tags: List[str] = []
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    severity_tier: int
    trigger_metric: str
    trigger_value: float
    acknowledged: bool = False
    false_alarm_reported: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str = ""
    recommended_action: str = ""

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    token = credentials.credentials
    user = await db.users.find_one({"id": token}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    return user

def generate_simulated_twin_state(user_id: str, timestamp: datetime, baseline: Optional[Dict] = None) -> TwinState:
    hour = timestamp.hour
    day_of_week = timestamp.weekday()
    
    base_stress = 40
    if day_of_week >= 5:
        base_stress -= 15
    if 9 <= hour <= 17:
        base_stress += 20
    if hour >= 22 or hour <= 6:
        base_stress -= 10
    
    stress = max(0, min(100, base_stress + random.gauss(0, 15)))
    fatigue = max(0, min(100, 50 + random.gauss(0, 20) + (hour - 12) * 2))
    emotional_stability = max(0, min(100, 70 - stress * 0.3 + random.gauss(0, 10)))
    cognitive_load = max(0, min(100, 45 + random.gauss(0, 15) + (1 if 9 <= hour <= 17 else -10)))
    burnout_risk = max(0, min(1, (stress + fatigue + (100 - emotional_stability)) / 300))
    crisis_risk = max(0, min(1, (stress * 0.6 + (100 - emotional_stability) * 0.4 - 30) / 100))
    
    contributing_factors = []
    if stress > 60:
        contributing_factors.append({"factor": "Elevated HRV", "weight": 0.35})
    if fatigue > 60:
        contributing_factors.append({"factor": "Poor Sleep Quality", "weight": 0.30})
    if cognitive_load > 60:
        contributing_factors.append({"factor": "Academic Schedule", "weight": 0.25})
    
    return TwinState(
        user_id=user_id,
        timestamp=timestamp,
        stress_level=stress,
        fatigue_index=fatigue,
        emotional_stability=emotional_stability,
        cognitive_load=cognitive_load,
        burnout_risk=burnout_risk,
        crisis_risk=crisis_risk,
        contributing_factors=contributing_factors
    )

@api_router.post("/auth/register", response_model=User)
async def register(input: UserCreate):
    existing = await db.users.find_one({"email": input.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(**input.model_dump(exclude={"password"}))
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = input.password
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login")
async def login(input: LoginRequest):
    user = await db.users.find_one({"email": input.email}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": user["id"], "user": user}

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    return user

@api_router.post("/seed/demo")
async def seed_demo_data():
    """Create demo accounts with pre-generated data for testing."""
    demo_accounts = [
        {"name": "Sarah Johnson", "email": "demo@student.com", "password": "demo123", "role": "student", "university": "Stanford University", "student_id": "STU12345"},
        {"name": "Dr. Emily Chen", "email": "demo@counselor.com", "password": "demo123", "role": "counselor", "university": "Stanford University", "student_id": ""},
        {"name": "Admin User", "email": "demo@admin.com", "password": "demo123", "role": "admin", "university": "Stanford University", "student_id": ""}
    ]
    
    created = []
    for account_data in demo_accounts:
        existing = await db.users.find_one({"email": account_data["email"]}, {"_id": 0})
        if existing:
            created.append({"email": account_data["email"], "status": "already exists", "id": existing["id"]})
            continue
        
        user = User(
            name=account_data["name"],
            email=account_data["email"],
            role=account_data["role"],
            university=account_data["university"],
            student_id=account_data["student_id"],
            onboarding_completed=True
        )
        doc = user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['password'] = account_data["password"]
        await db.users.insert_one(doc)
        
        if account_data["role"] == "student":
            now = datetime.now(timezone.utc)
            historical_states = []
            for days_ago in range(30, 0, -1):
                for hour in range(0, 24, 3):
                    ts = now - timedelta(days=days_ago) + timedelta(hours=hour)
                    state = generate_simulated_twin_state(user.id, ts)
                    state_doc = state.model_dump()
                    state_doc['timestamp'] = state_doc['timestamp'].isoformat()
                    historical_states.append(state_doc)
            if historical_states:
                await db.twin_states.insert_many(historical_states)
            
            # Add counselor consent
            consent_doc = Consent(user_id=user.id, category="counselor_access", granted=True).model_dump()
            consent_doc['granted_at'] = consent_doc['granted_at'].isoformat()
            await db.consents.insert_one(consent_doc)
            
            # Add sample alerts
            for tier in [1, 2, 3]:
                alert = Alert(
                    user_id=user.id,
                    severity_tier=tier,
                    trigger_metric="stress_level",
                    trigger_value=40 + tier * 20,
                    message=["Your stress is mildly elevated. Consider a 5-minute break.",
                             "Significant stress deviation detected. We recommend a breathing exercise.",
                             "Critical emotional spike detected. Music therapy is available."][tier-1],
                    recommended_action=["Take a short walk or stretch",
                                       "Try the 4-7-8 breathing technique for 2 minutes",
                                       "Start music therapy and practice grounding"][tier-1]
                ).model_dump()
                alert['created_at'] = alert['created_at'].isoformat()
                await db.alerts.insert_one(alert)
            
            # Add sample interventions
            for itype, status in [("Breathing Exercise", "completed"), ("Music Therapy", "in-progress"), ("Break Reminder", "dismissed")]:
                intervention = Intervention(
                    user_id=user.id,
                    type=itype,
                    severity_tier=2,
                    status=status,
                    outcome_delta=-10.5 if status == "completed" else None,
                    contributing_factors=["Elevated HRV", "Poor Sleep"]
                ).model_dump()
                intervention['triggered_at'] = intervention['triggered_at'].isoformat()
                await db.interventions.insert_one(intervention)
        
        created.append({"email": account_data["email"], "status": "created", "id": user.id})
    
    return {"accounts": created, "message": "Demo data seeded. Use password: demo123 for all accounts."}

@api_router.post("/onboarding/complete")
async def complete_onboarding(baseline: BaselineProfileCreate, user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    profile = BaselineProfile(
        user_id=user["id"],
        **baseline.model_dump()
    )
    doc = profile.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.baseline_profiles.insert_one(doc)
    
    await db.users.update_one({"id": user["id"]}, {"$set": {"onboarding_completed": True}})
    
    now = datetime.now(timezone.utc)
    historical_states = []
    for days_ago in range(30, 0, -1):
        for hour in range(0, 24, 3):
            ts = now - timedelta(days=days_ago) + timedelta(hours=hour)
            state = generate_simulated_twin_state(user["id"], ts, profile.model_dump())
            state_doc = state.model_dump()
            state_doc['timestamp'] = state_doc['timestamp'].isoformat()
            historical_states.append(state_doc)
    
    if historical_states:
        await db.twin_states.insert_many(historical_states)
    
    return {"message": "Onboarding completed", "historical_records": len(historical_states)}

@api_router.get("/dashboard/current-state", response_model=TwinState)
async def get_current_state(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    latest = await db.twin_states.find_one(
        {"user_id": user["id"]},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    if not latest:
        state = generate_simulated_twin_state(user["id"], datetime.now(timezone.utc))
        state_doc = state.model_dump()
        state_doc['timestamp'] = state_doc['timestamp'].isoformat()
        await db.twin_states.insert_one(state_doc)
        return state
    
    if isinstance(latest['timestamp'], str):
        latest['timestamp'] = datetime.fromisoformat(latest['timestamp'])
    return TwinState(**latest)

@api_router.get("/dashboard/history")
async def get_history(days: int = 7, user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = db.twin_states.find(
        {"user_id": user["id"], "timestamp": {"$gte": start_date.isoformat()}},
        {"_id": 0}
    ).sort("timestamp", 1)
    
    history = await cursor.to_list(length=None)
    for item in history:
        if isinstance(item['timestamp'], str):
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
    
    return history

@api_router.get("/dashboard/prediction")
async def get_prediction(hours: int = 24, user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    current = await get_current_state(user)
    predictions = []
    
    for h in range(0, hours + 1):
        future_time = datetime.now(timezone.utc) + timedelta(hours=h)
        base_stress = current.stress_level
        
        hour = future_time.hour
        if 9 <= hour <= 17:
            base_stress += 10
        elif hour >= 22 or hour <= 6:
            base_stress -= 15
        
        predicted_stress = max(0, min(100, base_stress + random.gauss(0, 5)))
        
        predictions.append({
            "timestamp": future_time.isoformat(),
            "stress_level": predicted_stress,
            "confidence": max(0.5, 1 - (h / hours) * 0.3)
        })
    
    return predictions

@api_router.post("/mood/report", response_model=MoodReport)
async def report_mood(mood_score: int, notes: Optional[str] = None, stressor_tags: List[str] = [], user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    report = MoodReport(
        user_id=user["id"],
        mood_score=mood_score,
        notes=notes,
        stressor_tags=stressor_tags
    )
    
    doc = report.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.mood_reports.insert_one(doc)
    
    return report

@api_router.get("/alerts")
async def get_alerts(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    cursor = db.alerts.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10)
    
    alerts = await cursor.to_list(length=None)
    for alert in alerts:
        if isinstance(alert.get('created_at'), str):
            alert['created_at'] = datetime.fromisoformat(alert['created_at'])
    
    return alerts

@api_router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    await db.alerts.update_one(
        {"id": alert_id, "user_id": user["id"]},
        {"$set": {"acknowledged": True}}
    )
    
    return {"message": "Alert acknowledged"}

@api_router.get("/interventions")
async def get_interventions(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    cursor = db.interventions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("triggered_at", -1).limit(20)
    
    interventions = await cursor.to_list(length=None)
    for item in interventions:
        if isinstance(item.get('triggered_at'), str):
            item['triggered_at'] = datetime.fromisoformat(item['triggered_at'])
    
    return interventions

@api_router.get("/ai/explain")
async def explain_metric(metric: str, value: float, contributing_factors: str = "", user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401)
    
    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"explain_{user['id']}",
            system_message="You are a compassionate mental health support assistant. Explain student wellbeing metrics in friendly, non-clinical language. Always include the disclaimer that this is a wellbeing support tool, not a clinical diagnosis."
        )
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        message = UserMessage(
            text=f"Explain why a student's {metric} is at {value:.1f}/100. Contributing factors: {contributing_factors}. Keep it under 3 sentences and be supportive."
        )
        
        response = await chat.send_message(message)
        
        return {
            "metric": metric,
            "explanation": response,
            "disclaimer": "This is a wellbeing support tool, not a clinical diagnosis."
        }
    except Exception as e:
        logging.error(f"AI explanation error: {e}")
        return {
            "metric": metric,
            "explanation": f"Your {metric} is currently at {value:.1f}. This is based on recent patterns in your data.",
            "disclaimer": "This is a wellbeing support tool, not a clinical diagnosis."
        }

@api_router.get("/music/playlists")
async def get_music_playlists(source: str = "all"):
    """Get music playlists from Spotify, YouTube, or simulated fallback."""
    playlists = []

    # Spotify integration
    if source in ("all", "spotify"):
        try:
            sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
                client_id=os.environ.get('SPOTIFY_CLIENT_ID'),
                client_secret=os.environ.get('SPOTIFY_CLIENT_SECRET')
            ))
            search_queries = [
                ("Deep Calm", "calming ambient meditation"),
                ("Focus Recovery", "focus study instrumental"),
                ("Sleep Wind-Down", "sleep relaxation piano"),
                ("Grounding", "grounding mindfulness nature sounds")
            ]
            for name, query in search_queries:
                results = sp.search(q=query, type="playlist", limit=1)
                if results and results.get("playlists", {}).get("items"):
                    pl = results["playlists"]["items"][0]
                    playlist_tracks = sp.playlist_tracks(pl["id"], limit=5)
                    tracks = []
                    for item in playlist_tracks.get("items", []):
                        track = item.get("track")
                        if track:
                            tracks.append({
                                "id": track["id"],
                                "title": track["name"],
                                "artist": ", ".join(a["name"] for a in track.get("artists", [])),
                                "duration": track.get("duration_ms", 0) // 1000,
                                "preview_url": track.get("preview_url"),
                                "external_url": track.get("external_urls", {}).get("spotify"),
                                "album_art": track.get("album", {}).get("images", [{}])[0].get("url") if track.get("album", {}).get("images") else None
                            })
                    playlists.append({
                        "id": f"spotify-{pl['id']}",
                        "name": name,
                        "source": "spotify",
                        "description": pl.get("description", ""),
                        "image": pl.get("images", [{}])[0].get("url") if pl.get("images") else None,
                        "external_url": pl.get("external_urls", {}).get("spotify"),
                        "tracks": tracks
                    })
        except Exception as e:
            logging.warning(f"Spotify integration error: {e}")

    # YouTube integration
    if source in ("all", "youtube"):
        try:
            youtube = build("youtube", "v3", developerKey=os.environ.get('YOUTUBE_API_KEY'), cache_discovery=False)
            yt_queries = [
                ("Deep Calm (YouTube)", "calming ambient music for stress relief"),
                ("Focus Recovery (YouTube)", "study focus music instrumental"),
            ]
            for name, query in yt_queries:
                request = youtube.search().list(
                    part="snippet",
                    q=query,
                    type="video",
                    videoCategoryId="10",
                    maxResults=5,
                    order="relevance"
                )
                response = request.execute()
                tracks = []
                for item in response.get("items", []):
                    snippet = item.get("snippet", {})
                    video_id = item.get("id", {}).get("videoId")
                    if video_id:
                        tracks.append({
                            "id": video_id,
                            "title": snippet.get("title", ""),
                            "artist": snippet.get("channelTitle", ""),
                            "duration": 0,
                            "preview_url": None,
                            "external_url": f"https://www.youtube.com/watch?v={video_id}",
                            "album_art": snippet.get("thumbnails", {}).get("medium", {}).get("url"),
                            "embed_url": f"https://www.youtube.com/embed/{video_id}"
                        })
                playlists.append({
                    "id": f"youtube-{name.lower().replace(' ', '-')}",
                    "name": name,
                    "source": "youtube",
                    "description": f"YouTube: {query}",
                    "image": tracks[0]["album_art"] if tracks else None,
                    "tracks": tracks
                })
        except Exception as e:
            logging.warning(f"YouTube integration error: {e}")

    # Simulated fallback if both fail
    if not playlists:
        playlists = [
            {
                "id": "deep-calm",
                "name": "Deep Calm",
                "source": "simulated",
                "description": "Slow, ambient tracks for deep relaxation",
                "tracks": [
                    {"id": "1", "title": "Weightless", "artist": "Marconi Union", "duration": 480},
                    {"id": "2", "title": "Electra", "artist": "Airstream", "duration": 360}
                ]
            },
            {
                "id": "focus-recovery",
                "name": "Focus Recovery",
                "source": "simulated",
                "description": "Gentle instrumental music to restore concentration",
                "tracks": [
                    {"id": "3", "title": "Piano Peace", "artist": "Calm Collective", "duration": 420},
                    {"id": "4", "title": "Morning Light", "artist": "Meditation Sound", "duration": 390}
                ]
            }
        ]

    return playlists

@api_router.post("/auth/firebase")
async def firebase_auth(token_data: dict):
    """Authenticate user via Firebase ID token — creates or links backend user."""
    firebase_uid = token_data.get("uid")
    email = token_data.get("email")
    name = token_data.get("name", "")

    if not firebase_uid or not email:
        raise HTTPException(status_code=400, detail="Missing uid or email")

    existing = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
    if existing:
        await db.users.update_one({"email": email}, {"$set": {"firebase_uid": firebase_uid}})
        return {"token": existing["id"], "user": existing}

    user = User(name=name or email.split("@")[0], email=email, onboarding_completed=False)
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['firebase_uid'] = firebase_uid
    await db.users.insert_one(doc)
    return {"token": user.id, "user": user.model_dump()}

@api_router.get("/counselor/students")
async def get_counselor_students(user = Depends(get_current_user)):
    if not user or user.get("role") != "counselor":
        raise HTTPException(status_code=403, detail="Access denied")
    
    consented_users = await db.consents.find(
        {"category": "counselor_access", "granted": True},
        {"_id": 0}
    ).to_list(length=None)
    
    student_ids = [c["user_id"] for c in consented_users]
    
    students = []
    for sid in student_ids:
        student = await db.users.find_one({"id": sid}, {"_id": 0, "email": 0})
        if student:
            latest_state = await db.twin_states.find_one(
                {"user_id": sid},
                {"_id": 0},
                sort=[("timestamp", -1)]
            )
            students.append({
                "student": student,
                "current_state": latest_state
            })
    
    return students

@api_router.get("/admin/analytics")
async def get_admin_analytics(user = Depends(get_current_user)):
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    total_users = await db.users.count_documents({"role": "student"})
    
    recent_states = await db.twin_states.find(
        {"timestamp": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}},
        {"_id": 0}
    ).to_list(length=1000)
    
    if recent_states:
        avg_stress = sum(s.get('stress_level', 0) for s in recent_states) / len(recent_states)
        avg_burnout = sum(s.get('burnout_risk', 0) for s in recent_states) / len(recent_states)
    else:
        avg_stress = 0
        avg_burnout = 0
    
    total_interventions = await db.interventions.count_documents({})
    completed_interventions = await db.interventions.count_documents({"status": "completed"})
    
    return {
        "total_active_users": total_users,
        "average_stress_level": avg_stress,
        "average_burnout_risk": avg_burnout,
        "total_interventions": total_interventions,
        "intervention_completion_rate": completed_interventions / total_interventions if total_interventions > 0 else 0
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()