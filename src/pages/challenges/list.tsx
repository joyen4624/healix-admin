import React, { useState } from "react";
import { useDataGrid, DeleteButton } from "@refinedev/mui";
import {
  useOne,
  useUpdate,
  useCreate,
  useInvalidate,
  useSelect,
} from "@refinedev/core";
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
  TextField,
  Tooltip,
  Typography,
  Select,
  OutlinedInput,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
} from "@mui/material";
import {
  Close as CloseIcon,
  EditOutlined as EditIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  VisibilityOutlined as VisibilityIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  MilitaryTech as BadgeIcon,
  DateRange as DateIcon,
  Timer as DurationIcon,
  DirectionsRun as ExerciseIcon,
} from "@mui/icons-material";

// --- TYPES ---
type ChallengeRow = {
  id: string | number;
  title?: string;
  description?: string;
  image_url?: string;
  reward_xp?: number;
  reward_badge?: string;
  target_value?: number;
  metric_type?: string;
  duration_days?: number;
  end_date?: string;
  required_exercise_id?: string | number;
  required_exercise_name?: string;
  valid_days_of_week?: number[];
  created_at?: string;
};

type ChallengeFormState = {
  title: string;
  description: string;
  image_url: string;
  reward_xp: string;
  reward_badge: string;
  target_value: string;
  metric_type: string;
  duration_days: string;
  end_date: string;
  required_exercise_id: string;
  valid_days_of_week: number[];
};

// --- HELPERS ---
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
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

const getMetricLabel = (metric?: string | null) => {
  switch ((metric || "").toLowerCase()) {
    case "calories":
      return "Calories";
    case "workouts":
      return "Số buổi tập";
    case "duration":
      return "Thời gian (phút)";
    case "reps":
      return "Số Reps";
    case "distance":
      return "Khoảng cách (km)";
    default:
      return metric || "Không rõ";
  }
};

const DAYS_OF_WEEK = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ Nhật" },
];

