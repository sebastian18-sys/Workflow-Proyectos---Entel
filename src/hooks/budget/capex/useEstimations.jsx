import { getAllOpexEstimaciones } from '@/services/capex/getAllOpex';
import { postOpexEstimaciones, putOpexEstimaciones } from '@/services/capex/postOpex';
import { useState, useEffect } from 'react';
// import { MOCK_PROJECTS, MOCK_ESTIMATIONS } from './mock-data';

const STORAGE_KEY = 'estimation-state';


// import { Project, Estimation, MONTHS } from './types';

const MOCK_PROJECTS = [
    { id: '1', tipo: 'Macro', proyecto: 'Cobertura FDD', proyectoSitio: 'Proyecto Cobertura FDD - TDD Alquiler Roll Out - 2026', tipo_2: "BTS", driverPlan: 1533.87, incidencia: 1 },
    { id: '2', tipo: 'Macro', proyecto: 'REG 700', proyectoSitio: 'Regulatorio 700 Nuevos Poligonos + CVM - 2026', tipo_2: "BTS", driverPlan: 1533.87, incidencia: 1 },
    { id: '3', tipo: 'Macro', proyecto: 'Roll Out', proyectoSitio: 'Roll Out - 2026', tipo_2: "BTS", driverPlan: 1533.87, incidencia: 1 },
    { id: '4', tipo: 'Macro', proyecto: 'Cobertura IP', proyectoSitio: 'Cobertura Indoor Profundo', tipo_2: "BTS", driverPlan: 1533.87, incidencia: 1 },
    { id: '5', tipo: 'Macro', proyecto: 'B3.5 MUER', proyectoSitio: 'MUER', tipo_2: "BTS", driverPlan: 1995.84, incidencia: 1 },
    { id: '6', tipo: 'Macro', proyecto: 'Cobertura FDD', proyectoSitio: 'Proyecto Cobertura FDD - TDD Alquiler Roll Out - 2026', tipo_2: "CON TORRERA", driverPlan: 1533.87, incidencia: 1 },
    { id: '7', tipo: 'Macro', proyecto: 'REG 700', proyectoSitio: 'Regulatorio 700 Nuevos Poligonos + CVM - 2026', tipo_2: "CON TORRERA", driverPlan: 1533.87, incidencia: 1 },
    { id: '8', tipo: 'Macro', proyecto: 'Roll Out', proyectoSitio: 'Roll Out - 2026', tipo_2: "CON TORRERA", driverPlan: 1533.87, incidencia: 1 },
    { id: '9', tipo: 'Macro', proyecto: 'Cobertura IP', proyectoSitio: 'Cobertura Indoor Profundo', tipo_2: "CON TORRERA", driverPlan: 1533.87, incidencia: 1 },
    { id: '10', tipo: 'Macro', proyecto: 'B3.5 MUER', proyectoSitio: 'MUER', tipo_2: "CON TORRERA", driverPlan: 0, incidencia: 1 },
    { id: '11', tipo: 'Macro', proyecto: 'B3.5 Espectro rural', proyectoSitio: 'COI espectro rural', tipo_2: "CON TORRERA", driverPlan: 1171.58, incidencia: 1 },
    // { id: '11', tipo: 'Expansión', proyecto: 'Prog 11', proyectoSitio: 'Prog 11 sub', driverPlan: 5.5, incidencia: 0.5 },
    // { id: '10', tipo: 'Expansión', proyecto: 'Prog 12', proyectoSitio: 'Prog 12 sub', driverPlan: 6.1, incidencia: 0.75 },
    // { id: '11', tipo: 'Expansión', proyecto: 'Prog 13', proyectoSitio: 'Prog 13 sub', driverPlan: 4.9, incidencia: 1 },
    // { id: '12', tipo: 'Expansión', proyecto: 'Prog 14', proyectoSitio: 'Prog 14 sub', driverPlan: 3.3, incidencia: 0.3 },
    // { id: '13', tipo: 'Expansión', proyecto: 'Prog 15', proyectoSitio: 'Prog 15 sub', driverPlan: 7.2, incidencia: 1 },
    // { id: '14', tipo: 'Transporte', proyecto: 'Prog 25', proyectoSitio: 'Transporte', driverPlan: 1.25, incidencia: 1 },
    // { id: '15', tipo: 'PROPULSOR', proyecto: 'Prog 26', proyectoSitio: 'PROPULSOR', driverPlan: 0.882, incidencia: 1 }
];

// Inicializar estimaciones con Qs aleatorios
const initializeEstimations = () => {
    return MOCK_PROJECTS.flatMap(project => {

        const generateQs = () => {
            const baseQs = [100, 95, 110, 105, 98, 102, 108, 112, 100, 95, 90, 105];
            const variance = Math.random() * 20 - 10;
            return baseQs.map(q => Math.max(0, Math.round(q + variance * Math.random())));
        };

        const qsEnergia = generateQs();
        const qsActividad = generateQs();

        const calculateMontos = (qs, project) => {
            return qs.map(q => q * project.driverPlan * project.incidencia);
        };

        // console.log("qE", qsEnergia)

        return [
            {
                projectId: project.id,
                type: 'energia',
                qs: qsEnergia,
                montos: calculateMontos(qsEnergia, project),
            },
            {
                projectId: project.id,
                type: 'actividad',
                qs: qsActividad,
                montos: calculateMontos(qsActividad, project),
            }
        ];
    });
};

const MOCK_ESTIMATIONS = initializeEstimations();

// console.log("MOCK_ESTIMATIONS", MOCK_ESTIMATIONS)

export function useEstimations() {

    const [opexEstimacion, setOpexEstimacion] = useState([])
    const [loading, setLoading] = useState(false)
    const [state, setState] = useState({
        projects: MOCK_PROJECTS,
        estimations: MOCK_ESTIMATIONS,
    });

    // Cargar desde localStorage al montar
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
        try {
            setState(JSON.parse(saved));
        } catch (e) {
            console.error('Error parsing saved state:', e);
        }
        }
    }, []);

    // Guardar en localStorage cuando cambia
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // FETCH API
    useEffect(() => {
            
        setLoading(true);

        getAllOpexEstimaciones()
            .then(res => {
                setOpexEstimacion(res.content)
            })
            .finally(() => setLoading(false))
        // return () => controller.abort()
    }, [])


    const postEstimation = async (fd) => {
        try {
            const data = await postOpexEstimaciones(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const addEstimation = async (fd) => {



        // log FormData
        // for (const [key, value] of fd.entries()) {
        //     console.log(key, value);
        // }

        try {
            const data = await putOpexEstimaciones(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateEstimation = (projectId, type, qs) => {
        setState(prev => {
        const newEstimations = prev.estimations.map(est => {
            if (est.projectId === projectId && est.type === type) {
            const project = prev.projects.find(p => p.id === projectId);
            const montos = qs.map(q => q * project.driverPlan * project.incidencia);
            return { ...est, qs, montos };
            }
            return est;
        });
        return { ...prev, estimations: newEstimations };
        });
    };

    const getEstimation = (projectId, type) => {
        return state.estimations.find(est => est.projectId === projectId && est.type === type);
    };

    const getProject = (projectId) => {
        return state.projects.find(p => p.id === projectId);
    };

    return {
        opexEstimacion,
        state,
        addEstimation,
        postEstimation,
        updateEstimation,
        getEstimation,
        getProject,
    };
}