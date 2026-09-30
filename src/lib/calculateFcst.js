export default function calculateFcst(data, fcst_select, mes_select) {

    const ordenMeses = [
        "Enero","Febrero","Marzo","Abril","Mayo","Junio",
        "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ]

    let fcst_actual = 0
    let fcst_mes = 0
    let fcst_pct = 0
    let fcst_pct_mes = 0    
    let pend_fcst_mes = 0

    const idx = ordenMeses.indexOf(mes_select)

    if(data) {

        const importe_ac = data.importe_ac || 0

        const data_fcst_selected = data?.forecasts?.[fcst_select]
        
        // Forecast
        fcst_actual = data_fcst_selected.fcst.total

        // % cumplimiento FCST --> importe_ac / fcst_actual
        if (data_fcst_selected.fcst.total !== 0) {
            fcst_pct = importe_ac / data_fcst_selected.fcst.total
        } else {
            fcst_pct = 0
        }

        // FCST a <mes>
        fcst_mes = data_fcst_selected.fcst.months.reduce((acc, mes, i) => {
            return i <= idx ? acc + (Number(mes.value) || 0) : acc;
        }, 0);

        // % cumplimiento a <mes> --> fcst_mes / fcst_actual
        if (fcst_mes !== 0) {
            fcst_pct_mes = importe_ac / fcst_mes
        } else {
            fcst_pct_mes = 0
        }
        
        // Pend. de FCST a <mes> --> fcst_actual - fcst_mes
        pend_fcst_mes = fcst_mes - importe_ac
     
    }


    return {
        fcst_mes,
        pend_fcst_mes,
        fcst_pct,
        fcst_pct_mes,
        fcst_actual
    }
}