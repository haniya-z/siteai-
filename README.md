# 🚀 SiteAI

### AI-Powered Decision Intelligence for Engineering & Infrastructure Projects

**SiteAI** is an AI-powered decision intelligence platform designed to help engineering and infrastructure teams understand complex project data, identify risks, trace dependencies, and make faster, evidence-backed decisions.

Instead of treating project documents, schedules, contracts, reports, and engineering data as isolated information, SiteAI connects them through **GraphRAG, multi-agent reasoning, and a project knowledge graph** to build a unified understanding of the project.

> **From fragmented project data → connected intelligence → actionable engineering decisions.**

---

## 🎯 The Problem

Large-scale infrastructure projects generate enormous amounts of information:

* Engineering documents
* Project schedules
* Contracts and specifications
* Risk registers
* Site reports
* Procurement records
* Meeting notes
* Dependencies between teams and activities

The challenge isn't simply storing this information.

The real challenge is answering questions such as:

* **What is currently putting the project at risk?**
* **Which dependencies could cause downstream delays?**
* **What happens if a critical activity is delayed?**
* **Which contractor or work package is affected?**
* **What evidence supports this risk?**
* **What action should the project team take next?**

Traditional search and standalone chatbots struggle with these cross-document, relationship-heavy questions.

---

# 💡 The SiteAI Approach

SiteAI combines **Retrieval-Augmented Generation, Knowledge Graphs, Vector Search, and Multi-Agent AI** to create a project intelligence layer.

Instead of simply retrieving a document containing an answer, SiteAI attempts to understand the **relationships between entities, events, risks, activities, documents, and dependencies** within the project.

### Core Pipeline

```text
                    ┌─────────────────────┐
                    │   Project Data      │
                    │                     │
                    │ Documents           │
                    │ Schedules           │
                    │ Contracts           │
                    │ Reports             │
                    │ Risk Registers      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Data Processing    │
                    │   & Extraction       │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
          ┌───────────────┐         ┌───────────────┐
          │ Vector Search │         │ Knowledge      │
          │    Qdrant     │         │ Graph         │
          │               │         │ Neo4j         │
          └───────┬───────┘         └───────┬───────┘
                  │                         │
                  └────────────┬────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   GraphRAG Layer    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Multi-Agent         │
                    │ Orchestrator         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Decision Intelligence│
                    │      Engine          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Executive AI        │
                    │ Recommendations     │
                    └─────────────────────┘
```

---

# 🧠 Key Capabilities

### 🔎 Project Intelligence

Search and reason across large collections of engineering and project documentation.

### 🕸️ Knowledge Graph

Represent relationships between:

```text
Projects
   │
   ├── Activities
   ├── Contractors
   ├── Risks
   ├── Documents
   ├── Dependencies
   ├── Resources
   └── Milestones
```

This enables SiteAI to reason about **relationships**, rather than relying only on keyword matching.

### 📚 GraphRAG

Combines:

* Semantic vector retrieval
* Knowledge graph traversal
* Context-aware retrieval
* LLM reasoning

This allows the system to retrieve both **relevant information and its surrounding relationships**.

### 🤖 Multi-Agent Reasoning

Different AI agents can specialize in different aspects of project intelligence, such as:

* Risk analysis
* Schedule analysis
* Dependency analysis
* Document intelligence
* Impact analysis
* Recommendation generation

The orchestrator coordinates these agents to solve complex queries.

### ⚠️ Risk & Impact Analysis

Identify potential risks and trace their possible downstream impact across project dependencies.

### 🧭 Decision Intelligence

Convert project information into structured insights:

```text
Observation
     ↓
Risk / Issue
     ↓
Affected Dependencies
     ↓
Potential Impact
     ↓
Recommended Action
     ↓
Supporting Evidence
```

### 📊 Executive Recommendations

Instead of returning a wall of AI-generated text, SiteAI is designed to provide concise, actionable intelligence for project stakeholders.

---

# 🏗️ System Architecture

