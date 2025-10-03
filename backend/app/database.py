import aiosqlite
import os
from pathlib import Path
from datetime import datetime, timedelta
import random

DATABASE_PATH = Path(__file__).parent / "mcp_dashboard.db"

async def init_db():
    """Initialize the database and create tables"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                provider TEXT NOT NULL,
                agents INTEGER NOT NULL,
                requests INTEGER NOT NULL,
                latency INTEGER NOT NULL,
                success_rate REAL NOT NULL,
                uptime REAL NOT NULL,
                color TEXT NOT NULL,
                icon TEXT NOT NULL,
                api_endpoint TEXT,
                docs_url TEXT,
                health_check_url TEXT,
                tags TEXT,
                owner_team TEXT,
                version TEXT,
                discovery_source TEXT,
                cpu_usage REAL,
                memory_usage REAL,
                network_usage REAL
            )
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS metrics_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                requests INTEGER NOT NULL,
                latency INTEGER NOT NULL,
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                version TEXT,
                capabilities TEXT,
                requests INTEGER NOT NULL DEFAULT 0,
                success_rate REAL NOT NULL DEFAULT 0.0,
                latency INTEGER NOT NULL DEFAULT 0,
                uptime REAL NOT NULL DEFAULT 0.0,
                created_at TEXT NOT NULL,
                last_active TEXT NOT NULL,
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        """)
        
        cursor = await db.execute("SELECT COUNT(*) FROM services")
        count = await cursor.fetchone()
        
        if count[0] == 0:
            services = [
                ("OpenAI MCP", "OpenAI", 24, 124500, 120, 99.2, 99.9, "green", "openai", 
                 "https://api.openai.com/v1/mcp", "https://docs.openai.com/mcp", "https://api.openai.com/health",
                 "AI,LLM,GPT,Production", "AI Platform Team", "v2.1.0", "APIM Auto-Discovery", 65.3, 72.1, 45.8),
                ("Copilot MCP", "Microsoft", 18, 89200, 95, 99.5, 99.8, "blue", "copilot",
                 "https://api.copilot.microsoft.com/v1", "https://docs.microsoft.com/copilot-mcp", "https://api.copilot.microsoft.com/health",
                 "AI,Copilot,Enterprise,Production", "Microsoft AI Team", "v3.0.2", "APIM Auto-Discovery", 58.2, 68.5, 52.3),
                ("AI Foundry", "Azure", 32, 156800, 85, 99.8, 99.95, "cyan", "foundry",
                 "https://ai-foundry.azure.com/api/v2", "https://docs.azure.com/ai-foundry", "https://ai-foundry.azure.com/health",
                 "AI,Azure,MLOps,Production", "Azure AI Team", "v4.2.1", "APIM Auto-Discovery", 78.9, 81.2, 67.4),
                ("Workday", "Workday", 12, 45300, 180, 98.9, 99.5, "orange", "workday",
                 "https://api.workday.com/integration/v3", "https://docs.workday.com/integration", "https://api.workday.com/status",
                 "HR,Integration,Enterprise", "Enterprise Integration Team", "v1.8.3", "Manual Configuration", 42.5, 55.8, 38.6),
                ("Salesforce", "Salesforce", 8, 32100, 145, 99.1, 99.2, "teal", "salesforce",
                 "https://api.salesforce.com/services/data/v58", "https://developer.salesforce.com/docs", "https://api.salesforce.com/health",
                 "CRM,Sales,Integration", "CRM Integration Team", "v2.3.1", "APIM Auto-Discovery", 51.7, 62.3, 41.9),
                ("Analytics", "Internal", 15, 67900, 110, 99.4, 99.7, "purple", "analytics",
                 "https://analytics.internal.com/api/v1", "https://wiki.internal.com/analytics", "https://analytics.internal.com/ping",
                 "Analytics,Reporting,Internal", "Data Platform Team", "v1.5.0", "Service Registry", 69.4, 75.6, 58.2),
                ("SAP A2A", "SAP", 16, 78400, 165, 98.7, 99.3, "indigo", "sap",
                 "https://sap-a2a.enterprise.com/api/v2", "https://docs.sap.com/a2a", "https://sap-a2a.enterprise.com/health",
                 "ERP,Integration,SAP,Production", "ERP Integration Team", "v3.1.2", "Manual Configuration", 73.2, 79.8, 61.5),
                ("ServiceNow", "ServiceNow", 11, 54200, 135, 99.3, 99.6, "emerald", "servicenow",
                 "https://api.servicenow.com/v1/mcp", "https://docs.servicenow.com/mcp", "https://api.servicenow.com/healthcheck",
                 "ITSM,Ticketing,Integration", "IT Operations Team", "v2.7.4", "APIM Auto-Discovery", 47.8, 59.2, 44.7)
            ]
            
            await db.executemany("""
                INSERT INTO services (name, provider, agents, requests, latency, success_rate, uptime, color, icon,
                                    api_endpoint, docs_url, health_check_url, tags, owner_team, version, discovery_source,
                                    cpu_usage, memory_usage, network_usage)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, services)
        
        history_cursor = await db.execute("SELECT COUNT(*) FROM metrics_history")
        history_count = await history_cursor.fetchone()
        
        if history_count[0] == 0:
            services_cursor = await db.execute("SELECT id, requests, latency FROM services")
            services_data = await services_cursor.fetchall()
            
            history_entries = []
            now = datetime.utcnow()
            
            for service_row in services_data:
                service_id = service_row[0]
                base_requests = service_row[1] // 168
                base_latency = service_row[2]
                
                for hours_ago in range(168, 0, -1):
                    timestamp = (now - timedelta(hours=hours_ago)).isoformat()
                    
                    variation = random.uniform(0.85, 1.15)
                    requests = int(base_requests * variation)
                    
                    latency_variation = random.uniform(0.9, 1.1)
                    latency = int(base_latency * latency_variation)
                    
                    history_entries.append((service_id, timestamp, requests, latency))
            
            await db.executemany("""
                INSERT INTO metrics_history (service_id, timestamp, requests, latency)
                VALUES (?, ?, ?, ?)
            """, history_entries)
        
        import json
        from pathlib import Path
        
        mcp_metrics_file = Path("/tmp/mcp_metrics.json")
        if mcp_metrics_file.exists():
            with open(mcp_metrics_file, 'r') as f:
                mcp_data = json.load(f)
            
            summary = mcp_data['summary']
            
            cursor = await db.execute("SELECT COUNT(*) FROM services WHERE name = 'Weather MCP'")
            weather_exists = await cursor.fetchone()
            
            if weather_exists[0] == 0:
                await db.execute("""
                    INSERT INTO services (name, provider, agents, requests, latency, success_rate, uptime, color, icon,
                                        api_endpoint, docs_url, health_check_url, tags, owner_team, version, discovery_source,
                                        cpu_usage, memory_usage, network_usage)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    "Weather MCP",
                    "Azure APIM",
                    1,
                    summary['total'],
                    summary['avg_latency'],
                    summary['success_rate'],
                    99.8,
                    "cyan",
                    "weather",
                    "https://apim2025.azure-api.net/mcp?subscription-key=6cec5f6ff0874757b4d73b3c583babc9",
                    "https://learn.microsoft.com/en-us/azure/api-management/",
                    "https://apim2025.azure-api.net/mcp?subscription-key=6cec5f6ff0874757b4d73b3c583babc9",
                    "Weather,MCP,AI,GPT-5,Production,Real-Time",
                    "Azure Integration Team",
                    "v1.0.0",
                    "APIM Auto-Discovery",
                    45.2,
                    58.7,
                    38.9
                ))
        
        agents_cursor = await db.execute("SELECT COUNT(*) FROM agents")
        agents_count = await agents_cursor.fetchone()
        
        if agents_count[0] == 0:
            services_cursor = await db.execute("SELECT id, name, agents FROM services")
            all_services = await services_cursor.fetchall()
            
            agents_data = []
            now = datetime.utcnow()
            created_time = now.isoformat()
            
            for service_row in all_services:
                service_id = service_row[0]
                service_name = service_row[1]
                num_agents = service_row[2]
                
                if service_name == "Weather MCP" and mcp_metrics_file.exists():
                    agents_data.append((
                        service_id,
                        "Weather Agent",
                        "GPT-5 powered weather information agent that provides real-time weather data, forecasts, and climate insights for locations worldwide",
                        "active",
                        "v1.0.0",
                        '{"tools": ["get_weather"], "models": ["gpt-5"], "capabilities": ["weather_query", "forecast", "climate_info"]}',
                        summary['total'],
                        summary['success_rate'],
                        summary['avg_latency'],
                        99.8,
                        created_time,
                        created_time
                    ))
                else:
                    agent_types = ["Assistant", "Analyzer", "Processor", "Monitor", "Coordinator", "Optimizer"]
                    for i in range(num_agents):
                        agent_name = f"{service_name} {agent_types[i % len(agent_types)]} {i+1}"
                        agents_data.append((
                            service_id,
                            agent_name,
                            f"Automated agent for {service_name} - handles {agent_types[i % len(agent_types)].lower()} operations",
                            "active" if random.random() > 0.1 else "maintenance",
                            f"v{random.randint(1,3)}.{random.randint(0,9)}.{random.randint(0,9)}",
                            f'{{"capabilities": ["{agent_types[i % len(agent_types)].lower()}", "monitoring", "reporting"]}}',
                            random.randint(1000, 50000),
                            random.uniform(95.0, 99.9),
                            random.randint(50, 300),
                            random.uniform(98.0, 99.99),
                            (now - timedelta(days=random.randint(1, 365))).isoformat(),
                            (now - timedelta(hours=random.randint(0, 24))).isoformat()
                        ))
            
            await db.executemany("""
                INSERT INTO agents (service_id, name, description, status, version, capabilities, requests, success_rate, latency, uptime, created_at, last_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, agents_data)
            
        await db.commit()

async def get_db():
    """Get database connection"""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db
