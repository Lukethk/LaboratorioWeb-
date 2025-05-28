import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSidebar } from "../context/SidebarContext";

moment.locale('es');
const localizer = momentLocalizer(moment);

const API_URL = "https://universidad-la9h.onrender.com";

const CustomDateHeader = ({ label }) => (
    <span style={{ fontWeight: 'bold', fontSize: '1em' }}>{label}</span>
);

const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToToday = () => toolbar.onNavigate('TODAY');
    const goToMonth = (e) => {
        const month = parseInt(e.target.value, 10);
        const year = toolbar.date.getFullYear();
        toolbar.onNavigate('DATE', new Date(year, month, 1));
    };
    const setView = (view) => toolbar.onView(view);

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <button onClick={goToBack} className="calendar-toolbar-btn px-2 py-1 rounded bg-[#592644] text-white">Anterior</button>
            <button onClick={goToToday} className="calendar-toolbar-btn px-2 py-1 rounded bg-[#592644] text-white">Hoy</button>
            <button onClick={goToNext} className="calendar-toolbar-btn px-2 py-1 rounded bg-[#592644] text-white">Siguiente</button>
            <span className="mx-2 font-bold text-[#592644]">
                {meses[toolbar.date.getMonth()]} {toolbar.date.getFullYear()}
            </span>
            <select
                value={toolbar.date.getMonth()}
                onChange={goToMonth}
                className="border rounded px-2 py-1 text-[#592644]"
            >
                {meses.map((mes, idx) => (
                    <option key={mes} value={idx}>{mes}</option>
                ))}
            </select>
            <div className="ml-4 flex gap-2">
                <button onClick={() => setView('day')} className={`calendar-toolbar-btn px-2 py-1 rounded ${toolbar.view === 'day' ? 'bg-[#592644] text-white' : 'bg-gray-200 text-[#592644]'}`}>Día</button>
                <button onClick={() => setView('week')} className={`calendar-toolbar-btn px-2 py-1 rounded ${toolbar.view === 'week' ? 'bg-[#592644] text-white' : 'bg-gray-200 text-[#592644]'}`}>Semana</button>
                <button onClick={() => setView('month')} className={`calendar-toolbar-btn px-2 py-1 rounded ${toolbar.view === 'month' ? 'bg-[#592644] text-white' : 'bg-gray-200 text-[#592644]'}`}>Mes</button>
                <button onClick={() => setView('agenda')} className={`calendar-toolbar-btn px-2 py-1 rounded ${toolbar.view === 'agenda' ? 'bg-[#592644] text-white' : 'bg-gray-200 text-[#592644]'}`}>Lista</button>
            </div>
        </div>
    );
};

const Agenda = () => {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('week');
    const { isSidebarOpen } = useSidebar();

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await fetch(`${API_URL}/solicitudes-uso`);
                if (!response.ok) throw new Error('Error al obtener solicitudes');
                const solicitudes = await response.json();

                // Filtrar solicitudes aprobadas y convertirlas en eventos para react-big-calendar
                const eventosDesolicitudes = solicitudes
                    .filter(solicitud => solicitud.estado?.toLowerCase() === 'aprobada')
                    .map(solicitud => {
                        const fechaInicio = moment(solicitud.fecha_hora_inicio);
                        const fechaFin = moment(solicitud.fecha_hora_fin);
                        if (!fechaInicio.isValid() || !fechaFin.isValid()) return null;
                        return {
                            id: `solicitud-${solicitud.id_solicitud}`,
                            title: `${solicitud.practica_titulo || 'Práctica sin título'}`,
                            start: fechaInicio.toDate(),
                            end: fechaFin.toDate(),
                            resource: solicitud
                        };
                    });
                setEvents(eventosDesolicitudes.filter(Boolean));
            } catch (error) {
                console.error('Error al cargar solicitudes:', error);
            }
        };
        fetchSolicitudes();
        const interval = setInterval(fetchSolicitudes, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSelectEvent = async (event) => {
        try {
            setLoadingDetails(true);
            const solicitud = event.resource;
            if (solicitud && solicitud.id_solicitud) {
                const res = await fetch(`${API_URL}/solicitudes-uso/${solicitud.id_solicitud}`);
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

    // Eliminar la casilla en blanco debajo de los días (ajuste de estilos)
    const customStyles = `
        .rbc-header { padding-bottom: 4px !important; }
        .calendar-toolbar-btn:active {
            transform: scale(0.96);
            transition: transform 0.1s;
        }
    `;

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-[#592644]">Agenda de Laboratorio</h1>
                    </div>
                </div>
                <style>{customStyles}</style>
                <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
                    <Calendar
                        localizer={localizer}
                        culture="es"
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 700 }}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="week"
                        step={30}
                        timeslots={1}
                        min={new Date(0, 0, 0, 7, 0)}
                        max={new Date(0, 0, 0, 22, 0)}
                        onSelectEvent={handleSelectEvent}
                        messages={{
                            week: 'Semana',
                            day: 'Día',
                            month: 'Mes',
                            agenda: 'Lista',
                            today: 'Hoy',
                            previous: 'Anterior',
                            next: 'Siguiente',
                            date: 'Fecha',
                            time: 'Hora',
                            event: 'Evento',
                            allDay: 'Todo el día',
                            noEventsInRange: 'No hay eventos en este rango.',
                            showMore: total => `+ Ver ${total} más`
                        }}
                        formats={{
                            weekdayFormat: (date, culture, localizer) =>
                                localizer.format(date, 'dddd', culture),
                            dayFormat: (date, culture, localizer) =>
                                localizer.format(date, 'D', culture),
                            monthHeaderFormat: (date, culture, localizer) =>
                                localizer.format(date, 'MMMM YYYY', culture),
                            dayHeaderFormat: (date, culture, localizer) =>
                                localizer.format(date, 'dddd D', culture),
                            agendaDateFormat: (date, culture, localizer) =>
                                localizer.format(date, 'dddd D MMMM', culture),
                        }}
                        components={{
                            toolbar: CustomToolbar,
                            week: { header: CustomDateHeader },
                            day: { header: CustomDateHeader }
                        }}
                        eventPropGetter={(event) => ({
                            style: {
                                backgroundColor: '#592644',
                                color: 'white',
                                borderRadius: '6px',
                                border: 'none',
                                opacity: 0.9,
                                height: 'auto',
                                minHeight: '25px',
                                padding: '2px 4px',
                                fontSize: '0.9em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }
                        })}
                        date={currentDate}
                        onNavigate={date => setCurrentDate(date)}
                        view={currentView}
                        onView={view => setCurrentView(view)}
                        dayLayoutAlgorithm="no-overlap"
                    />
                </div>
                {showModal && selectedEvent && (
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Agenda;