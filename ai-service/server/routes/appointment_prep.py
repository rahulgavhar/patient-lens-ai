import os
import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from loguru import logger
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Read target microservice base URLs with fallback to localhost for host development
PATIENT_SERVICE_URL = os.getenv("PATIENT_SERVICE_URL", "http://localhost:4000")
MEDICAL_RECORD_SERVICE_URL = os.getenv("MEDICAL_RECORD_SERVICE_URL", "http://localhost:4007")

@router.post("/appointment-prep/{patient_id}")
async def generate_appointment_prep(patient_id: str, request: Request):
    try:
        logger.info(f"Generating appointment prep summary for patient: {patient_id}")
        
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in environment")
            
        auth_header = request.headers.get("Authorization")
        headers = {}
        if auth_header:
            headers["Authorization"] = auth_header
            
        # 1. Fetch patient profile details
        patient_info = {}
        try:
            patient_url = f"{PATIENT_SERVICE_URL}/patients/{patient_id}"
            logger.info(f"Fetching patient details from: {patient_url}")
            async with httpx.AsyncClient() as client:
                res = await client.get(patient_url, headers=headers, timeout=10.0)
                if res.status_code == 200:
                    patient_info = res.json()
                else:
                    logger.warning(f"Failed to fetch patient details, status code: {res.status_code}")
        except Exception as e:
            logger.error(f"Error calling patient-service: {e}")
            
        # 2. Fetch patient's medical records
        medical_records = []
        try:
            records_url = f"{MEDICAL_RECORD_SERVICE_URL}/medical-records/patient/{patient_id}"
            logger.info(f"Fetching medical records from: {records_url}")
            async with httpx.AsyncClient() as client:
                res = await client.get(records_url, headers=headers, timeout=10.0)
                if res.status_code == 200:
                    medical_records = res.json()
                else:
                    logger.warning(f"Failed to fetch medical records, status code: {res.status_code}")
        except Exception as e:
            logger.error(f"Error calling medical-record-service: {e}")

        # Format patient info for LLM context
        patient_summary = (
            f"Name: {patient_info.get('name', 'N/A')}\n"
            f"DOB/Birth Date: {patient_info.get('dateOfBirth', 'N/A')}\n"
            f"Blood Group: {patient_info.get('bloodGroup', 'N/A')}\n"
            f"Height: {patient_info.get('height', 'N/A')} cm, Weight: {patient_info.get('weight', 'N/A')} kg\n"
        )
        
        # Format medical records history for LLM context
        records_context = ""
        if medical_records:
            for idx, rec in enumerate(medical_records):
                records_context += (
                    f"--- Record #{idx+1} ({rec.get('createdAt', 'Unknown Date')}) ---\n"
                    f"Doctor: {rec.get('doctorName', 'N/A')}\n"
                    f"Vitals: {rec.get('vitals', 'N/A')}\n"
                    f"Diagnosis: {rec.get('diagnosis', 'N/A')}\n"
                    f"Prescription: {rec.get('prescription', 'N/A')}\n"
                    f"Lab Results: {rec.get('labResults', 'N/A')}\n"
                    f"Notes: {rec.get('consultationNotes', 'N/A')}\n\n"
                )
        else:
            records_context = "No previous medical records found for this patient."

        # Setup LangChain Groq LLM
        groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        llm = ChatGroq(
            api_key=groq_api_key,
            model=groq_model,
        )
        
        system_prompt = (
            "You are an expert AI clinical assistant. Your task is to generate a comprehensive, structured pre-visit "
            "Appointment Preparation Summary for a doctor before they see a patient.\n\n"
            "You will be given the patient's personal details and their chronological past medical records (if any).\n\n"
            "Please synthesize this data and produce a summary structured EXACTLY with the following sections:\n"
            "1. CHIEF COMPLAINT & RECENT DIAGNOSES: Summarize the most recent reason for visits, symptoms, and diagnoses from past records.\n"
            "2. ACTIVE MEDICATION HISTORY: List all medications, dosages, and instruction patterns extracted from the prescription records.\n"
            "3. RECENT REPORTS & LABS: Summarize any lab results, test readings, and vitals history.\n"
            "4. CLINICAL RECOMMENDATIONS FOR THIS VISIT: Provide 2-3 brief clinical check-ins or questions the doctor should ask during this upcoming consultation based on their history (e.g., following up on a symptom, checking medication adherence, or ordering repeat tests).\n\n"
            "Be professional, precise, and concise. Do not give direct medical advice to the patient; this summary is for the doctor."
        )
        
        human_content = (
            f"=== PATIENT INFO ===\n{patient_summary}\n"
            f"=== PAST MEDICAL RECORDS ===\n{records_context}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", human_content),
        ])
        
        chain = prompt | llm
        llm_response = await chain.ainvoke({})
        
        summary_text = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
        
        return JSONResponse(content={
            "patientId": patient_id,
            "patientName": patient_info.get("name", "Unknown"),
            "summary": summary_text
        })
        
    except Exception as e:
        logger.error(f"Error in generate_appointment_prep: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
