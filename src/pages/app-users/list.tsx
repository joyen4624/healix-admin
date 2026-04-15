import React, { useState } from "react";
import { useDataGrid, DeleteButton } from "@refinedev/mui";
import { useOne, useUpdate, useInvalidate } from "@refinedev/core";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Close as CloseIcon,
  EditOutlined as EditIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  VisibilityOutlined as VisibilityIcon,
  LocalFireDepartment as StreakIcon,
  Stars as XpIcon,
  GroupAdd as NewUserIcon,
  HowToReg as ActiveIcon,
  LockOutlined as BanIcon,
  LockOpenOutlined as UnbanIcon,
  Key as KeyIcon,
  CardGiftcard as GiftIcon,
} from "@mui/icons-material";

// --- TYPES ---
type VerifyColor = "success" | "warning";

type UserRow = {
  id: string | number;
  email?: string;
  auth_provider?: string;
  is_verified?: boolean;
  created_at?: string | null;
  full_name?: string;
  gender?: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
  current_xp?: number | string | null;
  current_level?: number | string | null;
  target_calories?: number | string | null;
  target_water_ml?: number | string | null;
  current_streak?: number | string | null;
  diet_type?: string | null;
  disliked_foods?: string[] | string | null;
  goal_type?: string | null;
  target_weight?: number | string | null;
  weekly_goal?: string | null;
  last_active_at?: string | null;
  is_banned?: boolean;
};

type EditFormState = {
  full_name: string;
  gender: string;
  date_of_birth: string;
  avatar_url: string;
  target_calories: string;
  target_water_ml: string;
  current_xp: string;
  current_level: string;
  is_verified: string;
  goal_type: string;
};

// --- HELPERS ---
const formatDate = (value?: string | null, includeTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return includeTime
    ? date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : date.toLocaleDateString("vi-VN");
};

const formatDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getGenderLabel = (gender?: string | null) => {
  switch ((gender || "").toLowerCase()) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    case "other":
      return "Khác";
    default:
      return "-";
  }
};

const getGoalLabel = (goal?: string | null) => {
  switch ((goal || "").toLowerCase()) {
    case "lose_weight":
      return "Giảm cân";
    case "build_muscle":
      return "Tăng cơ";
    case "stay_healthy":
      return "Duy trì sức khỏe";
    default:
      return "Chưa rõ";
  }
};

const getProviderLabel = (provider?: string) => {
  if (!provider) return "-";
  switch (provider.toLowerCase()) {
    case "manual":
      return "Thủ công";
    case "google":
      return "Google";
    case "facebook":
      return "Facebook";
    case "apple":
      return "Apple";
    default:
      return provider;
  }
};

const getVerifyColor = (verified?: boolean): VerifyColor => {
  return verified ? "success" : "warning";
};

