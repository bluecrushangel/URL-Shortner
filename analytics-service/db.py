import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def get_db():
    return await asyncpg.connect(os.getenv("DATABASE_URL"))