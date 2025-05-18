import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const API_URL = "https://universidad-la9h.onrender.com";

const CustomTooltip = ({ title, visible, x, y }) => {
    if (!visible) return null;
    
    return (
        <>
            <style>
                {`
                    @keyframes tooltipFadeIn {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -90%);
                        }
                        to {
                            opacity: 1;
                            transform: translate(-50%, -100%);
                        }
                    }
                    
                    @keyframes arrowFadeIn {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -5px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(-50%);
                        }
                    }
                    
                    .tooltip-container {
                        animation: tooltipFadeIn 0.2s ease-out forwards;
                    }
                    
                    .tooltip-arrow {
                        animation: arrowFadeIn 0.2s ease-out forwards;
                    }
                `}
            </style>
            <div
                className="tooltip-container"
                style={{
                    position: 'fixed',
                    left: x + 'px',
                    top: (y - 5) + 'px',
                    background: 'rgba(89, 38, 68, 0.95)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    maxWidth: '300px',
                    zIndex: 99999,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    pointerEvents: 'none',
                    border: '1px solid rgba(89, 38, 68, 1)',
                }}
            >
                {title}
                <div
                    className="tooltip-arrow"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: '-9px',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid rgba(89, 38, 68, 1)',
                    }}
                />
                <div
                    className="tooltip-arrow"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: '-8px',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid rgba(89, 38, 68, 0.95)',
                    }}
                />
            </div>
        </>
    );
};