const daysAgo = (dateString?: string | null) => {
  if (!dateString) return Infinity;
  const diffTime = Math.abs(
    new Date().getTime() - new Date(dateString).getTime(),
  );
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Tự động tạo màu pastel cho Avatar
const getAvatarColor = (name: string = "") => {
  const colors = [
    "#fee2e2",
    "#dbeafe",
    "#e0e7ff",
    "#f3e8ff",
    "#fae8ff",
    "#fce7f3",
  ];
  const textColors = [
    "#9f1239",
    "#1e3a8a",
    "#3730a3",
    "#4c1d95",
    "#701a75",
    "#831843",
  ];
  const index = name.length % colors.length;
  return { bg: colors[index], text: textColors[index] };
};

// --- UI COMPONENTS ---
const StatCard = ({ title, value, color, icon }: any) => (
  <Card
    elevation={0}
    sx={{ borderRadius: 2.5, border: "1px solid #e5e7eb", height: "100%" }}
  >
    <CardContent sx={{ p: "16px !important" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 13, mb: 0.5, fontWeight: 600 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              lineHeight: 1.1,
              fontSize: 26,
              color: "#0f172a",
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${color}15`,
            color: color,
            flexShrink: 0,
            "& svg": { fontSize: 24 },
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{ fontWeight: 600, mt: 0.5, wordBreak: "break-word" }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

// --- MAIN COMPONENT ---
export const AppUsersList: React.FC = () => {
  const { dataGridProps } = useDataGrid({
    resource: "app_users",
    pagination: { mode: "server", currentPage: 1, pageSize: 10 },
  });

  const invalidate = useInvalidate();

  const updateMutation = useUpdate();
  const saving =
    (updateMutation as any).isLoading ||
    (updateMutation as any).isPending ||
    false;
  const updateUser = updateMutation.mutate;

  const [searchText, setSearchText] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [minLevelFilter, setMinLevelFilter] = useState<number | "">("");

  const [showId, setShowId] = useState<string | number | null>(null);
  const [showTab, setShowTab] = useState(0);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [giftXpAmount, setGiftXpAmount] = useState<number | "">("");

  const [editForm, setEditForm] = useState<EditFormState>({
    full_name: "",
    gender: "",
    date_of_birth: "",
    avatar_url: "",
    target_calories: "",
    target_water_ml: "",
    current_xp: "",
    current_level: "",
    is_verified: "false",
    goal_type: "",
  });

  const allRows = React.useMemo(
    () =>
      Array.isArray(dataGridProps.rows)
        ? (dataGridProps.rows as UserRow[])
        : [],
    [dataGridProps.rows],
  );

  const filteredRows = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchKeyword =
        !keyword ||
        [row?.email, row?.full_name, row?.auth_provider]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchProvider =
        providerFilter === "all" ||
        String(row?.auth_provider || "").toLowerCase() ===
          providerFilter.toLowerCase();
      const matchVerify =
        verifyFilter === "all" ||
        (verifyFilter === "verified" && !!row?.is_verified) ||
        (verifyFilter === "unverified" && !row?.is_verified);
      const matchGoal =
        goalFilter === "all" ||
        String(row?.goal_type || "").toLowerCase() === goalFilter.toLowerCase();
      const matchMinLevel =
        minLevelFilter === "" ||
        safeNumber(row?.current_level) >= minLevelFilter;

      return (
        matchKeyword &&
        matchProvider &&
        matchVerify &&
        matchGoal &&
        matchMinLevel
      );
    });
  }, [
    allRows,
    searchText,
    providerFilter,
    verifyFilter,
    goalFilter,
    minLevelFilter,
  ]);

  const stats = React.useMemo(() => {
    const totalUsers = allRows.length;
    const newUsers = allRows.filter((r) => daysAgo(r.created_at) <= 7).length;
    const active24h = allRows.filter((r) =>
      r.last_active_at ? daysAgo(r.last_active_at) <= 1 : false,
    ).length;
    const totalXP = allRows.reduce(
      (acc, r) => acc + safeNumber(r.current_xp),
      0,
    );
    const avgStreak =
      totalUsers > 0
        ? Math.round(
            allRows.reduce((acc, r) => acc + safeNumber(r.current_streak), 0) /
              totalUsers,
          )
        : 0;

    return { totalUsers, newUsers, active24h, totalXP, avgStreak };
  }, [allRows]);

  const showQuery = useOne<UserRow>({
    resource: "app_users",
    id: showId ?? "",
    queryOptions: { enabled: showId !== null },
  });
  const showLoading =
    (showQuery as any).isLoading || (showQuery as any).isFetching || false;
  const showItem = React.useMemo(() => {
    const raw =
      (showQuery as any).data ??
      (showQuery as any).query?.data ??
      (showQuery as any).result;
    return raw
      ? raw.success !== undefined
        ? raw.data
        : raw.data ?? raw
      : undefined;
  }, [showQuery]);

  const editQuery = useOne<UserRow>({
    resource: "app_users",
    id: editId ?? "",
    queryOptions: { enabled: editId !== null },
  });
  const editLoading =
    (editQuery as any).isLoading || (editQuery as any).isFetching || false;
  const editItem = React.useMemo(() => {
    const raw =
      (editQuery as any).data ??
      (editQuery as any).query?.data ??
      (editQuery as any).result;
    return raw
      ? raw.success !== undefined
        ? raw.data
        : raw.data ?? raw
      : undefined;
  }, [editQuery]);

  React.useEffect(() => {
    if (editItem) {
      setEditForm({
        full_name: editItem.full_name ?? "",
        gender: editItem.gender ?? "",
        date_of_birth: formatDateInput(editItem.date_of_birth),
        avatar_url: editItem.avatar_url ?? "",
        target_calories: String(editItem.target_calories ?? ""),
        target_water_ml: String(editItem.target_water_ml ?? ""),
        current_xp: String(editItem.current_xp ?? ""),
        current_level: String(editItem.current_level ?? ""),
        is_verified: editItem.is_verified ? "true" : "false",
        goal_type: editItem.goal_type ?? "",
      });
    }
  }, [editItem]);

  const handleResetFilters = () => {
    setSearchText("");
    setProviderFilter("all");
    setVerifyFilter("all");
    setGoalFilter("all");
    setMinLevelFilter("");
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Email",
      "Họ tên",
      "Trạng thái",
      "Goal",
      "XP",
      "Level",
      "Streak",
      "Ngày tạo",
      "Truy cập cuối",
    ];
    const rows = filteredRows.map((row) => [
      row?.id ?? "",
      row?.email ?? "",
      row?.full_name ?? "",
      row?.is_banned ? "Khóa" : "Bình thường",
      getGoalLabel(row?.goal_type),
      row?.current_xp ?? 0,
      row?.current_level ?? 0,
      row?.current_streak ?? 0,
      formatDate(row?.created_at),
      formatDate(row?.last_active_at),
    ]);
    const csvContent = [headers, ...rows]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }),
    );
    link.setAttribute("download", "healix-users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickUpdate = (
    id: string | number,
    field: string,
    value: any,
    successMsg: string,
  ) => {
    updateUser(
      { resource: "app_users", id, values: { [field]: value } },
      {
        onSuccess: () => {
          invalidate({ resource: "app_users", invalidates: ["list"] });
          alert(successMsg);
        },
      },
    );
  };

  const handleGiveXP = () => {
    if (editId == null || !giftXpAmount) return;
    const currentXp = safeNumber(editItem?.current_xp);
    updateUser(
      {
        resource: "app_users",
        id: editId,
        values: { current_xp: currentXp + Number(giftXpAmount) },
      },
      {
        onSuccess: () => {
          invalidate({
            resource: "app_users",
            invalidates: ["list", "detail"],
          });
          setGiftXpAmount("");
          alert(`Đã cộng ${giftXpAmount} XP thành công!`);
        },
      },
    );
  };

  const handleCloseEdit = () => {
    setEditId(null);
    setGiftXpAmount("");
    setEditForm({
      full_name: "",
      gender: "",
      date_of_birth: "",
      avatar_url: "",
      target_calories: "",
      target_water_ml: "",
      current_xp: "",
      current_level: "",
      is_verified: "false",
      goal_type: "",
    });
  };

  const handleSaveEdit = () => {
    if (editId == null) return;
    updateUser(
      {
        resource: "app_users",
        id: editId,
        values: {
          full_name: editForm.full_name,
          gender: editForm.gender || null,
          date_of_birth: editForm.date_of_birth || null,
          avatar_url: editForm.avatar_url || null,
          target_calories: Number(editForm.target_calories || 0),
          target_water_ml: Number(editForm.target_water_ml || 0),
          current_xp: Number(editForm.current_xp || 0),
          current_level: Number(editForm.current_level || 0),
          is_verified: editForm.is_verified === "true",
          goal_type: editForm.goal_type || null,
        },
      },
      {
        onSuccess: async () => {
          await invalidate({
            resource: "app_users",
            invalidates: ["list", "detail"],
          });
          handleCloseEdit();
        },
      },
    );
  };

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "user",
        headerName: "Người dùng",
        minWidth: 260,
        flex: 1.5,
        sortable: false,
        renderCell: ({ row }) => {
          const avatarTheme = getAvatarColor(row.full_name);
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                height: "100%",
                py: 1.5,
                minWidth: 0,
              }}
            >
              <Tooltip
                title={
                  <Box sx={{ p: 0.5 }}>
                    Provider: <b>{getProviderLabel(row.auth_provider)}</b>
                    <br />
                    Trạng thái:{" "}
                    <b>{row.is_banned ? "Bị khóa" : "Bình thường"}</b>
                  </Box>
                }
                arrow
              >
                <Avatar
                  src={row.avatar_url || undefined}
                  sx={{
                    width: 44,
                    height: 44,
                    fontSize: 16,
                    fontWeight: 700,
                    bgcolor: row.is_banned ? "#fca5a5" : avatarTheme.bg,
                    color: row.is_banned ? "#7f1d1d" : avatarTheme.text,
                    cursor: "pointer",
                  }}
                >
                  {getInitials(row.full_name)}
                </Avatar>
              </Tooltip>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    noWrap: true,
                    color: row.is_banned ? "text.disabled" : "#111827",
                    textDecoration: row.is_banned ? "line-through" : "none",
                  }}
                >
                  {row.full_name || "Chưa cập nhật"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", noWrap: true, color: "#64748b" }}
                >
                  {row.email || "-"}
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "quick_verify",
        headerName: "Xác minh",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Switch
              size="small"
              checked={!!row.is_verified}
              color="success"
              onChange={(e) =>
                handleQuickUpdate(
                  row.id,
                  "is_verified",
                  e.target.checked,
                  e.target.checked ? "Đã xác minh" : "Đã hủy xác minh",
                )
              }
            />
          </Box>
        ),
      },
      {
        field: "goal_type",
        headerName: "Mục tiêu",
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Chip
              label={getGoalLabel(row.goal_type)}
              size="small"
              sx={{
                bgcolor: "#f1f5f9",
                fontWeight: 700,
                color: "#334155",
                borderRadius: 1.5,
              }}
            />
          </Box>
        ),
      },
      {
        field: "level_xp",
        headerName: "Gamification",
        width: 140,
        sortable: false,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
              py: 1.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 800, color: "#ea580c" }}
            >
              Lv.{safeNumber(row.current_level)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {safeNumber(row.current_xp).toLocaleString()} XP
            </Typography>
          </Box>
        ),
      },
      {
        field: "current_streak",
        headerName: "Streak",
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              color: "#ef4444",
              height: "100%",
            }}
          >
            <StreakIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {safeNumber(row.current_streak)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "last_active_at",
        headerName: "Truy cập cuối",
        width: 140,
        renderCell: ({ row }) => {
          const days = daysAgo(row.last_active_at);
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
                py: 1.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#334155", fontWeight: 500 }}
              >
                {formatDate(row.last_active_at)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: days <= 1 ? "success.main" : "text.secondary",
                  fontWeight: 700,
                }}
              >
                {days === 0
                  ? "Hôm nay"
                  : days === Infinity
                  ? "Chưa rõ"
                  : `${days} ngày trước`}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "actions",
        headerName: "Quản trị",
        sortable: false,
        filterable: false,
        width: 150,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Tooltip title="Xem chi tiết">
              <IconButton
                size="small"
                sx={{ color: "#0284c7" }}
                onClick={() => setShowId(row.id)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sửa hồ sơ">
              <IconButton
                size="small"
                sx={{ color: "#7c3aed" }}
                onClick={() => setEditId(row.id)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={row.is_banned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
            >
              <IconButton
                size="small"
                color={row.is_banned ? "success" : "error"}
                onClick={() =>
                  handleQuickUpdate(
                    row.id,
                    "is_banned",
                    !row.is_banned,
                    row.is_banned ? "Đã mở khóa" : "Đã khóa tài khoản",
                  )
                }
              >
                {row.is_banned ? (
                  <UnbanIcon fontSize="small" />
                ) : (
                  <BanIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [],
  );

  // --- RENDER ---
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            fontSize: { xs: 24, md: 32 },
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          Quản lý người dùng
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vận hành tài khoản, theo dõi mục tiêu và kiểm soát Gamification.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard
          title="New Users (7 Ngày)"
          value={stats.newUsers}
          color="#16a34a"
          icon={<NewUserIcon />}
        />
        <StatCard
          title="Active (24 Giờ)"
          value={stats.active24h}
          color="#2563eb"
          icon={<ActiveIcon />}
        />
        <StatCard
          title="Top Streak Avg"
          value={stats.avgStreak}
          color="#ef4444"
          icon={<StreakIcon />}
        />
        <StatCard
          title="Tổng XP Hệ thống"
          value={stats.totalXP.toLocaleString()}
          color="#d97706"
          icon={<XpIcon />}
        />
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: "0 !important" }}>
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", xl: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", xl: "center" },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#0f172a" }}
                >
                  Dữ liệu tài khoản
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kết hợp bộ lọc để tìm kiếm tệp người dùng chính xác.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                <TextField
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Email, Tên..."
                  size="small"
                  sx={{ width: 180 }}
                />

                <TextField
                  select
                  size="small"
                  label="Mục tiêu"
                  value={goalFilter}
                  onChange={(e) => setGoalFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="lose_weight">Giảm cân</MenuItem>
                  <MenuItem value="build_muscle">Tăng cơ</MenuItem>
                  <MenuItem value="stay_healthy">Duy trì sức khỏe</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Xác minh"
                  value={verifyFilter}
                  onChange={(e) => setVerifyFilter(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="verified">Đã xác minh</MenuItem>
                  <MenuItem value="unverified">Chưa xác minh</MenuItem>
                </TextField>
                <TextField
                  type="number"
                  label="Min Level"
                  size="small"
                  value={minLevelFilter}
                  onChange={(e) =>
                    setMinLevelFilter(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  sx={{ width: 100 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleResetFilters}
                  sx={{ fontWeight: 600 }}
                >
                  Xóa lọc
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportCSV}
                  sx={{
                    fontWeight: 600,
                    bgcolor: "#2563eb",
                    "&:hover": { bgcolor: "#1d4ed8" },
                  }}
                >
                  Xuất CSV
                </Button>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#e2e8f0" }} />
          <Box sx={{ width: "100%" }}>
            <DataGrid
              {...dataGridProps}
              rows={filteredRows}
              columns={columns}
              getRowId={(row) => row.id}
              getRowHeight={() => "auto"}
              autoHeight
              disableRowSelectionOnClick
              disableColumnMenu
              pageSizeOptions={[10, 20, 50]}
              sx={{
                border: "none",
                minHeight: 400,
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 700,
                  color: "#0f172a",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #f1f5f9",
                  outline: "none !important",
                },
                "& .MuiDataGrid-row:hover": { bgcolor: "#f8fafc" },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={showId !== null}
        onClose={() => setShowId(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Hồ sơ người dùng chi tiết
          <IconButton
            onClick={() => setShowId(null)}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
          <Tabs value={showTab} onChange={(_, v) => setShowTab(v)}>
            <Tab label="Thông tin chung & Sức khỏe" sx={{ fontWeight: 600 }} />
            <Tab label="Nhật ký hoạt động (Logs)" sx={{ fontWeight: 600 }} />
          </Tabs>
        </Box>
        <DialogContent sx={{ minHeight: 400 }}>
          {showLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : showTab === 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 3,
                pt: 1,
              }}
            >
              <DetailItem label="ID" value={showItem?.id} />
              <DetailItem label="Email" value={showItem?.email} />
              <DetailItem label="Họ tên" value={showItem?.full_name} />
              <DetailItem
                label="Mục tiêu cốt lõi"
                value={
                  <Chip
                    label={getGoalLabel(showItem?.goal_type)}
                    size="small"
                    color="primary"
                  />
                }
              />
              <DetailItem
                label="Giới tính"
                value={getGenderLabel(showItem?.gender)}
              />
              <DetailItem
                label="Ngày sinh"
                value={formatDate(showItem?.date_of_birth)}
              />
              <DetailItem
                label="Trạng thái"
                value={
                  showItem?.is_banned ? (
                    <Typography color="error" fontWeight={700}>
                      Đang bị khóa
                    </Typography>
                  ) : (
                    <Typography color="success.main" fontWeight={700}>
                      Hoạt động
                    </Typography>
                  )
                }
              />
              <DetailItem
                label="Ngày tạo tài khoản"
                value={formatDate(showItem?.created_at, true)}
              />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <Divider>
                  <Chip label="Gamification & Health" size="small" />
                </Divider>
              </Box>

              <DetailItem
                label="XP hiện tại"
                value={`${safeNumber(
                  showItem?.current_xp,
                ).toLocaleString()} XP`}
              />
              <DetailItem
                label="Level hiện tại"
                value={`Level ${safeNumber(showItem?.current_level)}`}
              />
              <DetailItem
                label="Chuỗi Streak"
                value={`${safeNumber(showItem?.current_streak)} ngày`}
              />
              <DetailItem
                label="Chế độ ăn (Diet type)"
                value={showItem?.diet_type || "Bình thường"}
              />
              <DetailItem
                label="Calories mục tiêu"
                value={`${safeNumber(showItem?.target_calories)} kcal`}
              />
              <DetailItem
                label="Nước mục tiêu"
                value={`${safeNumber(showItem?.target_water_ml)} ml`}
              />
              <DetailItem
                label="Cân nặng mục tiêu"
                value={
                  showItem?.target_weight ? `${showItem.target_weight} kg` : "-"
                }
              />
              <DetailItem
                label="Món không thích"
                value={
                  Array.isArray(showItem?.disliked_foods)
                    ? showItem?.disliked_foods.join(", ")
                    : showItem?.disliked_foods
                }
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
              <Typography variant="h6">Lịch sử hoạt động</Typography>
              <Typography variant="body2">
                Tính năng đang được phát triển (Cần API lấy log tập luyện/ăn
                uống từ backend).
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editId !== null}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Cập nhật Hồ sơ & Vận hành
          <IconButton
            onClick={handleCloseEdit}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ fontWeight: 700 }}
              >
                1. THÔNG TIN CÁ NHÂN
              </Typography>
              <TextField
                label="Họ tên"
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, full_name: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Giới tính"
                  select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, gender: e.target.value }))
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">Chưa chọn</MenuItem>
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                </TextField>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      date_of_birth: e.target.value,
                    }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  size="small"
                />
              </Box>

              <Divider />
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ fontWeight: 700 }}
              >
                2. CHỈ SỐ SỨC KHỎE
              </Typography>

              <TextField
                label="Mục tiêu chính"
                select
                value={editForm.goal_type}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, goal_type: e.target.value }))
                }
                fullWidth
                size="small"
              >
                <MenuItem value="lose_weight">Giảm cân</MenuItem>
                <MenuItem value="build_muscle">Tăng cơ</MenuItem>
                <MenuItem value="stay_healthy">Duy trì sức khỏe</MenuItem>
              </TextField>

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Calories mục tiêu"
                  type="number"
                  value={editForm.target_calories}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      target_calories: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Nước mục tiêu (ml)"
                  type="number"
                  value={editForm.target_water_ml}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      target_water_ml: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                />
              </Box>

              <Divider />
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                3. GAMIFICATION <XpIcon fontSize="small" />
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Level"
                  type="number"
                  value={editForm.current_level}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      current_level: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                />
                <TextField
                  label="XP Hiện tại"
                  type="number"
                  value={editForm.current_xp}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, current_xp: e.target.value }))
                  }
                  fullWidth
                  size="small"
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  bgcolor: "#fffbeb",
                  border: "1px dashed #d97706",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#b45309", mb: 1 }}
                >
                  Quà tặng / Sự kiện (Tặng XP trực tiếp)
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Nhập số XP muốn tặng..."
                    type="number"
                    value={giftXpAmount}
                    onChange={(e) => setGiftXpAmount(Number(e.target.value))}
                    fullWidth
                    sx={{ bgcolor: "white" }}
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    disableElevation
                    onClick={handleGiveXP}
                    startIcon={<GiftIcon />}
                  >
                    Tặng
                  </Button>
                </Box>
              </Box>

              <Divider />
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ fontWeight: 700 }}
              >
                4. BẢO MẬT
              </Typography>
              <Button
                variant="outlined"
                color="info"
                startIcon={<KeyIcon />}
                onClick={() => alert("Đã gửi email Reset Password cho user!")}
                sx={{ width: "fit-content" }}
              >
                Gửi link Reset Password
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f8fafc" }}>
          <Button onClick={handleCloseEdit} disabled={saving} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={saving || editLoading}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
