<div align="center">

<h1>🏥 Patient Lens AI</h1>

<p>
  <strong>A production-grade, AI-powered hospital management platform built on a microservices architecture.</strong><br/>
  Blends clinical intelligence, modern DevOps, and enterprise-grade distributed systems engineering.
</p>

<p>
  <img src="https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=openjdk" />
  <img src="https://img.shields.io/badge/Spring_Boot-4.x-6DB33F?style=for-the-badge&logo=springboot" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />
  <img src="https://img.shields.io/badge/Azure-VM_+_ACR-0078D4?style=for-the-badge&logo=microsoftazure" />
  <img src="https://img.shields.io/badge/Apache_Kafka-7.5.0-231F20?style=for-the-badge&logo=apachekafka" />
  <img src="https://img.shields.io/badge/gRPC-Protobuf-4285F4?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/Llama_3.3_70B-Groq-FF6B35?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Pinecone-Vector_DB-00C4B0?style=for-the-badge" />
</p>

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture Diagram](#-architecture-diagram)
- [Microservices Breakdown](#-microservices-breakdown)
- [AI / ML Features](#-ai--ml-features)
- [Core Application Features](#-core-application-features)
- [DevOps & Infrastructure](#-devops--infrastructure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)

---

## 🧭 Overview

**Patient Lens AI** is a full-stack, cloud-deployable hospital management system designed around a polyglot microservices architecture. It combines enterprise-grade backend engineering patterns — gRPC inter-service communication, Apache Kafka event streaming, Saga orchestration, JWT-based RBAC — with a cutting-edge AI engine capable of:

- **Multimodal Clinical Decision Support** (Bio_ClinicalBERT + Vision Transformer fusion)
- **Retrieval-Augmented Generation** over patient PDF records (LangChain + Pinecone + Llama 3.3)
- **Disease Risk Prediction** via trained scikit-learn Logistic Regression models
- **AI Symptom Triage** with automated emergency SOS dispatch
- **Lab Trend Analysis** using LLM-powered clinical trajectory mapping

The frontend is a responsive, glassmorphism-styled React SPA with role-based views for Admins, Doctors, and Patients.

---

## 🗺️ Architecture Diagram

![System Architecture](./ArchitectureDiagram.png)

The system is composed of **12 containerized services** orchestrated via Docker Compose locally and deployed on an **Azure Virtual Machine** in production. All external traffic enters through a centralized **Spring Cloud Gateway** that validates JWT tokens by delegating to the Auth Service before proxying requests.

### Communication Patterns

| Pattern | Used Between |
|---|---|
| **REST / HTTP** | Frontend ↔ API Gateway ↔ All services |
| **gRPC (Protocol Buffers)** | `patient-service` → `billing-service` (account creation); `appointment-service` → `payment-service`, `notification-service` |
| **Apache Kafka** | `patient-service`, `appointment-service`, `analytics-service`, `notification-service` |
| **RAG (LangChain + Pinecone)** | `ai-service` ↔ Pinecone Vector Store |

---

## 🔩 Microservices Breakdown

### `api-gateway` · Port 4004
Built with **Spring Cloud Gateway WebFlux** (reactive stack). Acts as the single ingress point — verifies JWTs with `auth-service`, strips/adds headers, and routes to all downstream services. Exposes Spring Actuator health endpoints.

### `auth-service` · Port 4005
Issues and validates **JWT tokens** using **JJWT 0.12.6**. Uses Spring Security with BCrypt password hashing. Backed by its own PostgreSQL schema (`auth-service-db`). Exposes a `/validate` endpoint consumed by the gateway filter chain.

### `patient-service` · Port 4000 · gRPC 9001
Manages patient profiles, SOS alerts, and blood group/vitals metadata. Publishes Kafka events (`patient.created`) on registration. Uses **gRPC (Protobuf)** to call `billing-service` to auto-create billing accounts on patient registration.

### `doctor-service` · Port 4003
Manages doctor profiles, specializations, and availability. Persists to its own PostgreSQL schema.

### `appointment-service` · Port 4002
Handles appointment lifecycle (booking, status updates). Implements the **Saga Orchestration Pattern**: on confirmation it sequentially calls `payment-service` (gRPC) and `notification-service` (gRPC), and publishes `appointment.created` to Kafka. Supports rollback on failure.

### `billing-service` · Port 4001 · gRPC 9001
Acts as a gRPC **server** receiving billing account creation requests from `patient-service`. Also consumes Kafka events to log billing records. No direct REST exposure beyond internal gRPC.

### `payment-service` · Port 4006 · gRPC 9006
Exposes a gRPC **server** for appointment payment processing called by `appointment-service` during the Saga. Backed by its own PostgreSQL database.

### `notification-service` · Port 4008 · gRPC 9008
Exposes a gRPC **server** for sending confirmation notifications. Consumes Kafka topics and triggers email via Spring Mail (SMTP). Fetches patient contact info from `patient-service` at runtime.

### `analytics-service` · Port 4009
A Kafka **consumer** that aggregates appointment and patient creation events into its own schema for admin dashboards. Exposes REST APIs consumed by the frontend Analytics tab.

### `medical-record-service` · Port 4007
Manages clinical records (SOAP notes, vitals, prescriptions, lab results). REST APIs are consumed directly by the frontend and by the `ai-service` for appointment prep and lab trend features.

### `ai-service` · Port 4010
A **Python FastAPI** service with 8 AI/ML endpoints. The intelligence core of the system. See [AI/ML Features](#-ai--ml-features) for detail.

### `wake-controller` · (Node.js/TypeScript — Render-hosted proxy)
A lightweight **Express.js + TypeScript** reverse proxy deployed on Render.com. Uses `@azure/arm-compute` and `@azure/identity` to programmatically start/stop the Azure VM on demand (cost optimization). Routes all API calls to the Azure VM backend when it is awake. Uses `node-cron` for scheduled shutdown.

---

## 🤖 AI / ML Features

All AI endpoints live in `ai-service` — a FastAPI Python service.

### 1. 🧠 Multimodal Clinical Decision Support System (CDSS)
**Endpoint:** `POST /ai/multimodal-decision`

The most technically sophisticated component. Implements a **cross-modal tensor fusion pipeline**:

| Step | Model | Detail |
|---|---|---|
| **Text Encoding** | `emilyalsentzer/Bio_ClinicalBERT` (HuggingFace) | Tokenizes clinical case description; extracts `[CLS]` embedding (768-dim) and per-token self-attention weights |
| **Image Encoding** | `google/vit-base-patch16-224` (HuggingFace) | Processes medical scan via Vision Transformer; extracts `[CLS]` patch embedding (768-dim) and 14×14 = 196 patch attention scores |
| **Fusion** | Bilinear Concatenation | Concatenates text and vision embeddings → 1536-dim fused vector |
| **Classification** | Clinical Keyword Pattern Matcher + Softmax | Outputs probability distribution over: Pneumonia, Cardiomegaly, Pleural Effusion, Fracture, Normal |

Uses **PyTorch**, **Transformers**, and **Pillow**. Graceful simulation fallback when GPU/model weights unavailable.

**Frontend output:** Renders diagnostic probability bars, modality fusion weight visualizer, ClinicalBERT self-attention token heatmap, and an interactive ViT 14×14 patch attention grid overlay on the medical scan.

---

### 2. 🔍 RAG-Powered Medical Q&A Assistant
**Endpoints:** `POST /ai/upload_pdfs` · `POST /ai/ask_question`

A full **Retrieval-Augmented Generation (RAG)** pipeline:

```
PDF Upload → PyPDFLoader → RecursiveCharacterTextSplitter (chunk_size=500, overlap=100)
         → Embedding Model → Pinecone Upsert (cosine similarity index, AWS us-east-1)
                 ↓
User Query → Embedding → Pinecone Similarity Search → Top-K Docs
         → LangChain ChatPromptTemplate → Llama 3.3 70B (Groq API)
         → Domain-scoped medical answer
```

**Embedding providers (switchable via env):**
- **Local:** `sentence-transformers/all-mpnet-base-v2` (HuggingFace)
- **Cloud:** `models/gemini-embedding-001` (Google Generative AI)

**Vector DB:** Pinecone Serverless (AWS) with configurable namespace per patient context.

---

### 3. 📋 AI Appointment Preparation Summary
**Endpoint:** `POST /ai/appointment-prep/{patient_id}`

Before each consultation, doctors click "Generate AI Prep" to trigger a **Llama 3.3 70B** summary that:
1. Fetches patient demographics from `patient-service`
2. Fetches all historical medical records from `medical-record-service`
3. Streams the full context to Llama 3.3 via **LangChain's `ChatGroq`**
4. Returns a structured 4-section pre-visit briefing: Chief Complaint, Active Medications, Recent Labs, Clinical Recommendations.

---

### 4. 🩺 AI Symptom Intake & Emergency Triage Scoring
**Endpoint:** `POST /ai/symptom-intake`

Parses free-text patient symptom descriptions into structured clinical JSON via **Llama 3.3 70B**. Extracts:
- Main symptoms in medical terminology
- Duration, severity classification
- Associated symptoms
- Recommended triage pathway (Home Care → Urgent Care → Emergency Room)
- **Integer Triage Score** (1 = Normal, 2 = Urgent, **3 = Emergency**)

If `triageScore === 3`, the frontend automatically dispatches a **Priority SOS alert** to `/api/patients/sos` without any user interaction.

---

### 5. 📉 Disease Risk Prediction (ML)
**Endpoint:** `POST /ai/predict-risk`

**4 scikit-learn Logistic Regression models** trained on-startup using synthetic clinical data (1,000 samples):

| Model | Features | Target |
|---|---|---|
| Diabetes | Age, BMI, Glucose, Family Hx | Binary classification |
| Hypertension | Age, BMI, Systolic BP, Family Hx | Binary classification |
| Heart Disease | Age, BMI, BP, Glucose, Family Hx | Binary classification |
| Stroke | Age, Systolic BP, Family Hx | Binary classification |

Returns probability scores (0–1) + rule-based contributing factor labels (e.g. *"Stage 2 Hypertension BP (145 mmHg)"*, *"Obese BMI (32.4 ≥ 30.0)"*). Restricted to DOCTOR/ADMIN roles.

---

### 6. 📈 Lab Trend Analysis
**Endpoint:** `POST /ai/lab-trends/{patient_id}`

Fetches the patient's complete medical record history → chronologically orders all entries → streams to **Llama 3.3 70B** for clinical trajectory analysis. The LLM maps metric progressions (BP, glucose, weight), classifies trajectory status (*Improving / Stable / Worsening / Fluctuating*), and generates follow-up clinical recommendations.

---

### 7. 🕒 Patient Health Timeline (AI Summarization)
**Endpoint:** `POST /ai/timeline-summary`

Takes a batch of raw medical record JSON objects and passes them to **Llama 3.3 70B** to generate single-sentence chronological event summaries. The frontend renders them as an interactive vertical timeline with expandable detail drawers.

---

## ✨ Core Application Features

### 🔐 Authentication & Role-Based Access Control (RBAC)
- JWT-based authentication via dedicated `auth-service`
- Three role tiers: **ADMIN**, **DOCTOR**, **PATIENT**
- Gateway-level token validation before any downstream call
- Frontend enforces RBAC locally with `hasPermission()` guards per tab

| Feature | ADMIN | DOCTOR | PATIENT |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Patient Management | ✅ | ✅ | ❌ |
| Medical Records | ✅ | ✅ | ✅ (own) |
| Doctor Management | ✅ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ |
| AI Assistant | ✅ | ✅ | ✅ |
| CDSS Multimodal | ✅ | ✅ | ❌ |
| Disease Risk Prediction | ✅ | ✅ | ❌ |
| Booking Saga | ✅ | ✅ | ✅ |

---

### 🔄 Appointment Booking — Saga Orchestration
The appointment booking flow is a **Saga Transaction** visualized in real-time on the UI:

```
[1] Saga Initiated → State: PENDING
[2] gRPC Call → payment-service (charge patient)
[3] gRPC Call → notification-service (send confirmation)
[4] Kafka Publish → appointment.created topic
[5] Saga COMMIT or ROLLBACK (on any step failure)
```

The frontend renders each step live as cards with success/failure states.

---

### 🏥 Medical Records & Clinical Workspace
- Full CRUD for SOAP notes, vitals, prescriptions, lab results
- **AI Appointment Prep** — one-click pre-visit summary generation
- **Lab Trend Analysis** — Llama 3.3-powered clinical trajectory
- **Disease Risk Prediction** — ML risk gauges with contributing factors
- **Health Timeline** — AI-summarized chronological event list with expandable drawers

---

### 📊 Analytics Dashboard
Real-time Kafka-backed analytics consumed by `analytics-service`:
- Patient registration trend graphs
- Appointment volume by time period
- Role-restricted (ADMIN only)

---

## ⚙️ DevOps & Infrastructure

### 🐳 Docker & Docker Compose
All 12 services are fully containerized. A single `docker-compose.yml` at the project root orchestrates the entire stack:
- **PostgreSQL 17** with `healthcheck` and automatic multi-database initialization via `init-db.sql`
- **Confluent Kafka 7.5.0** with **ZooKeeper** coordination
- Service-level `depends_on` with health condition guards (e.g. `service_healthy`)
- Per-service environment injection including Kafka bootstrap servers and gRPC ports
- `build-all.bat` script for local batch Maven builds

### ☁️ Azure Cloud Deployment
| Resource | Purpose |
|---|---|
| **Azure Virtual Machine** | Hosts all Docker containers in production |
| **Azure Container Registry (ACR)** | Private Docker image registry for all services |
| **Azure SDK (`@azure/arm-compute`)** | Programmatic VM start/stop via wake-controller |

### 🚀 CI/CD — GitHub Actions
Two separate workflows in `.github/workflows/`:

**`deploy-backend.yml`** — triggered on push to `main` for any Java service:
1. Checkout → Set up JDK 17 (Temurin, Maven cache)
2. `mvn clean package -DskipTests` for all 10 Spring Boot services in a loop
3. Azure Login via `azure/login@v1` with OIDC credentials secret
4. Login to ACR → Build, tag (SHA + `latest`), and push Docker images for all services
5. SSH into Azure VM (`appleboy/ssh-action`) → `docker compose pull` → `docker compose up -d` → prune dangling images

**`deploy-frontend.yml`** — triggered on push to `main` for `frontend/**`:
1. Checkout → Set up Node.js 20 (npm cache)
2. `npm install` + `npm run build` (Vite production bundle)
3. Trigger **Render.com deploy webhook** via `curl` to redeploy the static site

### 💤 Cost Optimization — Wake Controller
A custom **Node.js/TypeScript** Express proxy deployed on Render.com (always-free tier):
- Proxies all frontend API calls to the Azure VM
- Uses **Azure Management SDK** to start the VM on first request (cold wake)
- Schedules automatic VM **shutdown at night** using `node-cron`
- Effectively turns the entire backend into a pay-as-you-use system

### 🗄️ Database Architecture
- **Single PostgreSQL 17 instance** shared across services (each service owns its own logical database)
- `init-db.sql` automatically creates 9 isolated databases on first container boot
- Each Spring Boot service uses `SPRING_JPA_HIBERNATE_DDL_AUTO: update` for schema management
- H2 in-memory database used in test scopes
- AI service uses **psycopg2** for direct Python → PostgreSQL connectivity

---

## 🛠️ Tech Stack

### Backend — Java / Spring Boot
| Technology | Version | Usage |
|---|---|---|
| Spring Boot | 4.x | Base framework for all 10 Java microservices |
| Spring Cloud Gateway | 2025.1.0 | Reactive API gateway with JWT filter |
| Spring Security | 4.x | JWT validation, BCrypt, RBAC |
| Spring Data JPA | 4.x | ORM layer for all services |
| Spring Kafka | 4.x | Kafka producer/consumer integration |
| JJWT | 0.12.6 | JWT token creation & validation |
| gRPC / Protobuf | 1.69.0 / 4.29.1 | Binary inter-service RPC |
| Lombok | Latest | Boilerplate reduction |
| SpringDoc OpenAPI | 2.x | Auto-generated Swagger UI |
| PostgreSQL Driver | Latest | JDBC runtime |
| H2 | Latest | In-memory testing DB |

### AI Service — Python / FastAPI
| Technology | Version | Usage |
|---|---|---|
| FastAPI + Uvicorn | Latest | Async REST API server |
| LangChain | Latest | LLM orchestration framework |
| LangChain-Groq | Latest | Groq API integration |
| LangChain-Community | Latest | HuggingFace embeddings, PDF loaders |
| LangChain-Google-GenAI | Latest | Google Gemini embeddings |
| Pinecone | Latest | Serverless vector database |
| PyTorch | Latest | Deep learning inference |
| HuggingFace Transformers | Latest | Bio_ClinicalBERT + ViT models |
| sentence-transformers | Latest | Local embedding generation |
| scikit-learn | Latest | Logistic Regression risk models |
| Pillow | Latest | Medical image processing |
| Pydantic v2 | ≥2 | Schema validation |
| loguru | Latest | Structured logging |
| psycopg2-binary | Latest | PostgreSQL connectivity |
| httpx | Latest | Async HTTP client for inter-service calls |

### Frontend — React / Vite
| Technology | Version | Usage |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.3.1 | Build tool and dev server |
| lucide-react | 0.400.0 | Icon library |
| Vanilla CSS | — | Custom glassmorphism design system |

### Infrastructure
| Technology | Usage |
|---|---|
| Docker + Docker Compose | Container orchestration |
| PostgreSQL 17 | Primary relational database |
| Apache Kafka 7.5.0 | Event streaming |
| Confluent ZooKeeper 7.5.0 | Kafka coordination |
| Azure VM | Production compute |
| Azure Container Registry | Private Docker registry |
| GitHub Actions | CI/CD pipelines |
| Render.com | Wake-controller + frontend hosting |
| Node.js + TypeScript | Wake-controller service |
| Express.js | Wake-controller HTTP proxy |
| `@azure/arm-compute` | Azure VM SDK |
| `node-cron` | Scheduled VM shutdown |

### AI / ML Models & APIs
| Model / API | Provider | Usage |
|---|---|---|
| Llama 3.3 70B Versatile | Groq API | Symptom triage, appointment prep, lab trends, timeline summaries |
| `emilyalsentzer/Bio_ClinicalBERT` | HuggingFace | Clinical text tokenization and embedding extraction |
| `google/vit-base-patch16-224` | HuggingFace | Medical image patch attention via Vision Transformer |
| `sentence-transformers/all-mpnet-base-v2` | HuggingFace | Local document embedding |
| `models/gemini-embedding-001` | Google Generative AI | Cloud document embedding (optional) |
| Pinecone Serverless | Pinecone | Vector similarity search |
| scikit-learn LogisticRegression | Local | Disease risk prediction (4 models) |

---

## 🚀 Getting Started

### Prerequisites
- **Docker Desktop** (with Compose support)
- **Java 17** (for local development / Maven builds)
- **Node.js 20** (for wake-controller and frontend)
- **Python 3.11+** (for ai-service local development)
- A **Groq API key** (free tier available at [console.groq.com](https://console.groq.com))
- A **Pinecone API key** (for RAG features)

### 1. Clone and Configure

```bash
git clone https://github.com/your-username/patient-lens-ai.git
cd patient-lens-ai
```

Copy and populate the AI service environment file:
```bash
cp ai-service/.env.example ai-service/.env
# Edit ai-service/.env with your API keys
```

### 2. Build Java Services

```bash
# Using the batch script (Windows)
build-all.bat

# Or manually per service
mvn -f auth-service/pom.xml clean package -DskipTests
mvn -f patient-service/pom.xml clean package -DskipTests
# ... repeat for all services
```

### 3. Start the Full Stack

```bash
docker compose up -d
```

This starts:
- PostgreSQL 17 (with automatic database initialization)
- ZooKeeper + Kafka
- All 10 Java microservices
- AI Service (FastAPI)

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173`



---

## 🔑 Environment Variables

### `ai-service/.env`

```env
# LLM
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Vector Store
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=medical-index

# Embeddings (local or google)
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
EMBEDDING_DIMENSION=768

# Google Embeddings (optional)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_EMBEDDING_MODEL=models/gemini-embedding-001

# Service URLs (auto-configured in docker-compose)
PATIENT_SERVICE_URL=http://patient-service:4000
MEDICAL_RECORD_SERVICE_URL=http://medical-record-service:4007
DATABASE_URL=postgresql://admin_user:password@postgres:5432/ai-service-db
```

### `wake-controller/.env`

```env
# Azure Credentials
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_RESOURCE_GROUP=your_resource_group
AZURE_VM_NAME=your_vm_name

# Backend Target
BACKEND_URL=http://your-azure-vm-ip:4004
PORT=3000
```

---

<div align="center">
  <sub>Built with ☕ Spring Boot · 🐍 Python · ⚛️ React · 🐳 Docker · ☁️ Azure</sub>
</div>
