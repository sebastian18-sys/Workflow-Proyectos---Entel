import { use, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { postScenarios } from "@/services/capex/postScenarios";
import ResultsTabs from "../result-scenarios-opex/ResultsTabs";
import { useScenariosData } from "@/hooks/budget/capex/useScenariosData";
import { Spinner } from "../ui/spinner";
import { toast } from "wc-toast";
import { formatNumberInt } from "@/lib/helpers";
// 3B82F6

function InitData ({ dataTable, dataProcess, setResultData, setShowResults, setTab }) {

    const {
        scenariosData,
        loading,
        setLoading,
    } = useScenariosData()

    const formatNumber = (value) => {
        if (value == null || value === "" || value === undefined) return value;

        const num = typeof value === "number" ? value : Number(value)
        if(Number.isNaN(num)) return ""
        return num.toLocaleString("es-PE", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
    }

    const [montoReducirInput, setMontoReducirInput] = useState("")

    const handleChangeMonto = (programa, value) => {
        setMontoReducirInput(prev => ({
            ...prev,
            [programa]: value,
        }));
    };

    const handleSubmit = async () => {

        setLoading(true)

        dataProcess.map(prog => {
            prog.map(proy => {
                proy.montoReducirInput = Number(montoReducirInput[proy.programa] || 0)
            })
        })

        console.log("Payload final:", dataProcess);

        try {
            const data = await scenariosData(dataProcess)
            setResultData(data)
            setShowResults(true)
            setLoading(false)
            setTab("escenarios")
            toast.success("Escenarios realizados!")
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
        
    };

    return (

        <>
            <div>
            {dataTable.map((prog) => {
                                
                const totalAmount = prog.rows.reduce((acc, r) => acc + Number(r.sumTotal), 0)

                return (

                    <div key={prog.programa} className="rounded-2xl border p-4 mb-8">
                        <div className="mb-3 text-sm font-semibold text-muted-foreground">
                            {prog.programa}
                        </div>
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-12 lg:col-span-10">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Proyecto</TableHead>
                                            {prog.headers.map((h) => (
                                                <TableHead key={h}>{h}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {prog.rows.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.Proyecto}</TableCell>
                                            {prog.headers.map((h) => (
                                                <TableCell key={h}>{(row[h]).toFixed(0) ?? 0}</TableCell>
                                            ))}
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Card className="col-span-12 lg:col-span-2 shadow-sm">
                                {/* <CardHeader> */}
                                <form>
                                    <div className="px-4">
                                        <span className="mb-4 font-semibold">Total</span>
                                        <Input value={formatNumberInt(totalAmount)} disabled className="w-full" />
                                    </div>
                                    <div className="px-4">
                                        <span className="mb-2 font-semibold">Monto a Reducir</span>
                                        {/* Use formatInt in INPUT */}
                                        <Input 
                                            placeholder="Ingrese monto..." 
                                            type="text"
                                            inputMode="numeric"
                                            value={montoReducirInput[prog.programa] ?? 0}
                                            onChange={(e) =>
                                                handleChangeMonto(prog.programa, e.target.value)
                                            }
                                            className="w-full" 
                                        />
                                    </div>
                                </form>
                                
                            </Card>
                            
                        </div>
                    </div>
                )
            })}
            </div>
            {!loading && (
                <Button
                    onClick={handleSubmit}
                    className="text-white"
                    style={{ backgroundColor: "#2b7fff" }}
                >
                    Procesar
                </Button>
            )}
            {loading && (
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="text-white"
                    style={{ backgroundColor: "#2b7fff" }}
                >
                    <Spinner />
                </Button>
            )}
            
        </>
    )
}


export default function InitTabs({ dataTable, dataProcess }) {

    console.log("dataProcess", dataProcess)
    console.log("dataTable", dataTable)

    // const [resultData, setResultData] = useState(null)
    // const [showResults, setShowResults] = useState(false)
    const [tab, setTab] = useState("inicial")

    const { 
        resultData, 
        setResultData, 
        showResults, 
        setShowResults
    } = useScenariosData()

    // const showResults = false

    return (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inicial" className="gap-2">
                    <span>Inicial</span>
                </TabsTrigger>
                <TabsTrigger value="escenarios" className="gap-2" disabled={!showResults}>
                    <span>Escenarios</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="inicial" className="mt-6">
      
                <InitData 
                    dataTable={dataTable} 
                    dataProcess={dataProcess} 
                    setResultData={setResultData} 
                    setShowResults={setShowResults}
                    setTab={setTab}
                />

            </TabsContent>
            <TabsContent value="escenarios" className="mt-6">

                <ResultsTabs data={resultData} />

            </TabsContent>
        </Tabs>
    );
}