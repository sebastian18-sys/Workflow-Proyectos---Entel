import { useContext } from "react";
import AuthzContext from "@/context/authzContext";

export function useAuthz() {
    return useContext(AuthzContext);
}