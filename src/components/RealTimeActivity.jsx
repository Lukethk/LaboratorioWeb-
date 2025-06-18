import React, { useState, useEffect } from 'react';

const RealTimeActivity = ({ solicitudes, movimientos, alertas }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        generateRecentActivity();
    }, [solicitudes, movimientos, alertas]);

    const generateRecentActivity = () => {
        const activities = [];

        // Procesar solicitudes reales
        if (solicitudes && solicitudes.length > 0) {
            solicitudes.slice(0, 3).forEach((solicitud, index) => {
                const fecha = solicitud.fecha_hora_inicio || solicitud.fecha || new Date();
                const timeAgo = getTimeAgo(new Date(fecha));
                
                activities.push({
                    id: `solicitud-${solicitud.id_solicitud || index}`,
                    type: 'solicitud',
                    title: `Solicitud de ${solicitud.docente_nombre || solicitud.estudiante_nombre || 'Usuario'}`,
                    description: `${solicitud.practica_titulo || solicitud.materia_nombre || 'Práctica'} - ${solicitud.estado}`,
                    time: timeAgo,
                    priority: solicitud.estado === 'Pendiente' ? 'high' : 'normal',
                    fecha: fecha
                });
            });
        }

        // Procesar movimientos reales
        if (movimientos && movimientos.length > 0) {
            movimientos.slice(0, 3).forEach((movimiento, index) => {
                const fecha = movimiento.fecha_entregado || movimiento.fecha || new Date();
                const timeAgo = getTimeAgo(new Date(fecha));
                
                activities.push({
                    id: `movimiento-${movimiento.id_movimiento || index}`,
                    type: 'movimiento',
                    title: `${movimiento.tipo_movimiento} de ${movimiento.insumo_nombre}`,
                    description: `${movimiento.cantidad} unidades - ${movimiento.solicitante || 'Usuario'}`,
                    time: timeAgo,
                    priority: 'normal',
                    fecha: fecha
                });
            });
        }

        // Procesar alertas reales
        if (alertas && alertas.length > 0) {
            alertas.slice(0, 2).forEach((alerta, index) => {
                const fecha = alerta.fecha || new Date();
                const timeAgo = getTimeAgo(new Date(fecha));
                
                activities.push({
                    id: `alerta-${alerta.id_alerta || index}`,
                    type: 'alerta',
                    title: `Alerta de Stock: ${alerta.insumo_nombre}`,
                    description: `Stock actual: ${alerta.stock_actual} (mín: ${alerta.stock_minimo})`,
                    time: timeAgo,
                    priority: 'high',
                    fecha: fecha
                });
            });
        }

        // Ordenar por fecha (más reciente primero) y luego por prioridad
        activities.sort((a, b) => {
            // Primero por prioridad
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            
            // Luego por fecha
            return new Date(b.fecha) - new Date(a.fecha);
        });

        setRecentActivity(activities.slice(0, 8));
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 2592000) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
        
        return date.toLocaleDateString('es-ES');
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'solicitud': return 'fa-file-alt';
            case 'movimiento': return 'fa-exchange-alt';
            case 'alerta': return 'fa-exclamation-triangle';
            case 'insumo': return 'fa-flask';
            default: return 'fa-info-circle';
        }
    };

    const getActivityColor = (type, priority) => {
        if (priority === 'high') return 'text-red-600';
        
        switch (type) {
            case 'solicitud': return 'text-blue-600';
            case 'movimiento': return 'text-green-600';
            case 'alerta': return 'text-red-600';
            case 'insumo': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    const getPriorityBadge = (priority) => {
        if (priority === 'high') {
            return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Alta</span>;
        }
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Normal</span>;
    };

    const activeSolicitudes = solicitudes.filter(s => s.estado === 'Pendiente' || s.estado === 'Aprobada').length;
    
    // Calcular movimientos de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMovements = movimientos.filter(mov => {
        const movDate = new Date(mov.fecha_entregado || mov.fecha);
        movDate.setHours(0, 0, 0, 0);
        return movDate.getTime() === today.getTime();
    }).length;
    
    // Calcular alertas críticas (stock actual <= stock mínimo)
    const criticalAlerts = alertas.filter(a => {
        const stockActual = parseInt(a.stock_actual) || 0;
        const stockMinimo = parseInt(a.stock_minimo) || 0;
        return stockActual <= stockMinimo;
    }).length;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#592644]">Actividad en Tiempo Real</h3>
                <div className="text-sm text-gray-500">
                    <i className="fas fa-clock mr-1"></i>
                    {currentTime.toLocaleTimeString()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{activeSolicitudes}</div>
                    <div className="text-xs text-blue-700">Solicitudes Activas</div>
                    <div className="text-xs mt-1 text-blue-600">
                        <i className="fas fa-play-circle mr-1"></i>
                        En proceso
                    </div>
                </div>

                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{todayMovements}</div>
                    <div className="text-xs text-green-700">Movimientos Hoy</div>
                    <div className="text-xs mt-1 text-green-600">
                        <i className="fas fa-chart-line mr-1"></i>
                        Actividad
                    </div>
                </div>

                <div className="text-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{criticalAlerts}</div>
                    <div className="text-xs text-red-700">Alertas Críticas</div>
                    <div className="text-xs mt-1 text-red-600">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        Requieren atención
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-[#592644] mb-4 border-b border-gray-200 pb-2">
                    Actividad Reciente
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                            <div 
                                key={activity.id}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                                    activity.priority === 'high' ? 'border-l-4 border-red-500 bg-red-50' : ''
                                }`}
                            >
                                <div className={`bg-white p-2 rounded-full shadow-sm ${getActivityColor(activity.type, activity.priority)}`}>
                                    <i className={`fas ${getActivityIcon(activity.type)}`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {activity.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            {getPriorityBadge(activity.priority)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        <i className="fas fa-clock mr-1"></i>
                                        {activity.time}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <i className="fas fa-info-circle text-2xl mb-2"></i>
                            <p>No hay actividad reciente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RealTimeActivity; 