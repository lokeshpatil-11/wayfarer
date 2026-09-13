from pathlib import Path
import traceback
import uvicorn

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from backend import run_travel_agent as stream_travel_agent

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Travel-Planner",
    description="LangGraph Multi-Agent Travel Planner with FastAPI Frontend",
    version="1.0.0"
)
class TravelRequest(BaseModel):
    user_input: str
    thread_id: str | None = None


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/plan")
def plan_trip(request: TravelRequest):
    try:
        if not request.user_input.strip():
            return JSONResponse(
                status_code=400,
                content={"detail": "Please describe the trip you want to plan."},
            )
    except Exception:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": "The travel planner could not complete this request."},
        )

@app.get("/stream-travel")
def stream_travel(user_input: str, thread_id: str | None = None):
    return StreamingResponse(
        stream_travel_agent(user_input, thread_id),
        media_type="text/plain"
    )

FRONTEND_DIST = BASE_DIR / "frontend" / "Travel-Planner-App" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIST, html=True),
        name="frontend",
    )


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)