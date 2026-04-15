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
  Switch,
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
  Add as AddIcon,
  Lightbulb as LightbulbIcon,
  LightbulbCircle as ActiveIcon,
  HighlightOff as InactiveIcon,
  Sort as SortIcon,
} from "@mui/icons-material";

// --- TYPES ---
type AiSuggestionRow = {
  id: string | number;
  text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
};

type AiFormState = {
  text: string;
  is_active: string;
  display_order: string;
};

// --- HELPERS ---
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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

const emptyForm: AiFormState = {
  text: "",
  is_active: "true",
  display_order: "0",
};

// --- MAIN COMPONENT ---
export const AiSuggestionsList: React.FC = () => {
  const { dataGridProps } = useDataGrid({
    resource: "ai-suggestions",
    pagination: { mode: "server", currentPage: 1, pageSize: 30 },
    // Gọi sort mặc định giống API để tránh nhảy giao diện
    sorters: {
      initial: [
        { field: "display_order", order: "asc" },
        { field: "created_at", order: "desc" },
      ],
    },
  });

  const invalidate = useInvalidate();

  const updateMutation = useUpdate();
  const createMutation = useCreate();
  const isSaving =
    (updateMutation as any).isPending ||
    (updateMutation as any).isLoading ||
    (createMutation as any).isPending ||
    (createMutation as any).isLoading ||
    false;
  const updateUser = updateMutation.mutate;

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showId, setShowId] = useState<string | number | null>(null);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<AiFormState>(emptyForm);

  const allRows = React.useMemo(
    () =>
      Array.isArray(dataGridProps.rows)
        ? (dataGridProps.rows as AiSuggestionRow[])
        : [],
    [dataGridProps.rows],
  );

  const filteredRows = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchKeyword =
        !keyword || (row?.text || "").toLowerCase().includes(keyword);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && row?.is_active === true) ||
        (statusFilter === "inactive" && row?.is_active === false);
      return matchKeyword && matchStatus;
    });
  }, [allRows, searchText, statusFilter]);

  const stats = React.useMemo(() => {
    const total = allRows.length;
    const active = allRows.filter((r) => r.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [allRows]);

  const showQuery = useOne<AiSuggestionRow>({
    resource: "ai-suggestions",
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

  const editQuery = useOne<AiSuggestionRow>({
    resource: "ai-suggestions",
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
        text: editItem.text ?? "",
        is_active: editItem.is_active ? "true" : "false",
        display_order: String(editItem.display_order ?? 0),
      });
    }
  }, [editItem]);

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nội dung", "Trạng thái", "Thứ tự", "Ngày tạo"];
    const rows = filteredRows.map((row) => [
      row?.id ?? "",
      row?.text ?? "",
      row?.is_active ? "Đang hiện" : "Đang ẩn",
      row?.display_order ?? 0,
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
    link.setAttribute("download", "healix-ai-suggestions.csv");
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
    if (!formData.text.trim()) return alert("Nội dung không được để trống!");

    const payload = {
      text: formData.text.trim(),
      is_active: formData.is_active === "true",
      display_order: Number(formData.display_order || 0),
    };

    if (editId !== null) {
      updateMutation.mutate(
        { resource: "ai-suggestions", id: editId, values: payload },
        {
          onSuccess: () => {
            invalidate({
              resource: "ai-suggestions",
              invalidates: ["list", "detail"],
            });
            handleCloseForm();
            alert("Cập nhật thành công!");
          },
        },
      );
    } else {
      createMutation.mutate(
        { resource: "ai-suggestions", values: payload },
        {
          onSuccess: () => {
            invalidate({ resource: "ai-suggestions", invalidates: ["list"] });
            handleCloseForm();
            alert("Thêm gợi ý mới thành công!");
          },
        },
      );
    }
  };

  // Quick Update Switch: Backend bắt buộc gửi 'text', nếu không sẽ báo lỗi 400.
  const handleQuickToggle = (row: AiSuggestionRow, newStatus: boolean) => {
    updateUser(
      {
        resource: "ai-suggestions",
        id: row.id,
        values: {
          text: row.text,
          is_active: newStatus,
          display_order: row.display_order,
        },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "ai-suggestions", invalidates: ["list"] });
        },
      },
    );
  };

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "info",
        headerName: "Nội dung gợi ý AI",
        minWidth: 350,
        flex: 2,
        sortable: false,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              py: 2,
              minWidth: 0,
              height: "100%",
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: row.is_active ? "#e0e7ff" : "#f1f5f9",
                color: row.is_active ? "#4f46e5" : "#94a3b8",
                mt: 0.5,
              }}
            >
              <LightbulbIcon fontSize="small" />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: row.is_active ? "#0f172a" : "#64748b",
                  whiteSpace: "normal",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}
              >
                {row.text || "-"}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        field: "display_order",
        headerName: "Độ ưu tiên",
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
            <Tooltip title="Thứ tự càng nhỏ, gợi ý càng nằm trên cùng" arrow>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "#fffbeb",
                  border: "1px solid #fcd34d",
                  color: "#b45309",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {row.display_order}
              </Avatar>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "is_active",
        headerName: "Hiển thị",
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
            <Tooltip title={row.is_active ? "Đang hiện trên App" : "Đã bị ẩn"}>
              <Switch
                size="small"
                checked={!!row.is_active}
                color="primary"
                onChange={(e) =>
                  handleQuickToggle(row as AiSuggestionRow, e.target.checked)
                }
              />
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "created_at",
        headerName: "Thời gian tạo",
        width: 160,
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
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#475569" }}
            >
              {formatDate(row.created_at)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Quản trị",
        sortable: false,
        filterable: false,
        width: 140,
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
            <Tooltip title="Sửa gợi ý">
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
            Gợi ý AI (AI Suggestions)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý các câu hỏi mẫu/gợi ý xuất hiện trên khung Chatbot AI.
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
          Thêm Gợi ý
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard
          title="Tổng số Gợi ý"
          value={stats.total}
          color="#6366f1"
          icon={<LightbulbIcon />}
        />
        <StatCard
          title="Đang hiển thị (Active)"
          value={stats.active}
          color="#16a34a"
          icon={<ActiveIcon />}
        />
        <StatCard
          title="Đang ẩn (Inactive)"
          value={stats.inactive}
          color="#94a3b8"
          icon={<InactiveIcon />}
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
                  Kho nội dung
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                <TextField
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm nội dung gợi ý..."
                  size="small"
                  sx={{ width: 280 }}
                />

                <TextField
                  select
                  size="small"
                  label="Trạng thái"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="active">Đang hiển thị</MenuItem>
                  <MenuItem value="inactive">Đang ẩn</MenuItem>
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
              pageSizeOptions={[10, 30, 50]}
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
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Chi tiết Gợi ý AI
          <IconButton
            onClick={() => setShowId(null)}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 200 }}>
          {showLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box
                sx={{
                  bgcolor: "#f8fafc",
                  p: 3,
                  borderRadius: 2,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <LightbulbIcon fontSize="small" color="primary" /> Content:
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  "{showItem?.text}"
                </Typography>
              </Box>

              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}
              >
                <DetailItem
                  label="Trạng thái"
                  value={
                    <Chip
                      label={showItem?.is_active ? "Đang hiện" : "Đã bị ẩn"}
                      color={showItem?.is_active ? "success" : "default"}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  }
                />
                <DetailItem
                  label="Độ ưu tiên (Order)"
                  value={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SortIcon fontSize="small" color="action" />{" "}
                      {showItem?.display_order}
                    </Box>
                  }
                />
                <DetailItem label="ID Hệ thống" value={showItem?.id} />
                <DetailItem
                  label="Ngày tạo"
                  value={formatDate(showItem?.created_at)}
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
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          {isCreateOpen ? "Thêm Gợi ý mới" : "Chỉnh sửa Gợi ý"}
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Nội dung gợi ý (Text)"
                required
                multiline
                rows={3}
                value={formData.text}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, text: e.target.value }))
                }
                fullWidth
                size="small"
                placeholder="Ví dụ: Giúp tôi lên lịch tập bụng trong 3 ngày tới..."
                helperText="Nội dung này sẽ hiển thị thành một nút bấm trên khung chat AI của user."
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Độ ưu tiên (Display Order)"
                  type="number"
                  required
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      display_order: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  helperText="0 là cao nhất, số lớn hơn sẽ xếp phía sau."
                />

                <TextField
                  label="Trạng thái hiển thị"
                  select
                  value={formData.is_active}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, is_active: e.target.value }))
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="true">Cho phép hiện</MenuItem>
                  <MenuItem value="false">Tạm ẩn</MenuItem>
                </TextField>
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
            {isSaving
              ? "Đang lưu..."
              : isCreateOpen
              ? "Tạo Gợi ý"
              : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
