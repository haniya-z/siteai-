# 🚀 SiteAI
### AI Operating System for Engineering Decision Intelligence

SiteAI is an AI-powered Engineering Decision Intelligence Platform designed for EPC (Engineering, Procurement, and Construction) project delivery.

Built specifically for large-scale infrastructure projects such as Tier III/IV Data Centers, SiteAI combines Multi-Agent AI, GraphRAG, Knowledge Graphs, and Decision Intelligence to help engineering teams analyze project risks, procurement delays, compliance issues, and downstream impacts in real time.

---

# ✨ Features

- 🤖 Multi-Agent AI Decision Engine
- 🧠 GraphRAG-powered Knowledge Retrieval
- 📊 Executive Mission Control Dashboard
- 💬 AI Engineering Copilot
- 🌐 Interactive Knowledge Graph
- 📄 Semantic Document Search
- 📦 Procurement & Supply Chain Tracking
- ⚠️ NCR (Non-Conformance) Management
- 📈 Engineering Change Impact Analysis
- 📑 AI-generated Executive Summaries

---

# 🖥️ Application Modules

| Module | URL |
|---------|-----|
| Homepage | http://localhost:3000 |
| Mission Control Dashboard | http://localhost:3000/dashboard |
| AI Chat | http://localhost:3000/chat |
| Multi-Agent Analysis | http://localhost:3000/analysis |
| Knowledge Graph | http://localhost:3000/graph |
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

<p align="center">
  <img src="assets/architecture.png" alt="SiteAI System Architecture" width="100%">
</p>


---
