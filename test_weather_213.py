import httpx
import json
import asyncio
from datetime import datetime
import random

async def test_weather_query(client, query, query_num):
    url = "https://apim2025.azure-api.net/mcp"
    headers = {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": "6cec5f6ff0874757b4d73b3c583babc9"
    }
    
    payload = {
        "jsonrpc": "2.0",
        "id": query_num,
        "method": "tools/call",
        "params": {
            "name": "get_weather",
            "arguments": {
                "query": query
            }
        }
    }
    
    start_time = datetime.utcnow()
    try:
        response = await client.post(url, json=payload, headers=headers, timeout=30.0)
        end_time = datetime.utcnow()
        latency = int((end_time - start_time).total_seconds() * 1000)
        
        if response.status_code == 200:
            data = response.json()
            if "result" in data:
                return {"success": True, "latency": latency, "query": query}
            else:
                return {"success": False, "latency": latency, "query": query, "error": "No result in response"}
        else:
            return {"success": False, "latency": latency, "query": query, "error": f"Status {response.status_code}"}
    except Exception as e:
        end_time = datetime.utcnow()
        latency = int((end_time - start_time).total_seconds() * 1000)
        return {"success": False, "latency": latency, "query": query, "error": str(e)}

async def main():
    weather_queries = [
        "What's the weather in New York City?",
        "Weather forecast for London",
        "Current conditions in Tokyo",
        "Will it rain in Seattle tomorrow?",
        "Temperature in Los Angeles today",
        "Weather in Paris this week",
        "Forecast for Chicago next 3 days",
        "What's the weather like in Miami?",
        "Is it snowing in Denver?",
        "Current weather in Boston",
        "Weather forecast for San Francisco",
        "What's the temperature in Austin?",
        "Will it be sunny in Phoenix?",
        "Weather in Atlanta next week",
        "Current conditions in Washington DC",
        "Forecast for Las Vegas",
        "What's the weather in Portland?",
        "Is it raining in Vancouver?",
        "Weather in Montreal this weekend",
        "Temperature in Toronto today",
        "Weather forecast for Sydney",
        "Current conditions in Melbourne",
        "What's the weather in Brisbane?",
        "Forecast for Perth",
        "Weather in Auckland",
        "Is it hot in Singapore?",
        "Current weather in Bangkok",
        "Weather forecast for Hong Kong",
        "What's the temperature in Shanghai?",
        "Will it rain in Beijing?",
        "Weather in Seoul",
        "Current conditions in Mumbai",
        "Forecast for Delhi",
        "What's the weather in Bangalore?",
        "Weather in Dubai",
        "Is it hot in Cairo?",
        "Current weather in Istanbul",
        "Weather forecast for Moscow",
        "What's the temperature in Berlin?",
        "Will it snow in Stockholm?",
        "Weather in Copenhagen",
        "Current conditions in Amsterdam",
        "Forecast for Brussels",
        "What's the weather in Madrid?",
        "Weather in Rome",
        "Is it sunny in Athens?",
        "Current weather in Lisbon",
        "Weather forecast for Vienna",
        "What's the temperature in Prague?",
        "Will it rain in Budapest?",
    ]
    
    extended_queries = []
    for i in range(213):
        base_query = weather_queries[i % len(weather_queries)]
        
        variations = [
            base_query,
            base_query.replace("weather", "conditions"),
            base_query.replace("forecast", "outlook"),
            f"Detailed {base_query.lower()}",
            f"Give me {base_query.lower()}",
        ]
        extended_queries.append(variations[i % len(variations)])
    
    print(f"Running {len(extended_queries)} weather queries...")
    
    results = []
    async with httpx.AsyncClient() as client:
        for i, query in enumerate(extended_queries):
            print(f"Query {i+1}/213: {query[:50]}...")
            result = await test_weather_query(client, query, i+1)
            results.append(result)
            
            if (i + 1) % 20 == 0:
                print(f"Progress: {i+1}/213 queries completed")
            
            await asyncio.sleep(0.1)
    
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    total_latency = sum(r["latency"] for r in successful)
    avg_latency = total_latency // len(successful) if successful else 0
    success_rate = (len(successful) / len(results)) * 100 if results else 0
    
    summary = {
        "total": len(results),
        "successful": len(successful),
        "failed": len(failed),
        "avg_latency": avg_latency,
        "success_rate": round(success_rate, 2)
    }
    
    output = {
        "timestamp": datetime.utcnow().isoformat(),
        "summary": summary,
        "results": results
    }
    
    with open("/tmp/mcp_metrics.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Weather MCP Test Results")
    print(f"{'='*60}")
    print(f"Total Queries: {summary['total']}")
    print(f"Successful: {summary['successful']}")
    print(f"Failed: {summary['failed']}")
    print(f"Success Rate: {summary['success_rate']}%")
    print(f"Average Latency: {summary['avg_latency']}ms")
    print(f"\nResults saved to /tmp/mcp_metrics.json")

if __name__ == "__main__":
    asyncio.run(main())
