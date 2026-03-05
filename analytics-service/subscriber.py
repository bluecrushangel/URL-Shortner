import asyncio
import json
import os
import redis.asyncio as aioredis
import asyncpg
from ua_parser import user_agent_parser
from datetime import datetime
import requests

async def get_country(ip):
    try:
        # skip localhost IPs
        if ip in ("127.0.0.1", "::1", ""):
            return "Unknown"
        response = requests.get(f"http://ip-api.com/json/{ip}", timeout=3)
        data = response.json()
        return data.get("country", "Unknown")
    except:
        return "Unknown"

def get_device(user_agent):
    try:
        parsed = user_agent_parser.Parse(user_agent)
        device = parsed["device"]["family"]
        if device == "Other":
            return "Desktop"
        return "Mobile"
    except:
        return "Unknown"

async def listen_for_clicks():
    # connect to redis
    r = aioredis.from_url(os.getenv("REDIS_URL", "redis://redis:6379"))
    
    # connect to postgres
    db = await asyncpg.connect(os.getenv("DATABASE_URL"))

    pubsub = r.pubsub()
    await pubsub.subscribe("clicks")

    print("Analytics subscriber listening for clicks...")

    async for message in pubsub.listen():
        if message["type"] != "message":
            continue

        try:
            data = json.loads(message["data"])
            code = data.get("code")
            timestamp = datetime.fromisoformat(data.get("timestamp").replace("Z", "+00:00")).replace(tzinfo=None) # Weird bug, I HATE timezone stuff
            ip = data.get("ip", "")
            user_agent = data.get("userAgent", "")

            country = await get_country(ip)
            device = get_device(user_agent)

            await db.execute(
                """
                INSERT INTO clicks (code, timestamp, ip, country, device)
                VALUES ($1, $2, $3, $4, $5)
                """,
                code, timestamp, ip, country, device
            )

            print(f"Click recorded: {code} from {country} on {device}")

        except Exception as e:
            print(f"Error processing click: {e}")