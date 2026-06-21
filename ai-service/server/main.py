from fastapi import FastAPI
from server.middlewares.exception_handlers import catch_exception_middleware
from server.middlewares.auth_middleware import role_authorization_middleware
from server.routes.upload_pdfs import router as upload_router
from server.routes.ask_question import router as ask_router
from server.routes.multimodal_cdss import router as cdss_router

app = FastAPI(title="AI Service")

# middleware exception handlers
app.middleware("http")(catch_exception_middleware)
app.middleware("http")(role_authorization_middleware)

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
            "multimodal": "/multimodal-decision",
            "docs": "/docs"
        }
    }

# router

# 1. upload file
app.include_router(upload_router, prefix="/ai")
# 2. asking query
app.include_router(ask_router, prefix="/ai")
# 3. multimodal CDSS
app.include_router(cdss_router, prefix="/ai")


