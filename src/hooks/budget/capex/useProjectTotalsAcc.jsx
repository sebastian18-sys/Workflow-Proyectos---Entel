import { useMemo } from "react";

// ===== Resúmenes del proyecto
export default function useProjectTotalsAcc(records, selectedFcst = []) {

    const fcst = selectedFcst[selectedFcst.length - 1]
    
    return useMemo(() => {

        const fcstHW = records.reduce((s, r) => s + (r.categoria === "Hardware" ? ((r.forecasts?.[fcst]?.fcst?.total ?? 0) + ((r.forecasts?.[fcst]?.cf?.total ?? 0))) : 0), 0);
        const fcstSV = records.reduce((s, r) => s + ((r.categoria === "Servicios" || r.categoria === "") ? ((r.forecasts?.[fcst]?.fcst?.total ?? 0) + ((r.forecasts?.[fcst]?.cf?.total ?? 0))) : 0), 0);

        const solpeHW = records.reduce((s, r) => s + (r.categoria === "Hardware" ? r.solpe ?? 0 : 0), 0);
        const solpeSV = records.reduce((s, r) => s + (r.categoria === "Servicios" ? r.solpe ?? 0 : 0), 0);

        const acHW = records.reduce((s, r) => s + (r.categoria === "Hardware" ? r.amounts?.ac?.total ?? 0 : 0 ), 0);
        const acSV = records.reduce((s, r) => s + (r.categoria === "Servicios" ? r.amounts?.ac?.total ?? 0 : 0 ), 0);

        const ocHW = records.reduce((s, r) => s + (r.categoria === "Hardware" ? r.amounts?.oc?.total ?? 0 : 0 ), 0);
        const ocSV = records.reduce((s, r) => s + (r.categoria === "Servicios" ? r.amounts?.oc?.total ?? 0 : 0 ), 0);

        return { 
            fcstHW, fcstSV,
            solpeHW, solpeSV,
            acHW, acSV,
            ocHW, ocSV
        };
    }, [records]);
}