const getDaysString = (days?: number[] | null) => {
  if (!days || !Array.isArray(days) || days.length === 0) return "Mọi ngày";
  if (days.length === 7) return "Cả tuần";
  return days
    .map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label)
    .join(", ");
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
  fullWidth = false,
}: {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) => (
  <Box sx={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{
        fontWeight: 600,
        mt: 0.5,
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const emptyForm: ChallengeFormState = {
  title: "",
  description: "",
  image_url: "",
  reward_xp: "100",
  reward_badge: "",
  target_value: "1",
  metric_type: "workouts",
  duration_days: "",
  end_date: "",
  required_exercise_id: "",
  valid_days_of_week: [],
};

// --- MAIN COMPONENT ---
export const ChallengesList: React.FC = () => {
  const { dataGridProps } = useDataGrid({
    resource: "challenges",
    pagination: { mode: "server", currentPage: 1, pageSize: 20 },
  });

  const invalidate = useInvalidate();

  // API Hooks
  const updateMutation = useUpdate();
  const createMutation = useCreate();
  const isSaving =
    (updateMutation as any).isPending ||
    (updateMutation as any).isLoading ||
    (createMutation as any).isPending ||
    (createMutation as any).isLoading ||
    false;

  // Lấy danh sách Exercises để làm Dropdown chọn Required Exercise
  const { options: exerciseOptions } = useSelect({
    resource: "exercises",
    optionLabel: "name",
    optionValue: "id",
  });

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [metricFilter, setMetricFilter] = useState("all");

  // Modal States
  const [showId, setShowId] = useState<string | number | null>(null);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<ChallengeFormState>(emptyForm);

  // Data Processing
  const allRows = React.useMemo(
    () =>
      Array.isArray(dataGridProps.rows)
        ? (dataGridProps.rows as ChallengeRow[])
        : [],
    [dataGridProps.rows],
  );

  const filteredRows = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchKeyword =
        !keyword ||
        [row?.title, row?.description, row?.required_exercise_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchMetric =
        metricFilter === "all" ||
        String(row?.metric_type || "").toLowerCase() ===
          metricFilter.toLowerCase();
      return matchKeyword && matchMetric;
    });
  }, [allRows, searchText, metricFilter]);

  const stats = React.useMemo(() => {
    const total = allRows.length;
    const totalXpRewards = allRows.reduce(
      (sum, row) => sum + safeNumber(row.reward_xp),
      0,
    );
    const withBadges = allRows.filter((r) => r.reward_badge).length;

    const now = new Date();
    const activeLimited = allRows.filter(
      (r) => r.end_date && new Date(r.end_date) >= now,
    ).length;

    return { total, totalXpRewards, withBadges, activeLimited };
  }, [allRows]);

  // Fetching Details for Show/Edit
  const showQuery = useOne<ChallengeRow>({
    resource: "challenges",
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

  const editQuery = useOne<ChallengeRow>({
    resource: "challenges",
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
      setFormData({
        title: editItem.title ?? "",
        description: editItem.description ?? "",
        image_url: editItem.image_url ?? "",
        reward_xp: String(editItem.reward_xp ?? "0"),
        reward_badge: editItem.reward_badge ?? "",
        target_value: String(editItem.target_value ?? "0"),
        metric_type: editItem.metric_type ?? "workouts",
        duration_days: editItem.duration_days
          ? String(editItem.duration_days)
          : "",
        end_date: formatDateInput(editItem.end_date),
        required_exercise_id: editItem.required_exercise_id
          ? String(editItem.required_exercise_id)
          : "",
        valid_days_of_week: Array.isArray(editItem.valid_days_of_week)
          ? editItem.valid_days_of_week
          : [],
      });
    }
  }, [editItem]);

  // --- HANDLERS ---
  const handleResetFilters = () => {
    setSearchText("");
    setMetricFilter("all");
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Tên thử thách",
      "Phần thưởng XP",
      "Huy hiệu",
      "Mục tiêu",
      "Hành động yêu cầu",
      "Hạn chót",
      "Ngày tạo",
    ];
    const rows = filteredRows.map((row) => [
      row?.id ?? "",
      row?.title ?? "",
      row?.reward_xp ?? 0,
      row?.reward_badge ?? "Không",
      `${row?.target_value} ${getMetricLabel(row?.metric_type)}`,
      row?.required_exercise_name || "Tự do",
      formatDate(row?.end_date),
      formatDate(row?.created_at),
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
    link.setAttribute("download", "healix-challenges.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseForm = () => {
    setEditId(null);
    setIsCreateOpen(false);
    setFormData(emptyForm);
  };

  const handleSaveForm = () => {
    const payload = {
      title: formData.title,
      description: formData.description,
      image_url: formData.image_url || null,
      reward_xp: Number(formData.reward_xp || 0),
      reward_badge: formData.reward_badge || null,
      target_value: Number(formData.target_value || 0),
      metric_type: formData.metric_type,
      duration_days: formData.duration_days
        ? Number(formData.duration_days)
        : null,
      end_date: formData.end_date || null,
      required_exercise_id: formData.required_exercise_id || null,
      valid_days_of_week:
        formData.valid_days_of_week.length > 0
          ? formData.valid_days_of_week
          : null,
    };

    if (editId !== null) {
      updateMutation.mutate(
        { resource: "challenges", id: editId, values: payload },
        {
          onSuccess: () => {
            invalidate({
              resource: "challenges",
              invalidates: ["list", "detail"],
            });
            handleCloseForm();
            alert("Cập nhật thành công!");
          },
        },
      );
    } else {
      createMutation.mutate(
        { resource: "challenges", values: payload },
        {
          onSuccess: () => {
            invalidate({ resource: "challenges", invalidates: ["list"] });
            handleCloseForm();
            alert("Tạo thử thách mới thành công!");
          },
        },
      );
    }
  };

  const handleDaysChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setFormData((prev) => ({
      ...prev,
      valid_days_of_week:
        typeof value === "string" ? value.split(",").map(Number) : value,
    }));
  };

  // --- DATA GRID COLUMNS ---
  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "info",
        headerName: "Thử thách",
        minWidth: 280,
        flex: 1.5,
        sortable: false,
        renderCell: ({ row }) => {
          const isExpired = row.end_date && new Date(row.end_date) < new Date();
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                height: "100%",
                py: 1.5,
                minWidth: 0,
                opacity: isExpired ? 0.6 : 1,
              }}
            >
              <Avatar
                variant="rounded"
                src={row.image_url || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "#f1f5f9",
                  color: "#64748b",
                }}
              >
                <TrophyIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, noWrap: true, color: "#111827" }}
                >
                  {row.title || "Chưa có tên"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", noWrap: true, color: "#64748b" }}
                >
                  Yêu cầu:{" "}
                  <span style={{ fontWeight: 600, color: "#0284c7" }}>
                    {row.required_exercise_name || "Mọi bài tập"}
                  </span>
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "target",
        headerName: "Mục tiêu cần đạt",
        width: 150,
        align: "center",
        headerAlign: "center",
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
              sx={{ fontWeight: 800, color: "#0f172a" }}
            >
              {safeNumber(row.target_value)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getMetricLabel(row.metric_type)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "rewards",
        headerName: "Phần thưởng",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 800, color: "#d97706" }}
              >
                +{safeNumber(row.reward_xp)} XP
              </Typography>
            </Box>
            {row.reward_badge && (
              <Chip
                icon={<BadgeIcon fontSize="small" />}
                label={row.reward_badge}
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: "#fef3c7",
                  color: "#b45309",
                  fontWeight: 700,
                  height: 20,
                  "& .MuiChip-label": { px: 1, py: 0 },
                }}
              />
            )}
          </Box>
        ),
      },
      {
        field: "duration",
        headerName: "Thời hạn",
        width: 150,
        renderCell: ({ row }) => {
          const isExpired = row.end_date && new Date(row.end_date) < new Date();
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
              {row.duration_days ? (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <DurationIcon fontSize="small" /> {row.duration_days} Ngày
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#64748b" }}
                >
                  Vô thời hạn
                </Typography>
              )}

              {row.end_date && (
                <Typography
                  variant="caption"
                  sx={{
                    color: isExpired ? "error.main" : "text.secondary",
                    fontWeight: isExpired ? 700 : 500,
                    mt: 0.5,
                  }}
                >
                  {isExpired
                    ? `Hết hạn: ${formatDate(row.end_date)}`
                    : `Đến: ${formatDate(row.end_date)}`}
                </Typography>
              )}
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
            <Tooltip title="Sửa thử thách">
              <IconButton
                size="small"
                sx={{ color: "#7c3aed" }}
                onClick={() => setEditId(row.id)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <DeleteButton hideText size="small" recordItemId={row.id} />
          </Box>
        ),
      },
    ],
    [],
  );

  // --- RENDER ---
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
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
            Quản lý Thử thách (Challenges)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Khởi tạo sự kiện, thiết lập mục tiêu và phần thưởng gamification.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateOpen(true)}
          sx={{
            height: 48,
            px: 3,
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: "#10b981",
            "&:hover": { bgcolor: "#059669" },
          }}
        >
          Tạo Thử thách
        </Button>
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
          title="Tổng Thử thách"
          value={stats.total}
          color="#2563eb"
          icon={<TrophyIcon />}
        />
        <StatCard
          title="Tổng phần thưởng XP"
          value={stats.totalXpRewards.toLocaleString()}
          color="#d97706"
          icon={<BadgeIcon />}
        />
        <StatCard
          title="Có phần thưởng Huy hiệu"
          value={stats.withBadges}
          color="#7c3aed"
          icon={<BadgeIcon />}
        />
        <StatCard
          title="Sự kiện đang Active"
          value={stats.activeLimited}
          color="#16a34a"
          icon={<DateIcon />}
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
                  Kho sự kiện & Thử thách
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                <TextField
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tên, Mô tả..."
                  size="small"
                  sx={{ width: 220 }}
                />
                <TextField
                  select
                  size="small"
                  label="Đơn vị tính"
                  value={metricFilter}
                  onChange={(e) => setMetricFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="workouts">Số buổi tập</MenuItem>
                  <MenuItem value="calories">Calories</MenuItem>
                  <MenuItem value="duration">Thời gian</MenuItem>
                  <MenuItem value="reps">Số Reps</MenuItem>
                </TextField>
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
                  sx={{ fontWeight: 600, bgcolor: "#2563eb" }}
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

      {/* MODAL SHOW */}
      <Dialog
        open={showId !== null}
        onClose={() => setShowId(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Chi tiết Thử thách
          <IconButton
            onClick={() => setShowId(null)}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 400 }}>
          {showLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Avatar
                  variant="rounded"
                  src={showItem?.image_url || undefined}
                  sx={{ width: 80, height: 80, bgcolor: "#e2e8f0" }}
                >
                  <TrophyIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    {showItem?.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Yêu cầu:{" "}
                    <b>
                      {showItem?.required_exercise_name || "Bất kỳ bài tập nào"}
                    </b>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ gridColumn: "1 / -1" }}>
                <Divider>
                  <Chip label="Yêu cầu & Mục tiêu" size="small" />
                </Divider>
              </Box>
              <DetailItem
                label="Mục tiêu cần đạt"
                value={`${safeNumber(showItem?.target_value)} ${getMetricLabel(
                  showItem?.metric_type,
                )}`}
              />
              <DetailItem
                label="Thời hạn từ khi tham gia"
                value={
                  showItem?.duration_days
                    ? `${showItem.duration_days} ngày`
                    : "Không giới hạn"
                }
              />
              <DetailItem
                label="Hạn chót của Event"
                value={formatDate(showItem?.end_date)}
              />
              <DetailItem
                label="Ngày hợp lệ trong tuần"
                value={getDaysString(showItem?.valid_days_of_week)}
              />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <Divider>
                  <Chip label="Phần thưởng Gamification" size="small" />
                </Divider>
              </Box>
              <DetailItem
                label="Thưởng XP"
                value={
                  <Typography color="#d97706" fontWeight={800}>
                    +{safeNumber(showItem?.reward_xp)} XP
                  </Typography>
                }
              />
              <DetailItem
                label="Thưởng Huy hiệu (Badge)"
                value={showItem?.reward_badge || "Không có"}
              />

              <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
                <DetailItem
                  fullWidth
                  label="Mô tả chi tiết"
                  value={showItem?.description || "Chưa có mô tả."}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL EDIT / CREATE */}
      <Dialog
        open={editId !== null || isCreateOpen}
        onClose={handleCloseForm}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          {isCreateOpen ? "Tạo Thử thách mới" : "Chỉnh sửa Thử thách"}
          <IconButton
            onClick={handleCloseForm}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editLoading && editId !== null ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2.5,
              }}
            >
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  1. THÔNG TIN CHUNG
                </Typography>
              </Box>
              <TextField
                label="Tên thử thách"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label="URL Ảnh Cover"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, image_url: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  label="Mô tả thử thách"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  fullWidth
                  size="small"
                />
              </Box>

              <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  2. YÊU CẦU & MỤC TIÊU
                </Typography>
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel>
                  Bài tập bắt buộc (Bỏ trống = Mọi bài tập)
                </InputLabel>
                <Select
                  value={formData.required_exercise_id}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      required_exercise_id: e.target.value,
                    }))
                  }
                  input={
                    <OutlinedInput label="Bài tập bắt buộc (Bỏ trống = Mọi bài tập)" />
                  }
                >
                  <MenuItem value="">
                    <em>-- Mọi bài tập --</em>
                  </MenuItem>
                  {exerciseOptions?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Đơn vị đo lường (Metric)"
                select
                value={formData.metric_type}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, metric_type: e.target.value }))
                }
                fullWidth
                size="small"
              >
                <MenuItem value="workouts">Số buổi tập</MenuItem>
                <MenuItem value="calories">Tiêu hao Calories</MenuItem>
                <MenuItem value="duration">Thời gian (Phút)</MenuItem>
                <MenuItem value="reps">Số Reps</MenuItem>
                <MenuItem value="distance">Khoảng cách (Km)</MenuItem>
              </TextField>

              <TextField
                label="Mục tiêu cần đạt (Target)"
                required
                type="number"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, target_value: e.target.value }))
                }
                fullWidth
                size="small"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Ngày hợp lệ trong tuần</InputLabel>
                <Select
                  multiple
                  value={formData.valid_days_of_week}
                  onChange={handleDaysChange}
                  input={<OutlinedInput label="Ngày hợp lệ trong tuần" />}
                  renderValue={(selected) =>
                    getDaysString(selected as number[])
                  }
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      <Checkbox
                        checked={
                          formData.valid_days_of_week.indexOf(day.value) > -1
                        }
                      />
                      <ListItemText primary={day.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  3. THỜI GIAN & PHẦN THƯỞNG
                </Typography>
              </Box>

              <TextField
                label="Hạn hoàn thành (Số ngày)"
                type="number"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, duration_days: e.target.value }))
                }
                fullWidth
                size="small"
                helperText="Số ngày tối đa từ lúc bấm Tham gia"
              />
              <TextField
                label="Ngày kết thúc Event"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, end_date: e.target.value }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                size="small"
                helperText="Sau ngày này sẽ không ai tham gia được nữa"
              />

              <TextField
                label="Phần thưởng XP"
                type="number"
                required
                value={formData.reward_xp}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, reward_xp: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label="Phần thưởng Huy hiệu (Tên/Mã)"
                value={formData.reward_badge}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, reward_badge: e.target.value }))
                }
                fullWidth
                size="small"
                helperText="VD: BADGE_SQUAT_MASTER"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f8fafc" }}>
          <Button onClick={handleCloseForm} disabled={isSaving} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveForm}
            disabled={isSaving || editLoading}
          >
            {isSaving
              ? "Đang lưu..."
              : isCreateOpen
              ? "Tạo Thử thách"
              : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
