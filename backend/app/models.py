from pydantic import BaseModel
from typing import List

class Service(BaseModel):
    id: int
    name: str
    provider: str
    agents: int
    requests: int
    latency: int
    success_rate: float
    uptime: float
    color: str
    icon: str
    api_endpoint: str | None = None
    docs_url: str | None = None
    health_check_url: str | None = None
    tags: str | None = None
    owner_team: str | None = None
    version: str | None = None
    discovery_source: str | None = None
    cpu_usage: float | None = None
    memory_usage: float | None = None
    network_usage: float | None = None

class DashboardMetrics(BaseModel):
    total_requests: int
    active_servers: str
    avg_latency: int
    total_agents: int
    services: List[Service]

class Agent(BaseModel):
    id: int
    service_id: int
    name: str
    description: str | None = None
    status: str
    version: str | None = None
    capabilities: str | None = None
    requests: int
    success_rate: float
    latency: int
    uptime: float
    created_at: str
    last_active: str
