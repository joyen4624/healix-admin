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
  Add as AddIcon,
  MilitaryTech as BadgeIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  DirectionsRun as RunIcon,
} from "@mui/icons-material";

// --- TYPES ---
type BadgeRow = {
  id?: string;
  code: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at?: string;
};

type BadgeFormState = {
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

// --- HELPERS ---
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const renderPreviewIcon = (
  iconName?: string | null,
  colorHex?: string | null,
) => {
  const defaultColor = colorHex || "#d97706";
  const name = (iconName || "").toLowerCase();

  if (name.includes("trophy"))
    return <TrophyIcon sx={{ color: defaultColor, fontSize: 28 }} />;
  if (name.includes("star"))
    return <StarIcon sx={{ color: defaultColor, fontSize: 28 }} />;
  if (name.includes("fire"))
    return <FireIcon sx={{ color: defaultColor, fontSize: 28 }} />;
  if (name.includes("run"))
    return <RunIcon sx={{ color: defaultColor, fontSize: 28 }} />;
  return <BadgeIcon sx={{ color: defaultColor, fontSize: 28 }} />;
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

const emptyForm: BadgeFormState = {
  code: "",
  name: "",
  description: "",
  icon: "badge",
  color: "#f59e0b",
};

// --- MAIN COMPONENT ---
export const BadgesList: React.FC = () => {
  const { dataGridProps } = useDataGrid({
    resource: "badges",
    pagination: { mode: "server", currentPage: 1, pageSize: 20 },
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

  const [searchText, setSearchText] = useState("");
  const [showId, setShowId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<BadgeFormState>(emptyForm);

  const allRows = React.useMemo(() => {
    if (!Array.isArray(dataGridProps.rows)) return [];
    return dataGridProps.rows.map((row: any) => ({
      ...row,
      id: row.id || row.code,
    })) as BadgeRow[];
  }, [dataGridProps.rows]);

  const filteredRows = React.useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return allRows.filter((row) => {
      return (
        !keyword ||
        [row?.name, row?.code, row?.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      );
    });
  }, [allRows, searchText]);

  const stats = React.useMemo(() => {
    const total = allRows.length;
    const specialCount = allRows.filter((r) =>
      r.icon?.toLowerCase().includes("trophy"),
    ).length;

    return { total, specialCount };
  }, [allRows]);

  const showQuery = useOne<BadgeRow>({
    resource: "badges",
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

  const editQuery = useOne<BadgeRow>({
    resource: "badges",
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
        code: editItem.code ?? "",
        name: editItem.name ?? "",
        description: editItem.description ?? "",
        icon: editItem.icon ?? "badge",
        color: editItem.color ?? "#f59e0b",
      });
    }
  }, [editItem]);

  const handleResetFilters = () => setSearchText("");

  const handleExportCSV = () => {
    const headers = [
      "Mã (Code)",
      "Tên huy hiệu",
      "Mô tả",
      "Icon Name",
      "Màu sắc (Hex)",
      "Ngày tạo",
    ];
    const rows = filteredRows.map((row) => [
      row?.code ?? "",
      row?.name ?? "",
      row?.description ?? "",
      row?.icon ?? "",
      row?.color ?? "",
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
    link.setAttribute("download", "healix-badges.csv");
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
      code: formData.code.toUpperCase().trim().replace(/\s+/g, "_"),
      name: formData.name,
      description: formData.description,
      icon: formData.icon || null,
      color: formData.color || null,
    };

    if (editId !== null) {
      const { code, ...updatePayload } = payload;
      updateMutation.mutate(
        { resource: "badges", id: editId, values: updatePayload },
        {
          onSuccess: () => {
            invalidate({ resource: "badges", invalidates: ["list", "detail"] });
            handleCloseForm();
            alert("Cập nhật thành công!");
          },
        },
      );
    } else {
      createMutation.mutate(
        { resource: "badges", values: payload },
        {
          onSuccess: () => {
            invalidate({ resource: "badges", invalidates: ["list"] });
            handleCloseForm();
            alert("Tạo huy hiệu mới thành công!");
          },
        },
      );
    }
  };

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "info",
        headerName: "Huy hiệu (Badge)",
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
              sx={{
                width: 56,
                height: 56,
                bgcolor: `${row.color || "#e2e8f0"}20`,
                border: `2px solid ${row.color || "#e2e8f0"}`,
              }}
            >
              {renderPreviewIcon(row.icon, row.color)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 800, color: "#111827" }}
              >
                {row.name || "Chưa có tên"}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: "block",
                  color: "#0284c7",
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                {row.code}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        field: "description",
        headerName: "Mô tả",
        minWidth: 250,
        flex: 1,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {row.description || "-"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "design",
        headerName: "Thiết kế (Icon / Color)",
        width: 180,
        align: "center",
        headerAlign: "center",
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
              sx={{ fontWeight: 600, color: "#0f172a" }}
            >
              {row.icon || "Mặc định"}
            </Typography>
            {row.color && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 0.5,
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: row.color,
                    border: "1px solid #cbd5e1",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace" }}
                >
                  {row.color}
                </Typography>
              </Box>
            )}
          </Box>
        ),
      },
      {
        field: "created_at",
        headerName: "Ngày tạo",
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
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
                onClick={() => setShowId(row.code)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sửa huy hiệu">
              <IconButton
                size="small"
                sx={{ color: "#7c3aed" }}
                onClick={() => setEditId(row.code)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <DeleteButton hideText size="small" recordItemId={row.code} />
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
            Kho Huy hiệu (Badges)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tạo và quản lý các danh hiệu để trao thưởng cho người dùng xuất sắc.
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
          Tạo Huy hiệu
        </Button>
      </Box>

      {/* Đã giảm còn 2 cột và xoá cột Màu Vàng Chủ Đạo */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard
          title="Tổng số Huy hiệu"
          value={stats.total}
          color="#2563eb"
          icon={<BadgeIcon />}
        />
        <StatCard
          title="Huy hiệu Cúp Vàng (Trophy)"
          value={stats.specialCount}
          color="#d97706"
          icon={<TrophyIcon />}
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
                  Danh sách thiết kế
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                <TextField
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tên, Code, Mô tả..."
                  size="small"
                  sx={{ width: 280 }}
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
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Chi tiết Huy hiệu
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
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  p: 3,
                  bgcolor: "#f8fafc",
                  borderRadius: 3,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: `${showItem?.color || "#94a3b8"}20`,
                    border: `3px solid ${showItem?.color || "#94a3b8"}`,
                  }}
                >
                  {renderPreviewIcon(showItem?.icon, showItem?.color)}
                </Avatar>
                <Typography variant="h5" fontWeight={800} mt={1}>
                  {showItem?.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    bgcolor: "#e2e8f0",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {showItem?.code}
                </Typography>
              </Box>

              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}
              >
                <DetailItem
                  fullWidth
                  label="Mô tả ý nghĩa"
                  value={showItem?.description || "Chưa có mô tả."}
                />
                <DetailItem
                  label="Biểu tượng (Icon)"
                  value={showItem?.icon || "Chưa gán"}
                />
                <DetailItem
                  label="Mã màu (Hex)"
                  value={
                    showItem?.color ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            bgcolor: showItem.color,
                          }}
                        />{" "}
                        {showItem.color}
                      </Box>
                    ) : (
                      "Chưa gán"
                    )
                  }
                />
                <DetailItem
                  label="Ngày khởi tạo"
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
          {isCreateOpen ? "Tạo Huy hiệu mới" : "Chỉnh sửa thiết kế"}
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {isCreateOpen ? (
                <TextField
                  label="Mã CODE duy nhất"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  fullWidth
                  size="small"
                  helperText="Viết hoa, không dấu, ngăn cách bằng dấu _. Ví dụ: 100_SQUAT_MASTER"
                />
              ) : (
                <TextField
                  label="Mã CODE (Không thể sửa)"
                  disabled
                  value={formData.code}
                  fullWidth
                  size="small"
                />
              )}

              <TextField
                label="Tên hiển thị (Tiếng Việt)"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                fullWidth
                size="small"
              />

              <TextField
                label="Mô tả vinh danh"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                fullWidth
                size="small"
              />

              <Divider sx={{ my: 1 }} />
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ fontWeight: 700 }}
              >
                THIẾT KẾ TRỰC QUAN
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                {/* SELECT CHỌN ICON */}
                <TextField
                  label="Chọn Icon hiển thị"
                  select
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, icon: e.target.value }))
                  }
                  fullWidth
                  size="small"
                >
                  <MenuItem value="badge">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BadgeIcon fontSize="small" /> Huy hiệu chuẩn
                    </Box>
                  </MenuItem>
                  <MenuItem value="trophy">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TrophyIcon fontSize="small" /> Cúp vàng
                    </Box>
                  </MenuItem>
                  <MenuItem value="star">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <StarIcon fontSize="small" /> Ngôi sao
                    </Box>
                  </MenuItem>
                  <MenuItem value="fire">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FireIcon fontSize="small" /> Ngọn lửa
                    </Box>
                  </MenuItem>
                  <MenuItem value="run">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <RunIcon fontSize="small" /> Chạy bộ
                    </Box>
                  </MenuItem>
                </TextField>

                {/* PICKER CHỌN MÀU NATIVE */}
                <TextField
                  label="Chọn Màu sắc"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, color: e.target.value }))
                  }
                  fullWidth
                  size="small"
                  sx={{
                    "& input": {
                      height: 40,
                      padding: "4px 8px",
                      cursor: "pointer",
                    },
                  }}
                />
              </Box>

              {/* BẢNG XEM TRƯỚC (PREVIEW) */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  border: "1px dashed #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Xem trước:
                </Typography>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: `${formData.color || "#94a3b8"}20`,
                    border: `2px solid ${formData.color || "#94a3b8"}`,
                  }}
                >
                  {renderPreviewIcon(formData.icon, formData.color)}
                </Avatar>
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
              ? "Tạo Huy hiệu"
              : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
