"""
SiteAI — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.db.connections import (
    init_postgres, close_postgres,
    init_neo4j, close_neo4j,
    init_qdrant, close_qdrant,
)

setup_logging()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SiteAI backend starting", env=settings.app_env)
    try:
        await init_postgres()
        logger.info("PostgreSQL ready")
    except Exception as e:
        logger.warning("PostgreSQL unavailable", error=str(e))
    try:
        await init_neo4j()
        logger.info("Neo4j ready")
    except Exception as e:
        logger.warning("Neo4j unavailable", error=str(e))
    try:
        await init_qdrant()
        logger.info("Qdrant ready")
    except Exception as e:
        logger.warning("Qdrant unavailable", error=str(e))

    if settings.debug:
        try:
            from app.services.knowledge_graph import knowledge_graph_service
            from app.services.graphrag import seed_vector_index
            PROJECT_ID = "00000000-0000-0000-0000-000000000002"
            await knowledge_graph_service.seed_project_graph(PROJECT_ID)
            await seed_vector_index(PROJECT_ID)
            logger.info("Demo data seeded")
        except Exception as e:
            logger.warning("Demo seed skipped", error=str(e))

    logger.info("SiteAI backend ready — docs at http://localhost:8000/docs")
    yield

    try:
        await close_postgres()
        await close_neo4j()
        await close_qdrant()
    except Exception:
        pass
    logger.info("SiteAI backend stopped")


app = FastAPI(
    title="SiteAI EPC Intelligence API",
    description="AI-powered Engineering Decision Intelligence for Data Centre EPC Projects",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

from app.routers import health, auth, projects, analysis
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(analysis.router)

from app.routers import chat, documents
app.include_router(chat.router)
app.include_router(documents.router)
