# Wayfarer | AI Travel Planner

> A streaming, multi-agent travel planner that turns a rough destination idea into a practical, budget-aware itinerary.

Wayfarer is a full-stack AI application built to demonstrate how an LLM can coordinate specialized tools and agents instead of producing a generic one-shot answer. A traveler enters a destination, the workflow gathers relevant travel information, and the final response streams into a polished React interface as it is generated.

![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--agent-1C3C3C?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Checkpointing-4169E1?style=flat-square&logo=postgresql&logoColor=white)

## Why This Project Stands Out

- **Multi-agent orchestration:** LangGraph coordinates flight research, hotel research, itinerary generation, and final response writing as separate workflow stages.
- **Tool-augmented answers:** Flight data and web research are gathered before the LLM writes the plan.
- **Real-time UX:** FastAPI streams the final agent response while the React client progressively renders it.
- **Readable output:** Markdown is converted into structured headings, lists, callouts, and responsive budget tables in the browser.
- **Persistent state:** PostgreSQL-backed LangGraph checkpointing enables thread-based workflow state.
- **Production-minded structure:** A FastAPI backend, Vite frontend, environment-based secrets, health endpoint, and Docker support keep the project easy to extend and deploy.

## Product Flow

```text
Traveler request
	|
	v
Flight research -> Hotel research -> Itinerary generation -> Final travel response
											  |
											  v
									 Streamed to the React UI
```

## Architecture

| Layer | Responsibility | Implementation |
| --- | --- | --- |
| Frontend | Destination input, loading state, progressive response rendering | React 19 + Vite |
| API | Health checks and streaming HTTP endpoint | FastAPI + Uvicorn |
| Workflow | Directed multi-agent execution and shared state | LangGraph |
| LLM | Itinerary and final response generation | Google Gemini via LangChain |
| Research tools | Flight lookup and travel web search | `tools/flight_tool.py`, Tavily |
| Persistence | Workflow checkpoints and thread state | PostgreSQL + `PostgresSaver` |

## Repository Structure

```text
.
├── app.py                         # FastAPI app and streaming endpoint
├── backend.py                     # LangGraph workflow and agent implementations
├── tools/
│   ├── flight_tool.py             # Flight search integration
│   └── tavily_tool.py             # Travel web research integration
├── frontend/Travel-Planner-App/
│   ├── src/App.jsx                # React experience and Markdown renderer
│   ├── src/App.css                # Responsive visual system
│   └── vite.config.js             # Local API proxy
├── Dockerfile
├── pyproject.toml
└── requirements.txt
```

## Run Locally

### 1. Configure the backend

Create a `.env` file in the repository root:

```env
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key
DATABASE_URL=postgresql://user:password@host:5432/database
```

`DATABASE_URL` must point to a PostgreSQL instance. SSL mode is added automatically when it is not already present.

### 2. Install Python dependencies

Python 3.13+ is recommended.

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start the API

```powershell
python app.py
```

The API runs at `http://127.0.0.1:8000`.

### 4. Start the frontend

In a second terminal:

```powershell
cd frontend\Travel-Planner-App
npm install
npm run dev
```

Open the Vite URL shown in the terminal. During development, Vite proxies API requests to the FastAPI server.

## API

### Health check

```http
GET /api/health
```

### Stream a travel plan

```http
GET /stream-travel?user_input=Pune%20to%20Mumbai%20for%202%20days
```

The endpoint returns `text/plain` and streams the final agent response as it is generated. An optional `thread_id` query parameter can be supplied to associate the run with an existing LangGraph checkpoint thread.

## Frontend Highlights

- Responsive full-width planning workspace
- Destination suggestions and quick prompts
- Streaming progress state while the agent works
- Markdown-aware itinerary presentation
- Styled travel notes, headings, nested recommendations, and budget tables
- Mobile-friendly layout with horizontal table scrolling

## Engineering Notes

The graph uses a shared typed state containing the user query, research results, itinerary, messages, and call count. Each stage contributes to that state before the final agent composes the user-facing answer. This keeps tool calls, orchestration, and presentation concerns separate and makes new specialist agents straightforward to add.

## Roadmap

- Add a dedicated weather data agent and surface forecast details in the UI
- Add saved-trip history backed by the existing checkpoint threads
- Add automated API and workflow tests with mocked external services
- Add deployment configuration for a hosted PostgreSQL and container environment

## Author

Built by **Lokesh Patil** as a hands-on demonstration of agentic AI application design, streaming systems, and full-stack product engineering.
