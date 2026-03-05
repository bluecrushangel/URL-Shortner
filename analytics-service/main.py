import asyncio
import os
import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from subscriber import listen_for_clicks

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(listen_for_clicks())
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/stats/{code}")
async def get_stats(code: str):
    db = await asyncpg.connect(os.getenv("DATABASE_URL"))
    try:
        total = await db.fetchval(
            "SELECT COUNT(*) FROM clicks WHERE code = $1", code
        )
        countries = await db.fetch(
            """
            SELECT country, COUNT(*) as count 
            FROM clicks WHERE code = $1 
            GROUP BY country ORDER BY count DESC
            """, code
        )
        devices = await db.fetch(
            """
            SELECT device, COUNT(*) as count 
            FROM clicks WHERE code = $1 
            GROUP BY device ORDER BY count DESC
            """, code
        )
        timeline = await db.fetch(
            """
            SELECT DATE(timestamp) as day, COUNT(*) as count
            FROM clicks WHERE code = $1
            GROUP BY day ORDER BY day ASC
            """, code
        )
        return {
            "code": code,
            "total_clicks": total,
            "by_country": [dict(r) for r in countries],
            "by_device": [dict(r) for r in devices],
            "timeline": [dict(r) for r in timeline],
        }
    finally:
        await db.close()