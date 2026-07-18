"""
SiteAI — Database Connection Management
Manages lifecycle of all three datastores.
Provides async context managers for use in FastAPI lifespan.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
import asyncio

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from neo4j import AsyncGraphDatabase, AsyncDriver
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("db")


# ─── SQLAlchemy (PostgreSQL) ──────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


_pg_engine = None
_pg_session_factory = None


async def init_postgres():
    global _pg_engine, _pg_session_factory
    _pg_engine = create_async_engine(
        settings.database_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=settings.debug,
    )
    _pg_session_factory = async_sessionmaker(
        _pg_engine, class_=AsyncSession, expire_on_commit=False
    )
    logger.info("PostgreSQL connected", host=settings.postgres_host)


async def close_postgres():
    if _pg_engine:
        await _pg_engine.dispose()
        logger.info("PostgreSQL disconnected")


async def get_pg_session() -> AsyncGenerator[AsyncSession, None]:
    async with _pg_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─── Neo4j ────────────────────────────────────────────────────────────────────

_neo4j_driver: Optional[AsyncDriver] = None


async def init_neo4j():
    global _neo4j_driver
    _neo4j_driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
        max_connection_pool_size=20,
    )
    # Verify connectivity
    await _neo4j_driver.verify_connectivity()
    logger.info("Neo4j connected", uri=settings.neo4j_uri)

    # Create indexes and constraints
    async with _neo4j_driver.session() as session:
        await session.run(
            "CREATE CONSTRAINT asset_tag IF NOT EXISTS "
            "FOR (a:Asset) REQUIRE (a.project_id, a.asset_tag) IS UNIQUE"
        )
        await session.run(
            "CREATE INDEX asset_type IF NOT EXISTS FOR (a:Asset) ON (a.asset_type)"
        )
        await session.run(
            "CREATE INDEX spec_clause IF NOT EXISTS FOR (s:Specification) ON (s.clause_id)"
        )
    logger.info("Neo4j indexes created")


async def close_neo4j():
    if _neo4j_driver:
        await _neo4j_driver.close()
        logger.info("Neo4j disconnected")


def get_neo4j_driver() -> AsyncDriver:
    if not _neo4j_driver:
        raise RuntimeError("Neo4j driver not initialized")
    return _neo4j_driver


@asynccontextmanager
async def neo4j_session():
    driver = get_neo4j_driver()
    async with driver.session() as session:
        yield session


# ─── Qdrant ───────────────────────────────────────────────────────────────────

_qdrant_client: Optional[AsyncQdrantClient] = None


async def init_qdrant():
    global _qdrant_client
    _qdrant_client = AsyncQdrantClient(
        host=settings.qdrant_host,
        port=settings.qdrant_port,
    )

    # Create collection if it doesn't exist
    collections = await _qdrant_client.get_collections()
    existing = [c.name for c in collections.collections]

    if settings.qdrant_collection not in existing:
        await _qdrant_client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=settings.embedding_dimension,
                distance=Distance.COSINE,
            ),
        )
        logger.info("Qdrant collection created", collection=settings.qdrant_collection)
    else:
        logger.info("Qdrant collection exists", collection=settings.qdrant_collection)


async def close_qdrant():
    if _qdrant_client:
        await _qdrant_client.close()
        logger.info("Qdrant disconnected")


def get_qdrant_client() -> AsyncQdrantClient:
    if not _qdrant_client:
        raise RuntimeError("Qdrant client not initialized")
    return _qdrant_client
