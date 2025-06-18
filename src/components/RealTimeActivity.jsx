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

        solicitudes.slice(0, 3).forEach((solicitud, index) => {
            activities.push({
                id: `solicitud-${index}`,
                type: 'solicitud',
                title: `Solicitud ${solicitud.id || index + 1}`,
                description: `Estado: ${solicitud.estado}`,
                time: 'Reciente',
                priority: solicitud.estado === 'Pendiente' ? 'high' : 'normal'
            });
        });

        movimientos.slice(0, 3).forEach((movimiento, index) => {
            activities.push({
                id: `movimiento-${index}`,
                type: 'movimiento',
                title: `${movimiento.tipo_movimiento} de ${movimiento.insumo_nombre}`,
                description: `${movimiento.cantidad} unidades`,
                time: 'Reciente',
                priority: 'normal'
            });
        });

        alertas.slice(0, 2).forEach((alerta, index) => {
            activities.push({
                id: `alerta-${index}`,
                type: 'alerta',
                title: `Alerta de Stock: ${alerta.insumo_nombre}`,
                description: `Stock actual: ${alerta.stock_actual}`,
                time: 'Reciente',
                priority: 'high'
            });
        });

        activities.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            return 0;
        });

        setRecentActivity(activities.slice(0, 8));
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
    const todayMovements = movimientos.length;
    const criticalAlerts = alertas.filter(a => {
        const stockActual = parseInt(a.stock_actual);
        const stockMinimo = parseInt(a.stock_minimo);
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