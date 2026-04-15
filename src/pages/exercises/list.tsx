import React, { useState } from "react";
import { useDataGrid, DeleteButton } from "@refinedev/mui";
import { useOne, useUpdate, useCreate, useInvalidate } from "@refinedev/core";
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
} from "@mui/material";
import {
  Close as CloseIcon,
  EditOutlined as EditIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  VisibilityOutlined as VisibilityIcon,
  FitnessCenter as WorkoutIcon,
  Add as AddIcon,
  ModelTraining as AiIcon,
  Speed as DifficultyIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";

// --- TYPES ---
type ExerciseRow = {
  id: string | number;
  name?: string;
  ai_model_key?: string;
  goal_category?: string;
  difficulty?: string;
  met_value?: number | string;
  tracking_mode?: string;
  target_muscle?: string;
  thumbnail_url?: string;
  video_url?: string;
  target_reps?: number;
  target_sets?: number;
  estimated_duration?: string;
  instructions?: string;
  created_at?: string;
};

type ExerciseFormState = {
  name: string;
  ai_model_key: string;
  goal_category: string;
  difficulty: string;
  met_value: string;
  tracking_mode: string;
  target_muscle: string;
  thumbnail_url: string;
  video_url: string;
  target_reps: string;
  target_sets: string;
  estimated_duration: string;
  instructions: string;
};

// --- HELPERS ---
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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
      return goal || "Chưa rõ";
  }
};

const getDifficultyLabel = (diff?: string | null) => {
  switch ((diff || "").toLowerCase()) {
    case "beginner":
      return "Dễ";
    case "intermediate":
      return "Trung bình";
    case "advanced":
      return "Khó";
    default:
      return diff || "Chưa rõ";
  }
};

