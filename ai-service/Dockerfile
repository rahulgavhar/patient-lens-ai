FROM python:3.11-slim

WORKDIR /app

# Install standard utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python requirements
COPY server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server/ ./server/

# Copy uploads folder
COPY uploaded_docs/ ./uploaded_docs/

# Expose FastAPI port
EXPOSE 4010

# Command to run uvicorn
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "4010"]
