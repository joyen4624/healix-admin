import React from "react";
import { useDataGrid, DeleteButton } from "@refinedev/mui";
import { useUpdate, useInvalidate } from "@refinedev/core";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Chip,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as ProgressIcon,
  PendingActions as PendingIcon,
  VisibilityOutlined as VisibilityIcon,
  EditOutlined as EditIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

type StatusColor = "default" | "success" | "warning" | "error" | "info";

type UserChallengeRow = {
  id: number | string;
  email?: string;
  full_name?: string;
  challenge_title?: string;
  status?: string;
  current_value?: number | string;
  target_value?: number | string;
  metric_type?: string;
  joined_at?: string | null;
  deadline_at?: string | null;
  completed_at?: string | null;
};

type EditFormState = {
  status: string;
  current_value: string;
  deadline_at: string;
  completed_at: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const formatDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getStatusLabel = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "Hoàn thành";
    case "active":
      return "Đang hoạt động";
    case "in_progress":
      return "Đang thực hiện";
    case "pending":
      return "Chờ xử lý";
    case "failed":
      return "Thất bại";
    case "cancelled":
      return "Đã hủy";
    case "claimed":
      return "Đã nhận";
    default:
      return status || "Không xác định";
  }
};

const getStatusColor = (status?: string): StatusColor => {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "claimed":
      return "success";
    case "active":
    case "in_progress":
      return "info";
    case "pending":
      return "warning";
    case "failed":
    case "cancelled":
      return "error";
    default:
      return "default";
  }
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

const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const StatCard = ({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 2.5,
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      height: "100%",
    }}
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
            sx={{ fontSize: 13, mb: 0.5, fontWeight: 500 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: 28 }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: color,
            color: "#fff",
            flexShrink: 0,
            "& svg": {
              fontSize: 20,
            },
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
    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
      {value || "-"}
    </Typography>
  </Box>
);

