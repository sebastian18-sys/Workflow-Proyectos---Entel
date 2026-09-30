import { useAuth } from "@/hooks/useAuth";
import { useAuthz } from "@/hooks/useAuthz";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, perm }) {

	const { isLogged } = useAuth()
	const { loading, can } = useAuthz()

	if(perm) {
		if(loading) return <div>Loading...</div>
		if(!can(perm)) return <Navigate to="/403" replace />
	}

	return !isLogged
		? <Navigate to="/login" />
		: children

}