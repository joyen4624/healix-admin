import React from "react";
import { useCustom, HttpError } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  Utensils,
  Dumbbell,
  Trophy,
  Flame,
  Medal,
  Activity,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// Interface cho dữ liệu backend trả về
interface DashboardData {
  stats: any[];
  performanceData: any[];
  userActivityData: any[];
  recentActivities: any[];
}

interface ApiResponse {
  success: boolean;
  data: DashboardData;
}

export const DashboardPage: React.FC = () => {
  const token = localStorage.getItem("healix-admin-token");

  // Sửa lỗi TS quan trọng nhất ở đây
  const { query } = useCustom<ApiResponse, HttpError>({
    url: "http://localhost:3000/api/admin/dashboard",
    method: "get",
    config: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data, isLoading, isError } = query;

  // Trạng thái Loading
  if (isLoading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="font-medium text-sm">
          Đang tải dữ liệu Command Center...
        </p>
      </div>
    );
  }

  // Trạng thái Lỗi
  if (isError) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-red-500 gap-3">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium text-sm">
          Lỗi tải dữ liệu. Vui lòng kiểm tra lại Backend.
        </p>
      </div>
    );
  }

  // Xử lý dữ liệu từ API (theo cấu trúc { success: true, data: { ... } })
  const dashboardData: DashboardData = (data as any)?.data?.data || {};

  const statsFromApi = dashboardData?.stats || [];
  const performanceData = dashboardData?.performanceData || [];
  const userActivityData = dashboardData?.userActivityData || [];
  const rawRecentActivities = dashboardData?.recentActivities || [];

  const getStatIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("user")) return <Users className="text-blue-500" />;
    if (t.includes("năng lượng") || t.includes("calo"))
      return <Flame className="text-orange-500" />;
    if (t.includes("xp")) return <Activity className="text-green-500" />;
    return <Medal className="text-yellow-500" />;
  };

  const getActivityStyling = (type: string) => {
    switch (type) {
      case "level_up":
        return {
          icon: <Medal className="w-4 h-4 text-yellow-500" />,
          color: "bg-yellow-100",
        };
      case "challenge":
        return {
          icon: <Flame className="w-4 h-4 text-orange-500" />,
          color: "bg-orange-100",
        };
      case "meal":
        return {
          icon: <Utensils className="w-4 h-4 text-green-500" />,
          color: "bg-green-100",
        };
      case "workout":
        return {
          icon: <Dumbbell className="w-4 h-4 text-blue-500" />,
          color: "bg-blue-100",
        };
      default:
        return {
          icon: <Trophy className="w-4 h-4 text-purple-500" />,
          color: "bg-purple-100",
        };
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Healix Command Center
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Theo dõi sức khỏe hệ thống và tương tác người dùng theo thời gian
            thực
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
            Xuất Báo Cáo
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors">
            <Users className="w-4 h-4" />
            Quản lý User
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsFromApi.length > 0 ? (
          statsFromApi.map((stat: any, idx: number) => (
            <Card key={idx} className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-slate-50 rounded-lg">
                  {getStatIcon(stat.title)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {stat.value}
                </div>
                <p
                  className={`text-xs font-medium flex items-center gap-1 ${
                    stat.trend === "up" ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {stat.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-sm text-slate-500 p-4">
            Chưa có dữ liệu KPI...
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Main Chart */}
        <Card className="col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Chỉ số Gamification & Vận động</CardTitle>
            <CardDescription>
              Tương quan giữa Lượng Calo đốt cháy và XP thu thập được (7 ngày
              qua)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] mt-4">
            {" "}
            {/* Giữ nguyên h-[350px] hoặc đổi thành h-87.5 nếu muốn */}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                {/* ... phần chart giữ nguyên như cũ ... */}
                <defs>
                  <linearGradient
                    id="colorCalories"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dx={-10}
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: "13px" }}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  name="Calories (kcal)"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCalories)"
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  name="Kinh nghiệm (XP)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorXp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1 border-slate-200 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Hoạt động nổi bật</CardTitle>
            <CardDescription>Live feed từ người dùng</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pr-2">
            <div className="space-y-6">
              {rawRecentActivities.length > 0 ? (
                rawRecentActivities.map((activity: any, i: number) => {
                  const style = getActivityStyling(activity.type);
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-full mt-1 shrink-0 ${style.color}`}
                      >
                        {style.icon}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {activity.user}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {activity.action}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500 text-center py-8">
                  Chưa có hoạt động mới nào.
                </div>
              )}
            </div>
            {rawRecentActivities.length > 0 && (
              <button className="w-full mt-6 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-md transition-colors">
                Xem tất cả hoạt động
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Tăng trưởng User</CardTitle>
            <CardDescription>
              Người dùng mới so với người dùng quay lại
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] mt-2">
            {" "}
            {/* Giữ h-[250px] hoặc đổi thành h-62.5 */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userActivityData}
                margin={{ left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: "8px", border: "none" }}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Bar
                  dataKey="active"
                  name="User quay lại"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="new"
                  name="User mới"
                  fill="#93c5fd"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