```text
┌──────────────────────────────┐
│        Next.js Frontend      │
│                              │
│ Dashboard • Projects • AI    │
│ Insights • Risk Analysis     │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│        FastAPI Backend       │
│                              │
│ APIs • Authentication •      │
│ Project Intelligence         │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│    Multi-Agent Orchestrator  │
│                              │
│ Query Routing • Agent        │
│ Coordination • Reasoning     │
└───────────────┬──────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌─────────────┐   ┌─────────────┐
│   Qdrant    │   │    Neo4j    │
│ Vector DB   │   │ Knowledge   │
│             │   │ Graph       │
└──────┬──────┘   └──────┬──────┘
       │                 │
       └────────┬────────┘
                ▼
┌──────────────────────────────┐
│       GraphRAG Layer         │
└───────────────┬──────────────┘
                ▼
┌──────────────────────────────┐
│ Decision Intelligence Engine │
└───────────────┬──────────────┘
                ▼
┌──────────────────────────────┐
│   Executive AI Insights      │
│                              │
│ Risks • Impacts • Actions    │
└──────────────────────────────┘
```

---

# 🧰 Tech Stack

| Layer            | Technology             |
| ---------------- | ---------------------- |
| Frontend         | Next.js 14, TypeScript |
| Backend          | FastAPI, Python        |
| LLM              | Anthropic Claude       |
| Knowledge Graph  | Neo4j                  |
| Vector Database  | Qdrant                 |
| Database         | PostgreSQL             |
| Cache            | Redis                  |
| Embeddings       | Sentence Transformers  |
| Containerization | Docker Compose         |

---

# 📁 Project Structure

```text
siteai/
│
├── backend/
│   ├── agents/
│   ├── api/
│   ├── services/
│   ├── rag/
│   ├── graph/
│   └── main.py
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
│
├── docker/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 🔄 How SiteAI Works

### 1. Ingest Project Data

Project documents and structured information are processed and prepared for retrieval.

### 2. Extract Knowledge

Important entities and relationships are identified and represented within the project knowledge graph.

### 3. Generate Embeddings

Relevant document content is converted into vector representations using Sentence Transformers.

### 4. Store & Index

* **Neo4j** stores relationships and project entities.
* **Qdrant** stores semantic vector representations.
* **PostgreSQL** stores application and structured data.
* **Redis** provides caching and fast-access state.

### 5. Retrieve Context

When a user asks a question, SiteAI combines:

**Vector similarity + graph relationships + project context**

to retrieve relevant evidence.

### 6. Multi-Agent Reasoning

The orchestrator determines which specialized agents should analyze the query.

### 7. Generate Decision Intelligence

The system combines the retrieved evidence and agent outputs to produce structured project insights.

### 8. Deliver Recommendations

The final result is presented through the SiteAI interface as actionable intelligence rather than raw retrieved information.

---

# 🧩 Example Use Case

### Question

> **"What could happen if the electrical installation package is delayed by two weeks?"**

Instead of simply searching for the phrase *electrical installation*, SiteAI can reason across the project:

```text
Electrical Installation
        │
        ├── Dependency → Equipment Testing
        │
        ├── Dependency → Commissioning
        │
        ├── Dependency → Project Milestone
        │
        └── Contractor → Contractor A
```

The system can then identify:

**Potential impact**

→ Testing may be delayed

→ Commissioning may shift

→ Dependent activities may be affected

→ Critical milestone may be exposed

**Recommended action**

→ Prioritize resolution of the electrical package dependency

**Evidence**

→ Relevant project documents, schedules, and relationships

---

# 🏢 Designed For

SiteAI is designed around the information challenges faced by teams working on:

* Infrastructure projects
* Engineering projects
* Construction projects
* EPC organizations
* Project management teams
* Engineering consultants
* Infrastructure operators

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Docker
* Docker Compose
* Node.js 18+
* Python 3.10+
* API credentials for the selected LLM provider

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd siteai
```

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Add the required credentials and service configuration to `.env`.

## 3. Start the Services

```bash
docker compose up --build
```

## 4. Open the Application

Once the services are running, open the frontend in your browser.

---

# 🔐 Environment Configuration

Example:

```env
ANTHROPIC_API_KEY=your_api_key

POSTGRES_URL=your_postgres_url

QDRANT_URL=your_qdrant_url

NEO4J_URI=your_neo4j_uri
NEO4J_USERNAME=your_username
NEO4J_PASSWORD=your_password

REDIS_URL=your_redis_url
```

> Never commit real API keys or credentials to GitHub. Use `.env` locally and keep it excluded through `.gitignore`.

---

# 📈 Future Roadmap

### Phase 1 — Core Intelligence

* [x] AI-powered project intelligence
* [x] GraphRAG architecture
* [x] Vector retrieval
* [x] Knowledge graph integration
* [x] Multi-agent architecture

### Phase 2 — Advanced Decision Intelligence

