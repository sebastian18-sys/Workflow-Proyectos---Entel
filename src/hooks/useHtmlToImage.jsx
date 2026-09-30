import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Copy, Download } from "lucide-react";
import { downloadBlob } from "@/lib/downloadBlob";
import { toast } from "wc-toast";

const waitForNextPaint = () =>
    new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });

export default function useHtmlToImage() {
    const chartExportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportMode, setExportMode] = useState(false);

    const createChartPngBlob = async () => {
        const node = chartExportRef.current;

        if (!node) {
            throw new Error("No se encontró la gráfica.");
        }

        // Espera a que carguen las fuentes antes de capturar
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        // Esperar a que Recharts y el navegador terminen de pintar
        await waitForNextPaint();

        // const width = Math.ceil(node.scrollWidth);
        // const height = Math.ceil(node.scrollHeight);

        const blob = await toBlob(node, {
            backgroundColor: "#ffffff",

            // 3 = tres veces el tamaño actual.
            // Puedes usar 4 para mayor resolución.
            pixelRatio: 3,
            cacheBust: true,
            // width,
            // height,

            // Excluye controles o elementos que no quieras mostrar
            filter: (element) => {
                if (!(element instanceof HTMLElement)) {
                    return true;
                }

                if (element.dataset.exportIgnore === "true") {
                    return false;
                }

                // Evita exportar un tooltip abierto
                if (element.classList.contains("recharts-tooltip-wrapper")) {
                    return false;
                }

                return true;
            },
        });

        if (!blob) {
            throw new Error("No se pudo generar la imagen.");
        }

        return blob;
    };

    const handleDownloadChart = async () => {
        try {
            setIsExporting(true);

            const blob = await createChartPngBlob();
            const date = new Date().toISOString().slice(0, 10);

            downloadBlob(blob, `resumen-fcst-${date}.png`);
        } catch (error) {
            console.error(error);
            window.alert(error.message || "No se pudo descargar la gráfica.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleCopyChart = async () => {
        try {
            setIsExporting(true);
            setExportMode(true);

            if (
                !window.isSecureContext ||
                !navigator.clipboard?.write ||
                typeof ClipboardItem === "undefined"
            ) {
                throw new Error(
                    "La copia al portapapeles requiere HTTPS o localhost."
                );
            }

            const blob = await createChartPngBlob();

            await navigator.clipboard.write([
                new ClipboardItem({
                    "image/png": blob,
                }),
            ]);

            // Puedes sustituirlo por toast.success(...)
            toast.success("Gráfica copiada")
            // window.alert("Gráfica copiada. Ya puedes pegarla en PowerPoint.");
        } catch (error) {
            console.error(error);
            window.alert(
                error.message ||
                "No se pudo copiar. Prueba descargando la imagen."
            );
        } finally {
            setIsExporting(false);
            setExportMode(false);
        }
    };

    return {
        chartExportRef,
        isExporting,
        exportMode,
        handleDownloadChart,
        handleCopyChart
    }

}