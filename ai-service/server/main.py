from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.middlewares.exception_handlers import catch_exception_middleware
from server.routes.upload_pdfs import router as upload_router
from server.routes.ask_question import router as ask_router

app = FastAPI(title="AI Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# middleware exception handlers
app.middleware("http")(catch_exception_middleware)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "AI Service - Patient Lens",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/upload_pdfs",
            "ask": "/ask_question",
            "docs": "/docs"
        }
    }

# router

# 1. upload file
app.include_router(upload_router)
# 2. asking query
app.include_router(ask_router)