const getDifficultyColor = (diff?: string | null) => {
  switch ((diff || "").toLowerCase()) {
    case "beginner":
      return "success";
    case "intermediate":
      return "warning";
    case "advanced":
      return "error";
    default:
      return "default";
  }
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

const emptyForm: ExerciseFormState = {
  name: "",
  ai_model_key: "",
  goal_category: "",
  difficulty: "",
  met_value: "",
  tracking_mode: "reps",
  target_muscle: "",
  thumbnail_url: "",
  video_url: "",
  target_reps: "15",
  target_sets: "3",
  estimated_duration: "5-7",
  instructions: "",
};

// --- MAIN COMPONENT ---
export const ExercisesList: React.FC = () => {
  const { dataGridProps } = useDataGrid({
    resource: "exercises",
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

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");

  // Modal States
  const [showId, setShowId] = useState<string | number | null>(null);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<ExerciseFormState>(emptyForm);

  // Data Processing
  const allRows = React.useMemo(
    () =>
      Array.isArray(dataGridProps.rows)
        ? (dataGridProps.rows as ExerciseRow[])
        : [],
    [dataGridProps.rows],
  );

  const filteredRows = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchKeyword =
        !keyword ||
        [row?.name, row?.ai_model_key, row?.target_muscle]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchGoal =
        goalFilter === "all" ||
        String(row?.goal_category || "").toLowerCase() ===
          goalFilter.toLowerCase();
      const matchDiff =
        diffFilter === "all" ||
        String(row?.difficulty || "").toLowerCase() ===
          diffFilter.toLowerCase();
      return matchKeyword && matchGoal && matchDiff;
    });
  }, [allRows, searchText, goalFilter, diffFilter]);

  const stats = React.useMemo(() => {
    const total = allRows.length;
    const buildMuscle = allRows.filter(
      (r) => r.goal_category === "build_muscle",
    ).length;
    const loseWeight = allRows.filter(
      (r) => r.goal_category === "lose_weight",
    ).length;
    const advanced = allRows.filter((r) => r.difficulty === "advanced").length;
    return { total, buildMuscle, loseWeight, advanced };
  }, [allRows]);

  // Fetching Details for Show/Edit
  const showQuery = useOne<ExerciseRow>({
    resource: "exercises",
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

  const editQuery = useOne<ExerciseRow>({
    resource: "exercises",
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
        name: editItem.name ?? "",
        ai_model_key: editItem.ai_model_key ?? "",
        goal_category: editItem.goal_category ?? "",
        difficulty: editItem.difficulty ?? "",
        met_value: String(editItem.met_value ?? ""),
        tracking_mode: editItem.tracking_mode ?? "",
        target_muscle: editItem.target_muscle ?? "",
        thumbnail_url: editItem.thumbnail_url ?? "",
        video_url: editItem.video_url ?? "",
        target_reps: String(editItem.target_reps ?? ""),
        target_sets: String(editItem.target_sets ?? ""),
        estimated_duration: editItem.estimated_duration ?? "",
        instructions: editItem.instructions ?? "",
      });
    }
  }, [editItem]);

  // --- HANDLERS ---
  const handleResetFilters = () => {
    setSearchText("");
    setGoalFilter("all");
    setDiffFilter("all");
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Tên bài tập",
      "AI Key",
      "Mục tiêu",
      "Độ khó",
      "Cơ bắp",
      "Sets",
      "Reps",
      "MET",
      "Ngày tạo",
    ];
    const rows = filteredRows.map((row) => [
      row?.id ?? "",
      row?.name ?? "",
      row?.ai_model_key ?? "",
      getGoalLabel(row?.goal_category),
      getDifficultyLabel(row?.difficulty),
      row?.target_muscle ?? "",
      row?.target_sets ?? 0,
      row?.target_reps ?? 0,
      row?.met_value ?? 0,
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
    link.setAttribute("download", "healix-exercises.csv");
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
      name: formData.name,
      ai_model_key: formData.ai_model_key,
      goal_category: formData.goal_category || null,
      difficulty: formData.difficulty || null,
      met_value: Number(formData.met_value || 0),
      tracking_mode: formData.tracking_mode,
      target_muscle: formData.target_muscle,
      thumbnail_url: formData.thumbnail_url,
      video_url: formData.video_url,
      target_reps: Number(formData.target_reps || 0),
      target_sets: Number(formData.target_sets || 0),
      estimated_duration: formData.estimated_duration,
      instructions: formData.instructions,
    };

    if (editId !== null) {
      updateMutation.mutate(
        { resource: "exercises", id: editId, values: payload },
        {
          onSuccess: () => {
            invalidate({
              resource: "exercises",
              invalidates: ["list", "detail"],
            });
            handleCloseForm();
            alert("Cập nhật thành công!");
          },
        },
      );
    } else {
      createMutation.mutate(
        { resource: "exercises", values: payload },
        {
          onSuccess: () => {
            invalidate({ resource: "exercises", invalidates: ["list"] });
            handleCloseForm();
            alert("Thêm bài tập mới thành công!");
          },
        },
      );
    }
  };

  // --- DATA GRID COLUMNS ---
  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "info",
        headerName: "Bài tập",
        minWidth: 280,
        flex: 1.5,
        sortable: false,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              height: "100%",
              py: 1.5,
              minWidth: 0,
            }}
          >
            <Avatar
              variant="rounded"
              src={row.thumbnail_url || undefined}
              sx={{
                width: 56,
                height: 56,
                bgcolor: "#e2e8f0",
                color: "#64748b",
              }}
            >
              <WorkoutIcon />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, noWrap: true, color: "#111827" }}
              >
                {row.name || "Chưa có tên"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", noWrap: true, color: "#64748b" }}
              >
                Cơ mục tiêu:{" "}
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  {row.target_muscle || "Toàn thân"}
                </span>
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        field: "ai_model",
        headerName: "Mô hình AI",
        width: 140,
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
            <Tooltip title="AI Model Key dùng để nhận diện">
              <Chip
                icon={<AiIcon fontSize="small" />}
                label={row.ai_model_key || "-"}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  color: "#4f46e5",
                  borderColor: "#c7d2fe",
                }}
              />
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "goal_category",
        headerName: "Mục tiêu",
        width: 140,
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
              label={getGoalLabel(row.goal_category)}
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
        field: "difficulty",
        headerName: "Độ khó",
        width: 120,
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
              label={getDifficultyLabel(row.difficulty)}
              color={getDifficultyColor(row.difficulty) as any}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        ),
      },
      {
        field: "targets",
        headerName: "Sets x Reps",
        width: 120,
        sortable: false,
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
              sx={{ fontWeight: 800, color: "#ea580c" }}
            >
              {safeNumber(row.target_sets)}{" "}
              <span style={{ color: "#94a3b8" }}>x</span>{" "}
              {safeNumber(row.target_reps)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.estimated_duration || "-"} phút
            </Typography>
          </Box>
        ),
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
            <Tooltip title="Sửa bài tập">
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
            Quản lý Bài tập (Exercises)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản trị kho bài tập, gán thẻ AI Model và thiết lập chỉ số fitness.
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
          Thêm bài tập
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
          title="Tổng số Bài tập"
          value={stats.total}
          color="#2563eb"
          icon={<WorkoutIcon />}
        />
        <StatCard
          title="Bài tập Tăng cơ"
          value={stats.buildMuscle}
          color="#ea580c"
          icon={<CategoryIcon />}
        />
        <StatCard
          title="Bài tập Giảm cân"
          value={stats.loseWeight}
          color="#16a34a"
          icon={<CategoryIcon />}
        />
        <StatCard
          title="Bài tập Khó (Advanced)"
          value={stats.advanced}
          color="#ef4444"
          icon={<DifficultyIcon />}
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
                  Kho dữ liệu
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                <TextField
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tên, mã AI, Cơ bắp..."
                  size="small"
                  sx={{ width: 220 }}
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
                  label="Độ khó"
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="beginner">Dễ (Beginner)</MenuItem>
                  <MenuItem value="intermediate">Vừa (Intermediate)</MenuItem>
                  <MenuItem value="advanced">Khó (Advanced)</MenuItem>
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
          Chi tiết bài tập
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
                  src={showItem?.thumbnail_url || undefined}
                  sx={{ width: 80, height: 80, bgcolor: "#e2e8f0" }}
                >
                  <WorkoutIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    {showItem?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mã AI: <b>{showItem?.ai_model_key || "Chưa gán"}</b>
                  </Typography>
                </Box>
              </Box>
              <DetailItem
                label="Mục tiêu"
                value={
                  <Chip
                    label={getGoalLabel(showItem?.goal_category)}
                    size="small"
                  />
                }
              />
              <DetailItem
                label="Độ khó"
                value={
                  <Chip
                    label={getDifficultyLabel(showItem?.difficulty)}
                    color={getDifficultyColor(showItem?.difficulty) as any}
                    size="small"
                  />
                }
              />
              <DetailItem
                label="Cơ bắp mục tiêu"
                value={showItem?.target_muscle}
              />
              <DetailItem
                label="Chế độ theo dõi (Tracking)"
                value={showItem?.tracking_mode}
              />
              <DetailItem label="Chỉ số MET" value={showItem?.met_value} />
              <DetailItem
                label="Thời gian ước tính"
                value={`${showItem?.estimated_duration || 0} phút`}
              />
              <DetailItem
                label="Mục tiêu Set x Reps"
                value={`${showItem?.target_sets} Sets x ${showItem?.target_reps} Reps`}
              />
              <DetailItem
                label="Ngày tạo"
                value={formatDate(showItem?.created_at)}
              />
              <DetailItem
                fullWidth
                label="Hướng dẫn thực hiện"
                value={showItem?.instructions || "Chưa có hướng dẫn cụ thể."}
              />
              <DetailItem
                fullWidth
                label="Video URL"
                value={
                  showItem?.video_url ? (
                    <a
                      href={showItem.video_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {showItem.video_url}
                    </a>
                  ) : (
                    "Chưa có video"
                  )
                }
              />
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
          {isCreateOpen ? "Thêm bài tập mới" : "Chỉnh sửa bài tập"}
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
                  1. THÔNG TIN CƠ BẢN
                </Typography>
              </Box>
              <TextField
                label="Tên bài tập"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label="Mã nhận diện AI (ai_model_key)"
                required
                value={formData.ai_model_key}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, ai_model_key: e.target.value }))
                }
                fullWidth
                size="small"
                helperText="Vd: push_up, squat"
              />

              <TextField
                label="Mục tiêu"
                select
                value={formData.goal_category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, goal_category: e.target.value }))
                }
                fullWidth
                size="small"
              >
                <MenuItem value="lose_weight">Giảm cân</MenuItem>
                <MenuItem value="build_muscle">Tăng cơ</MenuItem>
                <MenuItem value="stay_healthy">Duy trì sức khỏe</MenuItem>
              </TextField>
              <TextField
                label="Độ khó"
                select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, difficulty: e.target.value }))
                }
                fullWidth
                size="small"
              >
                <MenuItem value="beginner">Dễ</MenuItem>
                <MenuItem value="intermediate">Trung bình</MenuItem>
                <MenuItem value="advanced">Khó</MenuItem>
              </TextField>

              <TextField
                label="Cơ bắp mục tiêu"
                value={formData.target_muscle}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, target_muscle: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label="Chỉ số MET (Tiêu hao Calo)"
                type="number"
                value={formData.met_value}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, met_value: e.target.value }))
                }
                fullWidth
                size="small"
              />

              <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  2. CHỈ SỐ TẬP LUYỆN
                </Typography>
              </Box>
              <TextField
                label="Tracking Mode"
                select
                value={formData.tracking_mode}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, tracking_mode: e.target.value }))
                }
                fullWidth
                size="small"
              >
                <MenuItem value="reps">Đếm số Reps</MenuItem>
                <MenuItem value="duration">Tính thời gian</MenuItem>
                <MenuItem value="pose_hold">Giữ tư thế</MenuItem>
              </TextField>
              <TextField
                label="Thời gian ước tính (phút)"
                value={formData.estimated_duration}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    estimated_duration: e.target.value,
                  }))
                }
                fullWidth
                size="small"
                helperText="Vd: 5-7"
              />
              <TextField
                label="Target Sets"
                type="number"
                value={formData.target_sets}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, target_sets: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label="Target Reps"
                type="number"
                value={formData.target_reps}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, target_reps: e.target.value }))
                }
                fullWidth
                size="small"
              />

              <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  3. MEDIA & HƯỚNG DẪN
                </Typography>
              </Box>
              <TextField
                label="URL Ảnh Thumbnail"
                value={formData.thumbnail_url}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, thumbnail_url: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label="URL Video hướng dẫn"
                value={formData.video_url}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, video_url: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <Box sx={{ gridColumn: "1 / -1" }}>
                <TextField
                  label="Hướng dẫn tập luyện"
                  multiline
                  rows={4}
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, instructions: e.target.value }))
                  }
                  fullWidth
                  size="small"
                />
              </Box>
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
            {isSaving ? "Đang lưu..." : "Lưu bài tập"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
