# Build the React frontend before creating the smaller Python runtime image.
FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/Travel-Planner-App/package*.json ./
RUN npm ci

COPY frontend/Travel-Planner-App/ ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=frontend-build /frontend/dist /app/frontend/Travel-Planner-App/dist

EXPOSE 8080

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]