import React from 'react';

const ExecutiveSummary = ({ insumos, solicitudes, alertas, movimientos }) => {
    const totalInsumos = insumos.length;
    const stockCritico = insumos.filter(insumo => {
        const stockActual = parseInt(insumo.stock_actual);
        const stockMinimo = parseInt(insumo.stock_minimo);
        return stockActual <= stockMinimo;
    }).length;

    const solicitudesCompletadas = solicitudes.filter(s => s.estado === 'Completada').length;
    const solicitudesPendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const solicitudesAprobadas = solicitudes.filter(s => s.estado === 'Aprobada').length;
    const solicitudesRechazadas = solicitudes.filter(s => s.estado === 'Rechazada').length;

    const tasaAprobacion = solicitudes.length > 0 ? ((solicitudesAprobadas + solicitudesCompletadas) / solicitudes.length * 100).toFixed(1) : 0;
    const tasaCompletacion = solicitudes.length > 0 ? (solicitudesCompletadas / solicitudes.length * 100).toFixed(1) : 0;

    const prestamos = movimientos.filter(m => m.tipo_movimiento === 'PRESTAMO').length;
    const devoluciones = movimientos.filter(m => m.tipo_movimiento === 'DEVOLUCION').length;
    const entradas = movimientos.filter(m => m.tipo_movimiento === 'ENTRADA').length;

    const eficienciaStock = totalInsumos > 0 ? ((totalInsumos - stockCritico) / totalInsumos * 100).toFixed(1) : 0;

    const alertasCriticas = alertas.filter(a => {
        const stockActual = parseInt(a.stock_actual);
        const stockMinimo = parseInt(a.stock_minimo);
        return stockActual <= stockMinimo;
    }).length;

    const alertasAdvertencia = alertas.filter(a => {
        const stockActual = parseInt(a.stock_actual);
        const stockMinimo = parseInt(a.stock_minimo);
        const stockMaximo = parseInt(a.stock_maximo);
        return stockActual > stockMinimo && stockActual <= (stockMinimo * 1.2);
    }).length;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-[#592644] mb-6">Resumen Ejecutivo</h3>
            
            <div className="space-y-4">
                <h4 className="font-semibold text-[#592644] border-b border-gray-200 pb-2">
                    Estado del Inventario
                </h4>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total de Insumos:</span>
                        <span className="font-semibold">{totalInsumos}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Stock Crítico:</span>
                        <span className="font-semibold text-red-600">{stockCritico}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tipos Únicos:</span>
                        <span className="font-semibold">{[...new Set(insumos.map(i => i.tipo))].length}</span>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Salud del Stock</span>
                        <span>{eficienciaStock}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                                eficienciaStock >= 90 ? 'bg-green-500' : 
                                eficienciaStock >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${eficienciaStock}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <h4 className="font-semibold text-[#592644] border-b border-gray-200 pb-2">
                    Análisis de Actividad
                </h4>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Solicitudes Completadas:</span>
                        <span className="font-semibold text-green-600">{solicitudesCompletadas}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tasa de Completación:</span>
                        <span className="font-semibold">{tasaCompletacion}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Préstamos Realizados:</span>
                        <span className="font-semibold">{prestamos}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Devoluciones:</span>
                        <span className="font-semibold text-blue-600">{devoluciones}</span>
                    </div>
                </div>

                <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Alertas Activas</h5>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-red-600">Críticas:</span>
                            <span className="font-semibold text-red-600">{alertasCriticas}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-yellow-600">Advertencias:</span>
                            <span className="font-semibold text-yellow-600">{alertasAdvertencia}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveSummary; 