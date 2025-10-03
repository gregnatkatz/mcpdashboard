from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db, get_db
from app.models import DashboardMetrics, Service, Agent
from pydantic import BaseModel
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/dashboard", response_model=DashboardMetrics)
async def get_dashboard():
    db = await get_db()
    
    cursor = await db.execute("SELECT * FROM services")
    rows = await cursor.fetchall()
    
    services = []
    total_requests = 0
    total_latency = 0
    total_agents = 0
    active_servers = 0
    
    for row in rows:
        service = Service(
            id=row["id"],
            name=row["name"],
            provider=row["provider"],
            agents=row["agents"],
            requests=row["requests"],
            latency=row["latency"],
            success_rate=row["success_rate"],
            uptime=row["uptime"],
            color=row["color"],
            icon=row["icon"],
            api_endpoint=row["api_endpoint"],
            docs_url=row["docs_url"],
            health_check_url=row["health_check_url"],
            tags=row["tags"],
            owner_team=row["owner_team"],
            version=row["version"],
            discovery_source=row["discovery_source"],
            cpu_usage=row["cpu_usage"],
            memory_usage=row["memory_usage"],
            network_usage=row["network_usage"]
        )
        services.append(service)
        total_requests += row["requests"]
        total_latency += row["latency"]
        total_agents += row["agents"]
        active_servers += 1
    
    avg_latency = total_latency // active_servers if active_servers > 0 else 0
    
    await db.close()
    
    return DashboardMetrics(
        total_requests=total_requests,
        active_servers=f"{active_servers}/{active_servers}",
        avg_latency=avg_latency,
        total_agents=total_agents,
        services=services
    )

@app.get("/api/metrics/history")
async def get_metrics_history():
    db = await get_db()
    
    cursor = await db.execute("""
        SELECT mh.timestamp, mh.requests, mh.latency, s.name, s.color
        FROM metrics_history mh
        JOIN services s ON mh.service_id = s.id
        ORDER BY mh.timestamp
    """)
    rows = await cursor.fetchall()
    
    history = []
    for row in rows:
        history.append({
            "timestamp": row["timestamp"],
            "requests": row["requests"],
            "latency": row["latency"],
            "service": row["name"],
            "color": row["color"]
        })
    
    await db.close()
    return {"history": history}

@app.get("/api/services/{service_id}/agents")
async def get_service_agents(service_id: int):
    db = await get_db()
    
    cursor = await db.execute("""
        SELECT * FROM agents
        WHERE service_id = ?
        ORDER BY name
    """, (service_id,))
    rows = await cursor.fetchall()
    
    agents = []
    for row in rows:
        agent = Agent(
            id=row["id"],
            service_id=row["service_id"],
            name=row["name"],
            description=row["description"],
            status=row["status"],
            version=row["version"],
            capabilities=row["capabilities"],
            requests=row["requests"],
            success_rate=row["success_rate"],
            latency=row["latency"],
            uptime=row["uptime"],
            created_at=row["created_at"],
            last_active=row["last_active"]
        )
        agents.append(agent)
    
    await db.close()
    return {"agents": agents}

@app.get("/api/agents/{agent_id}")
async def get_agent_details(agent_id: int):
    db = await get_db()
    
    cursor = await db.execute("""
        SELECT a.*, s.name as service_name, s.provider, s.color
        FROM agents a
        JOIN services s ON a.service_id = s.id
        WHERE a.id = ?
    """, (agent_id,))
    row = await cursor.fetchone()
    
    if not row:
        await db.close()
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = {
        "id": row["id"],
        "service_id": row["service_id"],
        "service_name": row["service_name"],
        "provider": row["provider"],
        "color": row["color"],
        "name": row["name"],
        "description": row["description"],
        "status": row["status"],
        "version": row["version"],
        "capabilities": row["capabilities"],
        "requests": row["requests"],
        "success_rate": row["success_rate"],
        "latency": row["latency"],
        "uptime": row["uptime"],
        "created_at": row["created_at"],
        "last_active": row["last_active"]
    }
    
    await db.close()
    return agent

class McpRequest(BaseModel):
    question: str

@app.post("/api/mcp/query")
async def mcp_query(request: McpRequest):
    apim_url = "https://apim2025.azure-api.net/mcp?subscription-key=6cec5f6ff0874757b4d73b3c583babc9"
    
    mcp_payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "get_weather",
            "arguments": {
                "query": request.question
            }
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"\n=== MCP REQUEST DEBUG ===")
    print(f"URL: {apim_url}")
    print(f"Payload: {mcp_payload}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(apim_url, json=mcp_payload, headers=headers)
            
            print(f"\n=== APIM RESPONSE DEBUG ===")
            print(f"Status: {response.status_code}")
            print(f"Body: {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                error_detail = f"APIM Error {response.status_code}: {response.text}"
                print(f"Raising HTTPException: {error_detail}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_detail
                )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to APIM timed out")
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error calling APIM: {str(e)}"
        print(f"Exception occurred: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