* [ ] Automated risk propagation
* [ ] Schedule impact simulation
* [ ] Dependency-aware recommendations
* [ ] What-if scenario analysis
* [ ] Automated executive reports

### Phase 3 — Enterprise Intelligence

* [ ] ERP integration
* [ ] BIM integration
* [ ] Project management platform integrations
* [ ] Real-time project monitoring
* [ ] Role-based intelligence dashboards
* [ ] Continuous project knowledge updates

---

# 🧠 Why GraphRAG?

Traditional RAG primarily answers:

> **"Which documents are relevant to this question?"**

SiteAI aims to answer a more complex question:

> **"How are the relevant pieces of information connected, and what does that relationship mean for the project?"**

This distinction becomes important when project decisions depend on chains of relationships between:

**Activities → Dependencies → Contractors → Risks → Milestones → Impact**

By combining vector retrieval with a knowledge graph, SiteAI can preserve both **semantic context** and **structural relationships**.

---

# 🏆 Economic Times AI Hackathon

SiteAI was developed for the **Economic Times AI Hackathon** as an exploration of how Multi-Agent AI, GraphRAG, and Decision Intelligence can transform engineering and infrastructure project management.

The project focuses on moving beyond generic AI assistants toward **domain-specific AI systems capable of understanding complex project ecosystems.**

---

# 👥 Team

Built by:

**[Your Name / Team Name]**

---

# 📌 Project Status

🚧 **Prototype / Hackathon Project**

SiteAI is currently being developed as a working prototype demonstrating AI-powered project intelligence, GraphRAG retrieval, multi-agent reasoning, and decision support.

---

## ⭐ Vision

> **Build an AI layer that understands an entire engineering project — not just its documents.**

SiteAI aims to transform project data from a collection of disconnected records into a **living project intelligence system** that can help teams discover risks, understand dependencies, simulate impacts, and make evidence-backed decisions.

---

### Built with

**Next.js · FastAPI · Claude · Neo4j · Qdrant · PostgreSQL · Redis · Docker**
| Procurement Tracker | http://localhost:3000/procurement |
| NCR Register | http://localhost:3000/ncrs |
| Document Search | http://localhost:3000/documents |
| Backend API (Swagger) | http://localhost:8000/docs |
| Neo4j Browser | http://localhost:7474 |

---

# 🛠️ Prerequisites

Install the following before running the project:

- Docker Desktop
- Python 3.11+
- Node.js 18+
- VS Code
- Anthropic API Key

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/siteai.git
cd siteai
```

---

## 2. Configure Environment Variables

Copy the example file.

### Windows

```bash
copy .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API Key.

```env
ANTHROPIC_API_KEY=your_api_key_here
```

---

## 3. Start Infrastructure

```bash
docker compose up postgres neo4j qdrant redis
```

Wait until all services are healthy.

---

## 4. Start Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

---

## 5. Start Frontend

Open another terminal.

```bash
cd frontend

npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

---

# 🧪 Verify

Open:

- Frontend → http://localhost:3000
- Backend API → http://localhost:8000/docs
- Neo4j → http://localhost:7474

---

# 🏗️ Architecture

```
Next.js Frontend
        │
        ▼
FastAPI Backend
        │
        ▼
Multi-Agent Orchestrator
        │
 ┌──────┼────────┐
 │      │        │
 ▼      ▼        ▼
GraphRAG Neo4j Qdrant
        │
        ▼
Decision Intelligence Engine
        │
        ▼
Executive AI Recommendations
```

---

# 🧰 Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | Next.js 14, TypeScript |
| Backend | FastAPI |
| AI | Anthropic Claude |
| Knowledge Graph | Neo4j |
| Vector Database | Qdrant |
| Database | PostgreSQL |
| Cache | Redis |
| Embeddings | Sentence Transformers |
| Containers | Docker Compose |

---

# 📁 Project Structure

```
siteai/
│
├── backend/
├── frontend/
├── docker/
├── docker-compose.yml
├── README.md
├── .env.example
└── .gitignore
```

---

# 👥 Developed For

**Economic Times AI Hackathon**

SiteAI demonstrates how Multi-Agent AI and Decision Intelligence can transform engineering decision-making for large-scale infrastructure projects.


# 🏗️ System Architecture

The diagram below illustrates how SiteAI integrates AI reasoning, GraphRAG retrieval, the engineering knowledge graph, and enterprise data services into a unified decision intelligence platform.

## System Architecture

![System Architecture](Screenshot%202026-07-23%20185617.png)


---
