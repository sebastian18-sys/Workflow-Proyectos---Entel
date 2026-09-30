import { clearWorkflowPersistentFilters } from "@/lib/storageUtils";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

function readStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("loggedUser") || "null");
    } catch {
        return null;
    }
}

// Decode simple de JWT (sin librerías)
function parseJwt(token) {
  try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
        atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
  }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => readStoredUser());
    const token = user?.token ?? null;

    const setSession = useCallback((loggedUserObj) => {
        localStorage.setItem("loggedUser", JSON.stringify(loggedUserObj));
        setUser(loggedUserObj);
    }, []);

    const clearSession = useCallback(() => {
        clearWorkflowPersistentFilters(user?.email);
        localStorage.removeItem("loggedUser");
        setUser(null);
    }, []);

    // Logout si cualquier API dispara auth:logout (ej. 401)
    // useEffect(() => {
    //     const onLogout = () => clearSession();
    //     window.addEventListener("auth:logout", onLogout);
    //     return () => window.removeEventListener("auth:logout", onLogout);
    // }, [clearSession]);

    // Auto logout cuando expire el token (si trae exp)
    useEffect(() => {
        if (!token) return;

        const payload = parseJwt(token);
        const exp = payload?.exp; // segundos
        if (!exp) return; // si tu token no trae exp, ignora y dependerás del 401

        const msLeft = exp * 1000 - Date.now();
        if (msLeft <= 0) {
        clearSession();
        return;
        }

        const t = setTimeout(() => clearSession(), msLeft);
        return () => clearTimeout(t);
    }, [token, clearSession]);

    const value = useMemo(
        () => ({
            user,
            token,
            isLogged: !!token,
            setSession,
            clearSession,
            }),
        [user, token, setSession, clearSession]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;