export const UserChallengesList: React.FC = () => {
  const { dataGridProps } = useDataGrid({
    resource: "user-challenges",
    pagination: {
      mode: "server",
      currentPage: 1,
      pageSize: 10,
    },
  });

  const invalidate = useInvalidate();
  const { mutate: updateChallenge, isLoading: saving } = useUpdate();

  const [searchText, setSearchText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [showItem, setShowItem] = React.useState<UserChallengeRow | null>(null);
  const [editItem, setEditItem] = React.useState<UserChallengeRow | null>(null);

  const [editForm, setEditForm] = React.useState<EditFormState>({
    status: "",
    current_value: "",
    deadline_at: "",
    completed_at: "",
  });

  const allRows = React.useMemo(() => {
    return Array.isArray(dataGridProps.rows)
      ? (dataGridProps.rows as UserChallengeRow[])
      : [];
  }, [dataGridProps.rows]);

  const filteredRows = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return allRows.filter((row) => {
      const matchKeyword =
        !keyword ||
        [
          row?.email,
          row?.full_name,
          row?.challenge_title,
          row?.metric_type,
          row?.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchStatus =
        statusFilter === "all" ||
        String(row?.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchKeyword && matchStatus;
    });
  }, [allRows, searchText, statusFilter]);

  const stats = React.useMemo(() => {
    return {
      total: allRows.length,
      completed: allRows.filter((item) =>
        ["completed", "claimed"].includes(
          String(item?.status || "").toLowerCase(),
        ),
      ).length,
      inProgress: allRows.filter((item) =>
        ["active", "in_progress"].includes(
          String(item?.status || "").toLowerCase(),
        ),
      ).length,
      pending: allRows.filter(
        (item) => String(item?.status || "").toLowerCase() === "pending",
      ).length,
    };
  }, [allRows]);

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Email",
      "Họ tên",
      "Thử thách",
      "Trạng thái",
      "Tiến độ hiện tại",
      "Mục tiêu",
      "Đơn vị",
      "Ngày tham gia",
      "Hạn chót",
    ];

    const rows = filteredRows.map((row) => [
      row?.id ?? "",
      row?.email ?? "",
      row?.full_name ?? "",
      row?.challenge_title ?? "",
      getStatusLabel(row?.status),
      row?.current_value ?? 0,
      row?.target_value ?? 0,
      row?.metric_type ?? "",
      formatDate(row?.joined_at),
      formatDate(row?.deadline_at),
    ]);

    const csvContent = [headers, ...rows]
      .map((line) =>
        line
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "user-challenges.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenShow = (row: UserChallengeRow) => {
    setShowItem(row);
  };

  const handleOpenEdit = (row: UserChallengeRow) => {
    setEditItem(row);
    setEditForm({
      status: String(row.status ?? ""),
      current_value: String(row.current_value ?? ""),
      deadline_at: formatDateTimeLocal(row.deadline_at),
      completed_at: formatDateTimeLocal(row.completed_at),
    });
  };

  const handleCloseShow = () => {
    setShowItem(null);
  };

  const handleCloseEdit = () => {
    setEditItem(null);
    setEditForm({
      status: "",
      current_value: "",
      deadline_at: "",
      completed_at: "",
    });
  };

  const handleSaveEdit = () => {
    if (!editItem?.id) return;

    updateChallenge(
      {
        resource: "user-challenges",
        id: editItem.id,
        values: {
          status: editForm.status,
          current_value: Number(editForm.current_value || 0),
          deadline_at: editForm.deadline_at || null,
          completed_at: editForm.completed_at || null,
        },
      },
      {
        onSuccess: async () => {
          await invalidate({
            resource: "user-challenges",
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
        width: 220,
        sortable: false,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 2,
              minWidth: 0,
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                fontSize: 14,
                fontWeight: 700,
                bgcolor: "#2563eb",
              }}
            >
              {getInitials(row.full_name)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#111827",
                }}
              >
                {row.full_name || "Chưa cập nhật"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#2563eb",
                }}
              >
                {row.email || "-"}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        field: "challenge_title",
        headerName: "Thử thách",
        flex: 1,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Box sx={{ py: 2, minWidth: 0, whiteSpace: "normal" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "#111827",
                lineHeight: 1.4,
              }}
            >
              {row.challenge_title || "-"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "inline-block" }}
            >
              {row.metric_type || "-"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "status",
        headerName: "Trạng thái",
        width: 140,
        renderCell: ({ row }) => (
          <Chip
            label={getStatusLabel(row.status)}
            color={getStatusColor(row.status)}
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: 1.5,
              maxWidth: "100%",
              px: 0.5,
            }}
          />
        ),
      },
      {
        field: "progress",
        headerName: "Tiến độ",
        width: 180,
        sortable: false,
        renderCell: ({ row }) => {
          const current = safeNumber(row.current_value);
          const target = safeNumber(row.target_value);
          const percent =
            target > 0 ? Math.min((current / target) * 100, 100) : 0;

          return (
            <Box sx={{ width: "100%", py: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.75,
                  gap: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "#111827" }}
                >
                  {current}/{target}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {percent.toFixed(0)}%
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  bgcolor: "#e2e8f0",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor: percent === 100 ? "#16a34a" : "#2563eb",
                  },
                }}
              />
            </Box>
          );
        },
      },
      {
        field: "deadline_at",
        headerName: "Hạn chót",
        width: 110,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatDate(row.deadline_at)}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Thao tác",
        sortable: false,
        filterable: false,
        width: 160,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box
            sx={{ display: "flex", gap: 0.5, justifyContent: "center", py: 2 }}
          >
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenShow(row)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="secondary"
              onClick={() => handleOpenEdit(row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <DeleteButton hideText size="small" recordItemId={row.id} />
          </Box>
        ),
      },
    ],
    [],
  );

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
          Thử thách của người dùng
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Theo dõi tiến độ, trạng thái hoàn thành và thao tác nhanh trên từng
          bản ghi.
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
          title="Tổng tham gia"
          value={stats.total}
          color="#2563eb"
          icon={<TrophyIcon fontSize="small" />}
        />
        <StatCard
          title="Hoàn thành"
          value={stats.completed}
          color="#16a34a"
          icon={<CheckCircleIcon fontSize="small" />}
        />
        <StatCard
          title="Đang thực hiện"
          value={stats.inProgress}
          color="#0ea5e9"
          icon={<ProgressIcon fontSize="small" />}
        />
        <StatCard
          title="Chờ xử lý"
          value={stats.pending}
          color="#d97706"
          icon={<PendingIcon fontSize="small" />}
        />
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
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
                flexDirection: { xs: "column", lg: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", lg: "center" },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#0f172a" }}
                >
                  Danh sách tham gia thử thách
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tìm kiếm, lọc trạng thái và xuất nhanh dữ liệu.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 1.5,
                  width: { xs: "100%", lg: "auto" },
                }}
              >
                <TextField
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo email, tên, thử thách..."
                  size="small"
                  sx={{ minWidth: { xs: "100%", md: 300 } }}
                />

                <TextField
                  select
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">Tất cả trạng thái</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="claimed">Đã nhận</MenuItem>
                  <MenuItem value="active">Đang hoạt động</MenuItem>
                  <MenuItem value="in_progress">Đang thực hiện</MenuItem>
                  <MenuItem value="pending">Chờ xử lý</MenuItem>
                  <MenuItem value="failed">Thất bại</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </TextField>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleResetFilters}
                  sx={{ fontWeight: 600, px: 2 }}
                >
                  XÓA LỌC
                </Button>

                <Button
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportCSV}
                  sx={{
                    fontWeight: 600,
                    px: 3,
                    bgcolor: "#2563eb",
                    "&:hover": { bgcolor: "#1d4ed8" },
                  }}
                >
                  XUẤT CSV
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
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 700,
                  color: "#0f172a",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  outline: "none !important",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f8fafc",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                },
                "& .MuiDataGrid-virtualScroller": {
                  overflowX: "auto",
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={!!showItem}
        onClose={handleCloseShow}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6 }}>
          Chi tiết tham gia thử thách
          <IconButton
            onClick={handleCloseShow}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <DetailItem label="ID" value={showItem?.id} />
            <DetailItem
              label="Trạng thái"
              value={
                <Chip
                  label={getStatusLabel(showItem?.status)}
                  color={getStatusColor(showItem?.status)}
                  size="small"
                />
              }
            />
            <DetailItem label="Email" value={showItem?.email} />
            <DetailItem label="Họ tên" value={showItem?.full_name} />
            <DetailItem label="Thử thách" value={showItem?.challenge_title} />
            <DetailItem label="Đơn vị" value={showItem?.metric_type} />
            <DetailItem
              label="Tiến độ hiện tại"
              value={showItem?.current_value}
            />
            <DetailItem label="Mục tiêu" value={showItem?.target_value} />
            <DetailItem
              label="Ngày tham gia"
              value={formatDate(showItem?.joined_at)}
            />
            <DetailItem
              label="Hạn chót"
              value={formatDate(showItem?.deadline_at)}
            />
            <DetailItem
              label="Ngày hoàn thành"
              value={formatDate(showItem?.completed_at)}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseShow}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editItem}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6 }}>
          Chỉnh sửa tham gia thử thách
          <IconButton
            onClick={handleCloseEdit}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Trạng thái"
              select
              value={editForm.status}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, status: e.target.value }))
              }
              fullWidth
            >
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="in_progress">Đang thực hiện</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
              <MenuItem value="claimed">Đã nhận</MenuItem>
              <MenuItem value="failed">Thất bại</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </TextField>

            <TextField
              label="Tiến độ hiện tại"
              type="number"
              value={editForm.current_value}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  current_value: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              label="Hạn chót"
              type="datetime-local"
              value={editForm.deadline_at}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  deadline_at: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Ngày hoàn thành"
              type="datetime-local"
              value={editForm.completed_at}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  completed_at: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Đang chỉnh cho:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                {editItem?.full_name || "-"}
              </Typography>
              <Typography variant="body2" color="primary">
                {editItem?.email || "-"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={saving}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
