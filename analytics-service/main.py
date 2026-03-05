import asyncio
import os
import asyncpg
from fastapi import FastAPI
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from subscriber import listen_for_clicks

load_dotenv()

# start the subscriber in the background when the app starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(listen_for_clicks())
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/stats/{code}")
async def get_stats(code: str):
    db = await asyncpg.connect(os.getenv("DATABASE_URL"))

    try:
        # total clicks
        total = await db.fetchval(
            "SELECT COUNT(*) FROM clicks WHERE code = $1", code
        )

        # clicks by country
        countries = await db.fetch(
            """
            SELECT country, COUNT(*) as count 
            FROM clicks WHERE code = $1 
            GROUP BY country ORDER BY count DESC
            """, code
        )

        # clicks by device
        devices = await db.fetch(
            """
            SELECT device, COUNT(*) as count 
            FROM clicks WHERE code = $1 
            GROUP BY device ORDER BY count DESC
            """, code
        )

        # clicks over time (by day)
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