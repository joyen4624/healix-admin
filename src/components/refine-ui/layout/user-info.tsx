import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetIdentity } from "@refinedev/core";

// 1. Cập nhật Type khớp với dữ liệu từ backend (healix-admin-user)
type User = {
  id?: number | string;
  name?: string; // Dùng name thay vì firstName/lastName
  email?: string;
  avatar?: string;
};

export function UserInfo() {
  const { data: user, isLoading: userIsLoading } = useGetIdentity<User>();

  if (userIsLoading || !user) {
    return (
      <div className={cn("flex", "items-center", "gap-x-2")}>
        <Skeleton className={cn("h-10", "w-10", "rounded-full")} />
        <div
          className={cn(
            "flex",
            "flex-col",
            "justify-center",
            "h-10",
            "gap-1.5",
          )}
        >
          <Skeleton className={cn("h-3.5", "w-32")} />
          <Skeleton className={cn("h-3", "w-24")} />
        </div>
      </div>
    );
  }

  // Lấy dữ liệu name, email, avatar từ user
  const { name, email, avatar } = user;

  return (
    <div className={cn("flex", "items-center", "gap-x-2")}>
      {/* 2. Truyền src và alt vào UserAvatar để hiển thị ảnh thật */}
      <UserAvatar src={avatar} alt={name || "Admin"} />

      <div
        className={cn(
          "flex",
          "flex-col",
          "justify-center",
          "h-10",
          "text-left",
        )}
      >
        {/* 3. Hiển thị tên người dùng, nếu mất name thì fallback về "Admin" */}
        <span
          className={cn(
            "text-sm",
            "font-medium",
            "text-foreground",
            "leading-tight",
          )}
        >
          {name || "Admin"}
        </span>
        <span
          className={cn("text-xs", "text-muted-foreground", "leading-tight")}
        >
          {email || "admin@healix.com"}
        </span>
      </div>
    </div>
  );
}

UserInfo.displayName = "UserInfo";
