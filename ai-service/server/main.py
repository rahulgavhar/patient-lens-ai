from fastapi import FastAPI
from server.middlewares.exception_handlers import catch_exception_middleware
from server.middlewares.auth_middleware import role_authorization_middleware
from server.routes.upload_pdfs import router as upload_router
from server.routes.ask_question import router as ask_router
from server.routes.multimodal_cdss import router as cdss_router
from server.routes.appointment_prep import router as prep_router
from server.routes.symptom_intake import router as symptom_router
from server.routes.predict_risk import router as risk_router
from server.routes.timeline_summary import router as timeline_router
from server.routes.lab_trends import router as trends_router

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
            "prep": "/appointment-prep/{patient_id}",
            "intake": "/symptom-intake",
            "risk": "/predict-risk",
            "timeline": "/timeline-summary",
            "trends": "/lab-trends/{patient_id}",
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
# 4. appointment preparation summary
app.include_router(prep_router, prefix="/ai")
# 5. symptom intake parsing
app.include_router(symptom_router, prefix="/ai")
# 6. disease risk prediction
app.include_router(risk_router, prefix="/ai")
# 7. patient health timeline summary
app.include_router(timeline_router, prefix="/ai")
# 8. clinical lab trends analysis
app.include_router(trends_router, prefix="/ai")