const Agenda = () => {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [tooltip, setTooltip] = useState({ visible: false, title: '', x: 0, y: 0 });

    // Cargar solicitudes aceptadas
    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await fetch(`${API_URL}/solicitudes-uso`);
                if (!response.ok) throw new Error('Error al obtener solicitudes');
                const solicitudes = await response.json();
                
                console.log('Todas las solicitudes:', solicitudes);
                
                // Filtrar solicitudes aprobadas y convertirlas en eventos
                const eventosDesolicitudes = solicitudes
                    .filter(solicitud => {
                        console.log('Estado de solicitud:', solicitud.estado);
                        return solicitud.estado?.toLowerCase() === 'aprobada';
                    })
                    .map(solicitud => {
                        console.log('Procesando solicitud completa:', solicitud);
                        
                        // Usar las fechas y horas especificadas por el docente
                        const fechaInicio = moment(solicitud.fecha_hora_inicio);
                        const fechaFin = moment(solicitud.fecha_hora_fin);
                        
                        if (!fechaInicio.isValid() || !fechaFin.isValid()) {
                            console.log('Fechas inválidas:', {
                                inicio: solicitud.fecha_hora_inicio,
                                fin: solicitud.fecha_hora_fin
                            });
                            return null;
                        }
                        
                        const fechaInicioStr = fechaInicio.format('YYYY-MM-DDTHH:mm:ss');
                        const fechaFinStr = fechaFin.format('YYYY-MM-DDTHH:mm:ss');
                        
                        console.log('Fechas procesadas:', {
                            inicio: fechaInicioStr,
                            fin: fechaFinStr
                        });
                        
                        return {
                            id: `solicitud-${solicitud.id_solicitud}`,
                            title: `${solicitud.practica_titulo || 'Práctica sin título'}`,
                            start: fechaInicioStr,
                            end: fechaFinStr,
                            color: '#592644',
                            extendedProps: {
                                isSolicitud: true,
                                solicitudId: solicitud.id_solicitud
                            }
                        };
                    });

                console.log('Eventos creados:', eventosDesolicitudes);
                setEvents(eventosDesolicitudes.filter(Boolean));
            } catch (error) {
                console.error('Error al cargar solicitudes:', error);
            }
        };

        fetchSolicitudes();
        const interval = setInterval(fetchSolicitudes, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleEventClick = async (clickInfo) => {
        try {
            setLoadingDetails(true);
            const event = clickInfo.event;
            if (event.extendedProps?.isSolicitud) {
                const res = await fetch(`${API_URL}/solicitudes-uso/${event.extendedProps.solicitudId}`);
                const data = await res.json();
                setSelectedEvent(data);
            }
        } catch (error) {
            console.error('Error obteniendo detalles:', error);
        } finally {
            setLoadingDetails(false);
        }
        setShowModal(true);
    };

    const handleEventMouseEnter = (mouseEnterInfo) => {
        const rect = mouseEnterInfo.el.getBoundingClientRect();
        setTooltip({
            visible: true,
            title: mouseEnterInfo.event.title,
            x: rect.left + (rect.width / 2),
            y: rect.top
        });
    };

    const handleEventMouseLeave = () => {
        setTooltip({ visible: false, title: '', x: 0, y: 0 });
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-60 p-8 overflow-y-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-[#592644]">Agenda de Laboratorio</h1>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
                    <style>
                        {`
                            .fc-day-today {
                                background-color: rgba(89, 38, 68, 0.1) !important;
                            }
                            .fc-day-header, .fc-day-number {
                                color: #592644 !important;
                            }
                            .fc-button-primary {
                                background-color: #592644 !important;
                                border-color: #592644 !important;
                            }
                            .fc-button-primary:hover {
                                background-color: #4a1f37 !important;
                            }
                            .fc-day-number, .fc-daygrid-day-number, .fc-col-header-cell {
                                color: #592644 !important;
                            }
                            .fc .fc-timegrid-slot-label {
                                color: #592644 !important;
                            }
                            .fc .fc-list-day-cushion {
                                background-color: rgba(89, 38, 68, 0.1) !important;
                            }
                            .fc .fc-list-event:hover td {
                                background-color: rgba(89, 38, 68, 0.1) !important;
                            }
                            .fc-direction-ltr .fc-daygrid-event.fc-event-end {
                                margin-right: 2px;
                            }
                            .fc-direction-ltr .fc-daygrid-event.fc-event-start {
                                margin-left: 2px;
                            }
                            .fc-event-main {
                                position: relative;
                            }
                            .event-content {
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                                width: 100%;
                                position: relative;
                            }
                            .tooltip-container {
                                position: fixed;
                                z-index: 99999;
                                pointer-events: none;
                            }
                            .fc-daygrid-event:hover .event-content::after,
                            .fc-timegrid-event:hover .event-content::after,
                            .fc-list-event:hover .event-content::after {
                                content: attr(data-full-title);
                                position: absolute;
                                left: 50%;
                                bottom: calc(100% + 10px);
                                transform: translateX(-50%);
                                background: rgba(89, 38, 68, 0.95);
                                color: white;
                                padding: 8px 12px;
                                border-radius: 6px;
                                font-size: 14px;
                                white-space: normal;
                                width: max-content;
                                max-width: 300px;
                                z-index: 99999;
                                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                                pointer-events: none;
                            }
                            .fc-daygrid-event:hover .event-content::before,
                            .fc-timegrid-event:hover .event-content::before,
                            .fc-list-event:hover .event-content::before {
                                content: '';
                                position: absolute;
                                left: 50%;
                                bottom: calc(100% + 4px);
                                transform: translateX(-50%);
                                border: 6px solid transparent;
                                border-top-color: rgba(89, 38, 68, 0.95);
                                z-index: 99999;
                                pointer-events: none;
                            }
                            .fc-daygrid-event,
                            .fc-timegrid-event,
                            .fc-list-event {
                                position: relative !important;
                                overflow: visible !important;
                            }
                            .fc-timegrid-event .fc-event-main {
                                padding: 2px 4px;
                                overflow: visible !important;
                            }
                            .fc-list-event-title {
                                position: relative;
                                overflow: visible !important;
                            }
                            .fc-daygrid-event-harness,
                            .fc-timegrid-event-harness {
                                overflow: visible !important;
                            }
                            .fc-event {
                                overflow: visible !important;
                            }
                        `}
                    </style>
                    <div className="calendar-container">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                            }}
                            initialView="dayGridMonth"
                            editable={false}
                            selectable={false}
                            selectMirror={false}
                            dayMaxEvents={true}
                            weekends={true}
                            events={events}
                            eventClick={handleEventClick}
                            eventMouseEnter={handleEventMouseEnter}
                            eventMouseLeave={handleEventMouseLeave}
                            locale="es"
                            buttonText={{
                                today: 'Hoy',
                                month: 'Mes',
                                week: 'Semana',
                                day: 'Día',
                                list: 'Lista'
                            }}
                            titleFormat={{
                                month: 'long',
                                year: 'numeric'
                            }}
                            height="auto"
                            contentHeight="auto"
                            eventClassNames="transition-all duration-300 hover:shadow-md"
                            slotLabelFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }}
                            scrollTime="07:00:00"
                            slotMinTime="07:00:00"
                            slotMaxTime="22:00:00"
                            allDaySlot={false}
                            slotEventOverlap={false}
                            eventMaxStack={3}
                            slotDuration="00:30:00"
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }}
                            expandRows={true}
                            stickyHeaderDates={true}
                            eventDisplay="block"
                            views={{
                                timeGrid: {
                                    eventMinHeight: 30,
                                    dayMaxEvents: false
                                },
                                dayGrid: {
                                    dayMaxEvents: 3
                                },
                                dayGridMonth: {
                                    eventTimeFormat: {
                                        hour: undefined,
                                        minute: undefined
                                    }
                                }
                            }}
                            eventContent={(eventInfo) => {
                                const title = eventInfo.event.title;
                                return {
                                    html: `
                                        <div class="event-content" data-full-title="${title}">
                                            <span>${title}</span>
                                        </div>
                                    `
                                };
                            }}
                        />
                        <CustomTooltip {...tooltip} />
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 md:p-10 rounded-3xl w-[95%] max-w-4xl max-h-[90%] overflow-auto border-2 border-[#592644]">
                            {loadingDetails ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#592644]"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-[#592644]">
                                            Detalles de la Solicitud
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setShowModal(false);
                                                setSelectedEvent(null);
                                            }}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {selectedEvent && (
                                        <>
                                            <div className="flex flex-wrap gap-4 justify-center mb-8">
                                                <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                                    <span className="text-gray-700">Estudiantes</span>
                                                    <span className="font-bold text-[#592644]">{selectedEvent.numero_estudiantes}</span>
                                                </div>
                                                <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                                    <span className="text-gray-700">Grupos</span>
                                                    <span className="font-bold text-[#592644]">{selectedEvent.numero_grupos}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                <div>
                                                    <h4 className="font-bold mb-2 text-[#592644]">Información General</h4>
                                                    <div className="bg-gray-100 p-4 rounded-2xl space-y-2">
                                                        <p><span className="font-semibold">Docente:</span> {selectedEvent.docente_nombre}</p>
                                                        <p><span className="font-semibold">Práctica:</span> {selectedEvent.practica_titulo}</p>
                                                        <p><span className="font-semibold">Laboratorio:</span> {selectedEvent.laboratorio_nombre}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold mb-2 text-[#592644]">Horario</h4>
                                                    <div className="bg-gray-100 p-4 rounded-2xl space-y-2">
                                                        <p><span className="font-semibold">Inicio:</span> {moment(selectedEvent.fecha_hora_inicio).format('DD/MM/YYYY HH:mm')}</p>
                                                        <p><span className="font-semibold">Fin:</span> {moment(selectedEvent.fecha_hora_fin).format('DD/MM/YYYY HH:mm')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedEvent.insumos && selectedEvent.insumos.length > 0 && (
                                                <div className="mt-8">
                                                    <h4 className="font-bold mb-2 text-[#592644]">Insumos Requeridos</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {selectedEvent.insumos.map((insumo, index) => (
                                                            <div key={index} className="bg-gray-100 p-4 rounded-2xl">
                                                                <p className="font-semibold mb-2">{insumo.insumo_nombre}</p>
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    <p><span className="text-gray-600">Cantidad:</span> {insumo.cantidad_total}</p>
                                                                    <p><span className="text-gray-600">Unidad:</span> {insumo.unidad_medida}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedEvent.observaciones && (
                                                <div className="mt-8">
                                                    <h4 className="font-bold mb-2 text-[#592644]">Observación:</h4>
                                                    <div className="bg-gray-100 p-4 rounded-2xl text-gray-700">
                                                        {selectedEvent.observaciones}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-8 flex justify-center">
                                                <button
                                                    onClick={() => {
                                                        setShowModal(false);
                                                        setSelectedEvent(null);
                                                    }}
                                                    className="bg-gray-500 text-white py-2 px-6 rounded-lg shadow-md hover:bg-gray-600 transition-colors"
                                                >
                                                    Cerrar
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Agenda; 