"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function AdminDashboardCharts({ chartData, revenueData }: { chartData: any[]; revenueData: any[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Card className="rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="type-label text-primary">Revenue Trend</p>
            <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Monthly platform revenue</h2>
          </div>
          <Badge variant="success">Live</Badge>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.18)" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#adminRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="rounded-3xl p-6">
        <p className="type-label text-primary">Platform Mix</p>
        <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Operational distribution</h2>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={5}>
                {chartData.map((_, index) => <Cell key={index} fill={["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6"][index % 4]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
