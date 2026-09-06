import { Navigate, useLocation } from "react-router-dom";
import { UserRole } from "@common/types/user";

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MODERATOR];

function readRoleFromStorage(): UserRole | null {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            console.warn("[AdminGuard] No user in localStorage");
            return null;
        }
        const parsed = JSON.parse(userStr);
        const role = typeof parsed?.role === "string" ? (parsed.role as UserRole) : null;
        console.log("[AdminGuard] Role from storage:", role, "Raw value:", parsed?.role, "ADMIN_ROLES:", ADMIN_ROLES, "Is admin?", role ? ADMIN_ROLES.includes(role) : false);
        return role;
    } catch (e) {
        console.error("[AdminGuard] Error reading role:", e);
        return null;
    }
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const accessToken = localStorage.getItem("accessToken");

    console.log("[AdminGuard] Rendering at path:", location.pathname, "Has token:", !!accessToken);

    if (!accessToken) {
        console.log("[AdminGuard] No access token, redirecting to login");
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    const role = readRoleFromStorage();
    const isAllowed = role && ADMIN_ROLES.includes(role);
    console.log("[AdminGuard] Role check:", { role, isAllowed, includes: ADMIN_ROLES.includes(role as any) });
    
    if (!isAllowed) {
        console.log("[AdminGuard] Access denied for role:", role, "redirecting to /cabinet");
        return <Navigate to="/cabinet" replace />;
    }

    console.log("[AdminGuard] Access granted, rendering children");
    return <>{children}</>;
}
