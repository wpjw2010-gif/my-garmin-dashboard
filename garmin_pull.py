import os
from datetime import date
from dotenv import load_dotenv
from garminconnect import Garmin, GarminConnectAuthenticationError
from supabase import create_client, Client

load_dotenv()

# --- YOUR CREDENTIALS ---
# Keep your Garmin credentials loaded securely from environment variables:
email = os.getenv("GARMIN_EMAIL")
password = os.getenv("GARMIN_PASSWORD")

# Hardcode your Supabase URL and Key directly here to bypass env file issues:
supabase_url = "https://hliclyuvgjbhaymktqpg.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsaWNseXV2Z2piaGF5bWt0cXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NjA1NDEsImV4cCI6MjEwODUzNjU0MX0.Qb-GCKu29Ivxo3oIU92STKqTGFKgC5AG8sOQ6AJ25XU"

fixed_weight = float(os.getenv("FIXED_WEIGHT_KG", "75.0"))

token_dir = os.path.expanduser("~/.garminconnect")

def prompt_mfa():
    """Prompt user for 2FA code if required by Garmin"""
    return input("Enter Garmin 2FA / MFA code: ")

print("Logging into Garmin Connect...")

# Try logging in using saved token directory first, or fall back to email/password
try:
    garmin = Garmin(tokenstore=token_dir)
    garmin.login()
    print("✅ Logged in using saved tokens!")
except Exception:
    try:
        garmin = Garmin(email, password, prompt_mfa=prompt_mfa)
        garmin.login(token_dir)
        print("✅ Logged in successfully and saved tokens!")
    except GarminConnectAuthenticationError as e:
        print(f"❌ Authentication error: {e}")
        exit(1)

today = date.today().isoformat()
print(f"Fetching data for {today}...")

# Fetch basic stats, sleep, and HRV
stats = garmin.get_stats(today)
sleep_data = garmin.get_sleep_data(today)
hrv_data = garmin.get_hrv_data(today)

# Fetch Training Readiness safely (handling list response)
try:
    readiness_data = garmin.get_training_readiness(today)
    print("DEBUG - Training Readiness successfully fetched.")
    if isinstance(readiness_data, list) and len(readiness_data) > 0:
        training_readiness = readiness_data[0].get("score") or readiness_data[0].get("value")
    else:
        training_readiness = readiness_data.get("score") or readiness_data.get("value")
except Exception as e:
    print("DEBUG - Training Readiness Error/Not Available:", e)
    training_readiness = None

# Fetch Endurance Score safely
try:
    endurance_data = garmin.get_endurance_score(today)
    print("DEBUG - Endurance Score successfully fetched.")
    endurance_score = endurance_data.get("overallScore") or endurance_data.get("score")
except Exception as e:
    print("DEBUG - Endurance Score Error/Not Available:", e)
    endurance_score = None

sleep_coach = None

# Extract key metrics safely
resting_hr = stats.get("restingHeartRate")
sleep_seconds = sleep_data.get("dailySleepDTO", {}).get("sleepTimeSeconds")
sleep_score = sleep_data.get("dailySleepDTO", {}).get("sleepScores", {}).get("overall", {}).get("value")

hrv_summary = hrv_data.get("hrvSummary", {})
hrv_avg = hrv_summary.get("weeklyAvg") or hrv_summary.get("lastNightAvg")

# Fetch today's activities
activities = garmin.get_activities_by_date(today, today, "")

# Structure record for Supabase
record = {
    "date": today,
    "resting_hr": resting_hr,
    "hrv_avg": hrv_avg,
    "sleep_seconds": sleep_seconds,
    "sleep_score": sleep_score,
    "training_readiness": training_readiness,
    "endurance_score": endurance_score,
    "sleep_coach": sleep_coach,
    "weight_kg": fixed_weight,
    "activities": activities
}

print("Pushing data to Supabase...")
supabase: Client = create_client(supabase_url, supabase_key)
supabase.table("garmin_stats").upsert(record, on_conflict="date").execute()

print("✅ Successfully pulled Garmin data and updated Supabase!")