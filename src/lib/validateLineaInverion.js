class ValidationAlertError extends Error {
    constructor({ title, message, alert }) {
        super(message);
        this.name = "ValidationAlertError";
        this.title = title;
        this.alert = alert;
    }
}

export default function validateLineInvertion(
    id_proyecto, 
    projects, 
    linea_inversion, 
    identificador
) {

    // let line_inversion = []

    if (!id_proyecto) {
        throw new ValidationAlertError({
            title: "Proyecto inválido",
            message: "El proyecto no tiene id de proyecto.",
            alert: {
                id: `PROJECT_ID_EMPTY||${identificador ?? ""}`,
                tipo: "error",
                bloquea: true,
                grupo: "proyecto",
                codigo: "PROJECT_ID_EMPTY",
                titulo: "Proyecto sin ID",
                mensaje: "El proyecto no tiene id de proyecto.",
                detalle: [
                    { label: "Identificador", value: identificador ?? "-" },
                ],
            },
        });
    }

    const proyecto = projects.filter(p => p.project_code === id_proyecto)

    if (!proyecto || proyecto.length === 0) {
        throw new ValidationAlertError({
            title: "Proyecto no encontrado",
            message: `El proyecto ${id_proyecto} no existe.`,
            alert: {
                id: `PROJECT_NO_ENCONTRADO||${id_proyecto}||${identificador ?? ""}`,
                tipo: "error",
                bloquea: true,
                grupo: "proyecto",
                codigo: "PROJECT_NO_ENCONTRADO",
                titulo: "Proyecto no encontrado",
                mensaje: `El proyecto ${id_proyecto} no existe.`,
                detalle: [
                    { label: "ID Proyecto", value: id_proyecto },
                    { label: "Identificador", value: identificador ?? "-" },
                ],
            },
        });
    }

    const nombreProy = proyecto[0].project_name

    const lineasInversion = [
        ...new Set(
            proyecto
                .map(p => p.investment_line)
                .filter(Boolean)
        ),
    ];

    if (linea_inversion && !lineasInversion.includes(linea_inversion)) {
        throw new ValidationAlertError({
            title: "Línea de inversión inválida",
            message: `La línea de inversión ingresada no existe dentro del proyecto ${id_proyecto}.`,
            alert: {
                id: `PROJECT_LINE_INVALIDA||${id_proyecto}||${linea_inversion}||${identificador ?? ""}`,
                tipo: "error",
                bloquea: true,
                grupo: "proyecto",
                codigo: "PROJECT_LINE_INVALIDA",
                titulo: "Línea de inversión inválida",
                mensaje: `La linea de inversion: ${linea_inversion} no existe dentro del proyecto ${id_proyecto} -- ${nombreProy} con indentificador ${identificador}. Favor de revisar las lineas del proyecto ingresado y volver a intentar.`,
                detalle: [
                    {
                        label: `Líneas correctas del proyecto ${nombreProy}:`,
                        value: lineasInversion,
                        type: "list",
                    },
                ],
            },
        });
    }
}