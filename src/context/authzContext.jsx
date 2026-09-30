import { useAuth } from "@/hooks/useAuth";
import { getAuthzMe } from "@/services/getAuthzMe";
import { createContext, useEffect, useMemo, useState } from "react";

const AuthzContext = createContext(null);

export function AuthzProvider({ children }) {
    const { token, clearSession, isLogged, user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [me, setMe] = useState(null);   // { user, roles, permissions }
    const [error, setError] = useState(null);

    useEffect(() => {
        let alive = true;

        // si no hay sesión => no hay permisos
        if (!isLogged || !token) {
            setMe(null);
            setLoading(false);
            setError(null);
            return;
        }

        async function load() {
        try {
            setLoading(true);
            setError(null);

            const data = await getAuthzMe(user.id);
            if (alive) setMe(data);
        } catch (e) {
            // si el token expiró/invalid => limpias sesión
            // (si prefieres: solo setMe(null) y listo)
            clearSession?.();
            if (alive) {
            setMe(null);
            setError(e);
            }
        } finally {
            if (alive) setLoading(false);
        }
        }

        load();
        return () => { alive = false; };
    }, [isLogged, token, clearSession]);

    const permissions = me?.permissions ?? [];
    const roles = me?.roles ?? [];
    const user2 = me?.user ?? null;
    
    const can = useMemo(() => {
        const set = new Set((permissions ?? []).map(p => p.code));
        return (permCode) => set.has(permCode);
    }, [permissions]);

    return (
        <AuthzContext.Provider value={{ loading, user2, roles, permissions, can, error }}>
        {children}
        </AuthzContext.Provider>
    );
}

export default AuthzContext;