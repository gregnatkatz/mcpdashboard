import { useState, useEffect } from 'react';
import { Search, X, Activity, Users, Clock, TrendingUp, Server, Zap, Database, Sun, Cloud, CloudRain, CloudSnow, Wind, CloudFog } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Service {
  id: number;
  name: string;
  provider: string;
  agents: number;
  requests: number;
  latency: number;
  success_rate: number;
  uptime: number;
  color: string;
  icon: string;
  api_endpoint?: string;
  docs_url?: string;
  health_check_url?: string;
  tags?: string;
  owner_team?: string;
  version?: string;
  discovery_source?: string;
  cpu_usage?: number;
  memory_usage?: number;
  network_usage?: number;
}

interface Agent {
  id: number;
  service_id: number;
  name: string;
  description?: string;
  status: string;
  version?: string;
  capabilities?: string;
  requests: number;
  success_rate: number;
  latency: number;
  uptime: number;
  created_at: string;
  last_active: string;
}

interface AgentDetail extends Agent {
  service_name: string;
  provider: string;
  color: string;
}

interface DashboardMetrics {
  total_requests: number;
  active_servers: string;
  avg_latency: number;
  total_agents: number;
  services: Service[];
}

function App() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mcp-tester'>('dashboard');
  const [mcpQuestion, setMcpQuestion] = useState('');
  const [mcpResponse, setMcpResponse] = useState<any>(null);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [showAgents, setShowAgents] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchAgents = async (serviceId: number) => {
    setLoadingAgents(true);
    try {
      const response = await fetch(`${API_URL}/api/services/${serviceId}/agents`);
      const data = await response.json();
      setAgents(data.agents);
      setShowAgents(true);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchAgentDetails = async (agentId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/agents/${agentId}`);
      const data = await response.json();
      setSelectedAgent(data);
    } catch (error) {
      console.error('Error fetching agent details:', error);
    }
  };

  const handleMcpQuery = async () => {
    if (!mcpQuestion.trim()) return;
    
    setMcpLoading(true);
    setMcpError(null);
    setMcpResponse(null);

    try {
      const response = await fetch(`${API_URL}/api/mcp/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: mcpQuestion }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setMcpResponse(data);
    } catch (error: any) {
      setMcpError(error.message || 'Failed to query MCP');
    } finally {
      setMcpLoading(false);
    }
  };

  const filteredServices = metrics?.services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.provider.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const topPerforming = [...(metrics?.services || [])].sort((a, b) => b.requests - a.requests).slice(0, 5);
  const lowestLatency = [...(metrics?.services || [])].sort((a, b) => a.latency - b.latency).slice(0, 5);

  const getWeatherIcon = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('snow') || lowerText.includes('snowy') || lowerText.includes('blizzard')) {
      return <CloudSnow className="w-16 h-16 text-blue-300" />;
    } else if (lowerText.includes('rain') || lowerText.includes('rainy') || lowerText.includes('shower') || lowerText.includes('drizzle')) {
      return <CloudRain className="w-16 h-16 text-blue-400" />;
    } else if (lowerText.includes('fog') || lowerText.includes('foggy') || lowerText.includes('mist')) {
      return <CloudFog className="w-16 h-16 text-gray-400" />;
    } else if (lowerText.includes('cloud') || lowerText.includes('cloudy') || lowerText.includes('overcast')) {
      return <Cloud className="w-16 h-16 text-gray-300" />;
    } else if (lowerText.includes('wind') || lowerText.includes('windy') || lowerText.includes('breezy')) {
      return <Wind className="w-16 h-16 text-cyan-300" />;
    } else if (lowerText.includes('sun') || lowerText.includes('sunny') || lowerText.includes('clear') || lowerText.includes('fair')) {
      return <Sun className="w-16 h-16 text-yellow-400" />;
    } else {
      return <Cloud className="w-16 h-16 text-gray-300" />;
    }
  };

  const extractWeatherText = (response: any): string => {
    try {
      if (response?.result?.content?.[0]?.text) {
        return response.result.content[0].text;
      }
      return JSON.stringify(response, null, 2);
    } catch (e) {
      return 'Unable to parse weather response';
    }
  };

  const agentActivityPieData = metrics?.services.map(service => ({
    name: service.name,
    value: service.agents,
    color: service.color
  })) || [];

  const agentActivityLineData = [
    { time: '00:00', agents: 12, requests: 450 },
    { time: '04:00', agents: 8, requests: 280 },
    { time: '08:00', agents: 18, requests: 720 },
    { time: '12:00', agents: 24, requests: 980 },
    { time: '16:00', agents: 22, requests: 890 },
    { time: '20:00', agents: 15, requests: 620 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MCP Dashboard
          </h1>
          <p className="text-gray-400">Monitor and manage your Model Context Protocol services</p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('mcp-tester')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'mcp-tester'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            MCP Tester
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{metrics.total_requests.toLocaleString()}</span>
                  </div>
                  <p className="text-blue-100 text-sm">Total Requests</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Server className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{metrics.active_servers}</span>
                  </div>
                  <p className="text-purple-100 text-sm">Active Servers</p>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{metrics.avg_latency}ms</span>
                  </div>
                  <p className="text-green-100 text-sm">Avg Latency</p>
                </div>

                <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{metrics.total_agents}</span>
                  </div>
                  <p className="text-orange-100 text-sm">Total Agents</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-700 hover:border-gray-600"
                  onClick={() => setSelectedService(service)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: service.color }}
                    >
                      {service.icon}
                    </div>
                    {service.version && (
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">{service.version}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{service.provider}</p>
                  
                  {service.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {service.tags.split(',').map((tag, idx) => (
                        <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Agents</span>
                      <span className="font-medium">{service.agents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Requests</span>
                      <span className="font-medium">{service.requests.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Latency</span>
                      <span className="font-medium">{service.latency}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="font-medium">{service.success_rate}%</span>
                    </div>
                  </div>

                  {(service.cpu_usage !== undefined || service.memory_usage !== undefined || service.network_usage !== undefined) && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                      {service.cpu_usage !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">CPU</span>
                            <span>{service.cpu_usage}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${service.cpu_usage}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {service.memory_usage !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Memory</span>
                            <span>{service.memory_usage}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${service.memory_usage}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {service.network_usage !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Network</span>
                            <span>{service.network_usage}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${service.network_usage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Agent Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={agentActivityPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {agentActivityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Agent Activity Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={agentActivityLineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="agents" stroke="#3B82F6" strokeWidth={2} name="Active Agents" />
                      <Line type="monotone" dataKey="requests" stroke="#10B981" strokeWidth={2} name="Total Requests" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Performing Services</h3>
                  <div className="space-y-3">
                    {topPerforming.map((service, idx) => (
                      <div
                        key={service.id}
                        className="flex items-center gap-3 bg-gray-700 rounded-lg p-3"
                      >
                        <span className="text-2xl font-bold text-gray-500">#{idx + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-400">{service.requests.toLocaleString()} requests</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Lowest Latency Services</h3>
                  <div className="space-y-3">
                    {lowestLatency.map((service, idx) => (
                      <div
                        key={service.id}
                        className="flex items-center gap-3 bg-gray-700 rounded-lg p-3"
                      >
                        <span className="text-2xl font-bold text-gray-500">#{idx + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-400">{service.latency}ms latency</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'mcp-tester' && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              MCP Weather Tester
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Weather Question</label>
                <input
                  type="text"
                  value={mcpQuestion}
                  onChange={(e) => setMcpQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleMcpQuery()}
                  placeholder="e.g., What's the weather in New York?"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleMcpQuery}
                disabled={mcpLoading || !mcpQuestion.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {mcpLoading ? 'Querying...' : 'Query MCP'}
              </button>

              {mcpError && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300 font-medium">Error</p>
                  <p className="text-red-200 text-sm mt-1">{mcpError}</p>
                </div>
              )}

              {mcpResponse && (
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getWeatherIcon(extractWeatherText(mcpResponse))}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-400 mb-3">Weather Report</h3>
                      <div className="text-gray-200 leading-relaxed">
                        {extractWeatherText(mcpResponse)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedService && !showAgents && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 border-b border-gray-700"
              style={{ backgroundColor: selectedService.color + '20' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: selectedService.color }}
                  >
                    {selectedService.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedService.name}</h2>
                    <p className="text-gray-400">{selectedService.provider}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Agents</p>
                    <p className="text-2xl font-bold">{selectedService.agents}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Total Requests</p>
                    <p className="text-2xl font-bold">{selectedService.requests.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Avg Latency</p>
                    <p className="text-2xl font-bold">{selectedService.latency}ms</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Success Rate</p>
                    <p className="text-2xl font-bold">{selectedService.success_rate}%</p>
                  </div>
                </div>

                <div className="mt-4 bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Uptime</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${selectedService.uptime}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold">{selectedService.uptime}%</span>
                  </div>
                </div>
              </div>

              {(selectedService.cpu_usage !== undefined || selectedService.memory_usage !== undefined || selectedService.network_usage !== undefined) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Resource Utilization</h3>
                  <div className="space-y-3">
                    {selectedService.cpu_usage !== undefined && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">CPU Usage</span>
                          <span className="font-bold">{selectedService.cpu_usage}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{ width: `${selectedService.cpu_usage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedService.memory_usage !== undefined && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Memory Usage</span>
                          <span className="font-bold">{selectedService.memory_usage}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full"
                            style={{ width: `${selectedService.memory_usage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedService.network_usage !== undefined && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Network Usage</span>
                          <span className="font-bold">{selectedService.network_usage}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-3">
                          <div
                            className="bg-purple-500 h-3 rounded-full"
                            style={{ width: `${selectedService.network_usage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-3">Metadata</h3>
                <div className="space-y-3">
                  {selectedService.api_endpoint && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">API Endpoint</p>
                      <p className="text-sm font-mono break-all">{selectedService.api_endpoint}</p>
                    </div>
                  )}
                  {selectedService.docs_url && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Documentation</p>
                      <a href={selectedService.docs_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline break-all">
                        {selectedService.docs_url}
                      </a>
                    </div>
                  )}
                  {selectedService.health_check_url && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Health Check</p>
                      <p className="text-sm font-mono break-all">{selectedService.health_check_url}</p>
                    </div>
                  )}
                  {selectedService.owner_team && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Owner Team</p>
                      <p className="text-sm">{selectedService.owner_team}</p>
                    </div>
                  )}
                  {selectedService.version && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Version</p>
                      <p className="text-sm">{selectedService.version}</p>
                    </div>
                  )}
                  {selectedService.discovery_source && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Discovery Source</p>
                      <p className="text-sm">{selectedService.discovery_source}</p>
                    </div>
                  )}
                  {selectedService.tags && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-sm mb-1">Tags</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedService.tags.split(',').map((tag, idx) => (
                          <span key={idx} className="bg-gray-600 px-3 py-1 rounded-full text-sm">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  fetchAgents(selectedService.id);
                }}
                disabled={loadingAgents}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Database className="w-5 h-5" />
                {loadingAgents ? 'Loading Agents...' : `View Agents (${selectedService.agents})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAgents && selectedService && !selectedAgent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowAgents(false);
            setAgents([]);
          }}
        >
          <div
            className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 border-b border-gray-700"
              style={{ backgroundColor: selectedService.color + '20' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: selectedService.color }}
                  >
                    {selectedService.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedService.name} - Agents</h2>
                    <p className="text-gray-400">{agents.length} agents</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAgents(false);
                    setAgents([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => fetchAgentDetails(agent.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{agent.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        agent.status === 'active' ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    {agent.description && (
                      <p className="text-sm text-gray-400 mb-3">{agent.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400">Requests</p>
                        <p className="font-medium">{agent.requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Success Rate</p>
                        <p className="font-medium">{agent.success_rate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Latency</p>
                        <p className="font-medium">{agent.latency}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Uptime</p>
                        <p className="font-medium">{agent.uptime}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAgent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 border-b border-gray-700"
              style={{ backgroundColor: selectedAgent.color + '20' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                  <p className="text-gray-400">{selectedAgent.service_name} - {selectedAgent.provider}</p>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedAgent.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-300">{selectedAgent.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-3">Status</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded ${
                    selectedAgent.status === 'active' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {selectedAgent.status}
                  </span>
                  {selectedAgent.version && (
                    <span className="px-3 py-1 rounded bg-gray-700">
                      v{selectedAgent.version}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Total Requests</p>
                    <p className="text-2xl font-bold">{selectedAgent.requests.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Success Rate</p>
                    <p className="text-2xl font-bold">{selectedAgent.success_rate}%</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Avg Latency</p>
                    <p className="text-2xl font-bold">{selectedAgent.latency}ms</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Uptime</p>
                    <p className="text-2xl font-bold">{selectedAgent.uptime}%</p>
                  </div>
                </div>
              </div>

              {selectedAgent.capabilities && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Capabilities</h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm">{selectedAgent.capabilities}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                <div className="space-y-3">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-sm mb-1">Created At</p>
                    <p className="text-sm">{new Date(selectedAgent.created_at).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-400 text-sm mb-1">Last Active</p>
                    <p className="text-sm">{new Date(selectedAgent.last_active).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedAgent(null);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Back to Agents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
