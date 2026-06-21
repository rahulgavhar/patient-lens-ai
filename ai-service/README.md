# AI Service - FastAPI Application

A FastAPI-based AI service for processing PDF documents and answering questions using RAG (Retrieval-Augmented Generation) with LangChain, Pinecone, and Groq.

## Features

- **PDF Upload & Processing**: Upload PDF files and store them in a Pinecone vector database
- **Question Answering**: Ask questions about uploaded documents using AI-powered retrieval
- **Tech Stack**: FastAPI, LangChain, Pinecone, Google Embeddings, Groq LLM

## Prerequisites

- Python 3.8+
- API Keys:
  - Google API Key (for embeddings)
  - Groq API Key (for LLM)
  - Pinecone API Key (for vector store)

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory (use `.env.example` as template):

```env
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=medical-index
```

### 2. Install Dependencies

#### Using Virtual Environment (Recommended)

```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r server/requirements.txt
```

#### Direct Installation

```powershell
pip install -r server/requirements.txt
```

## Running the Application

### Option 1: Using Startup Scripts (Easiest)

**PowerShell:**
```powershell
.\start.ps1
```

**Command Prompt:**
```cmd
start.bat
```

### Option 2: Using Uvicorn Directly

```powershell
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### Option 3: Using Python Script

```powershell
python run.py
```

## API Endpoints

Once running, the API will be available at `http://localhost:8000`

### 1. Upload PDFs
- **Endpoint**: `POST /upload_pdfs`
- **Description**: Upload and process PDF files
- **Request**: Multipart form data with file(s)
- **Response**: Success message

### 2. Ask Question
- **Endpoint**: `POST /ask_question`
- **Description**: Ask questions about uploaded documents
- **Request**: Form data with `question` field
- **Response**: JSON with answer and sources

## API Documentation

After starting the server, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
ai-service/
├── server/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── middlewares/
│   │   └── exception_handlers.py
│   ├── modules/
│   │   ├── llm.py             # LLM chain setup
│   │   ├── load_vectorstore.py # Vector store operations
│   │   └── query_handlers.py   # Query processing
│   └── routes/
│       ├── upload_pdfs.py      # PDF upload endpoint
│       └── ask_question.py     # Question answering endpoint
├── uploaded_docs/              # Temporary PDF storage
├── .env                        # Environment variables (create this)
├── .env.example               # Environment template
├── .gitignore                 # Git ignore patterns
├── start.ps1                  # PowerShell startup script
├── start.bat                  # Batch startup script
└── run.py                     # Python startup script
```

## Development

The server runs in reload mode by default, which means it will automatically restart when you make changes to the code.

## Troubleshooting

1. **Import Errors**: Make sure all dependencies are installed: `pip install -r server/requirements.txt`
2. **API Key Errors**: Verify your `.env` file has all required API keys
3. **Port Already in Use**: Change the port in the startup command or kill the process using port 8000
4. **Pinecone Index Issues**: The app will automatically create the index if it doesn't exist

## Notes

- PDF files are temporarily stored in `uploaded_docs/` directory
- The Pinecone index uses 768 dimensions for Google embeddings
- Default LLM model is Llama3-70b via Groq

