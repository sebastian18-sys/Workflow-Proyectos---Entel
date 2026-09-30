import { useState } from 'react';
// import { EstimationsTable } from '@/components/estimations-table';
// import { EstimationDetailView } from '@/components/estimation-detail-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EstimationsTable } from '@/components/EstimationTable/EstimationTable';
import { EstimationDetail } from '@/components/EstimationDetail/EstimationDetail';
import { ArrowLeft } from 'lucide-react';
import EstimationChart from '@/components/EstimationChart/EstimationChart';

export default function Estimaciones() {
    const [activeTab, setActiveTab] = useState('resumen');

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                <div className="space-y-6"> 
                    {/* Breadcrumb */}
                    <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                        <a 
                            href="#" 
                            title="Atrás" 
                            class="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <h2 className="text-2xl font-semibold text-[#2b7fff]">Estimaciones</h2>
                    </div>

                    {/* Tabs Resumen/Detalle */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 max-w-xs">
                                <TabsTrigger value="grafica">Gráfica</TabsTrigger>
                                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                                <TabsTrigger value="detalle">Detalle</TabsTrigger>
                            </TabsList>

                            <TabsContent value="grafica" className="space-y-6">                                
                                <EstimationChart />
                                {/* <div>Render Chart...</div> */}
                            </TabsContent>

                            <TabsContent value="resumen" className="space-y-6">
                                <EstimationsTable />
                            </TabsContent>

                            <TabsContent value="detalle" className="space-y-6">
                                <EstimationDetail />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}