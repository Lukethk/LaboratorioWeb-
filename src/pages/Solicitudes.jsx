import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { PencilIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import FormularioPDF from '../components/FormularioPDF';
import axios from 'axios';
import { EyeIcon } from "lucide-react";
const API_URL = "https://universidad-la9h.onrender.com";




const Solicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [filter, setFilter] = useState("Pendientes");
    const [modalOpen, setModalOpen] = useState(false);
    const [descargarPDF, setDescargarPDF] = useState(false);
    const [formData, setFormData] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [estadoPendiente, setEstadoPendiente] = useState(null); // { solicitud, nuevoEstado }
    const [selectedSolicitud, setSelectedSolicitud] = useState({
        it: [] // Array vacío, para empezar
    });

    const [showModal, setShowModal] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSolicitud, setEditSolicitud] = useState({
        id: null,
        nombre: "",
        estado: "Pendiente",
    });
    const [header, setHeader] = useState({
        unidad: "",
        responsable: "",
        fecha: "",
    });
    const [items, setItems] = useState([]);

    const fetchSolicitudes = async () => {
        try {
            const res = await fetch(`${API_URL}/solicitudes`);
            if (!res.ok) throw new Error("Error al obtener solicitudes");
            setSolicitudes(await res.json());
        } catch (e) {
            console.error(e);
        }
    };
    const handleViewDetails = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setShowModal(true);
    };



    const fetchInsumos = async () => {
        try {
            const res = await fetch(`${API_URL}/Insumos`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            setInsumos(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
        fetchInsumos();
    }, []);

    const getEstado = (i) => {
        const actual = parseInt(i.stock_actual);
        const minimo = parseInt(i.stock_minimo);
        if (actual === 0) return "Sin stock";
        if (actual <= minimo) return "Stock Bajo";
        return "Disponible";
    };

    const handleFilter = (s) => {
        if (filter === "Pendientes") return s.estado === "Pendiente";
        if (filter === "Completas") return s.estado === "Completada";

        return true;
    };

    const openCreateModal = () => {
        const criticos = insumos.filter((i) => getEstado(i) === "Stock Bajo");
        setItems(
            criticos.map((i) => ({
                id: i.id_insumo,
                nombre: i.nombre,
                cantidad: i.stock_actual,
                precio: 0,
                valorTotal: 0,
            }))
        );
        setHeader({ unidad: "", responsable: "", fecha: "" });
        setModalOpen(true);
    };

    const handlePrecioChange = (idx, precio) => {
        setItems((curr) => {
            const next = [...curr];
            next[idx].precio = parseFloat(precio) || 0;
            next[idx].valorTotal = next[idx].cantidad * next[idx].precio;
            return next;
        });
    };

    const handleCreatePDF = async (e) => {
        e.preventDefault();

        const solicitudData = {
            nombre_solicitud: header.unidad,
            cantidad_solicitada: items.reduce((acc, item) => acc + item.cantidad, 0),
            estado: "Pendiente",
            observaciones: header.responsable || '',
        };

        try {
            const response = await axios.post(`${API_URL}/solicitudes`, solicitudData);

            if (response.status === 201) {
                // Guardamos los datos para el PDF y activamos la descarga
                setFormData({
                    unidadSolicitante: header.unidadSolicitante,
                    fecha: header.fecha,
                    centroCosto: header.centroCosto,
                    responsable: header.responsable,
                    codigoInversion: header.codigoInversion,
                    justificacion: header.justificacion,
                    observaciones: header.observaciones,
                    items: items.map(it => ({
                        cantidad: it.cantidad,
                        unidad: it.unidad || '',
                        descripcion: it.nombre,
                        pu: it.precio,
                        total: it.valorTotal,
                    })),
                    valorTotal: header.valorTotal,
                    valorLiteral: header.valorLiteral,
                });

                setDescargarPDF(true);
                setModalOpen(false); // Cierra el modal
            } else {
                alert("Error al guardar la solicitud.");
            }
        } catch (error) {
            console.error("Error al enviar la solicitud a la API:", error);
            alert("Hubo un problema al guardar la solicitud. Por favor, intentalo nuevamente.");
        }
    };
    useEffect(() => {
        if (descargarPDF && formData) {
            const doc = <FormularioPDF data={formData} />;
            const blobPromise = pdf(doc).toBlob();

            blobPromise.then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Solicitud_${formData.fecha || 'sin_fecha'}.pdf`;
                a.click();
                URL.revokeObjectURL(url);

                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });

            setDescargarPDF(false);
        }
    }, [descargarPDF, formData]);





    const handleEdit = (s) => {
        setEditSolicitud({
            id: s.id_solicitud,
            nombre: s.nombre_solicitud,
            estado: s.estado,
        });
        setEditModalOpen(true);
    };

    const handleQuitarInsumo = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };


    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/solicitudes/${editSolicitud.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_solicitud: editSolicitud.nombre,
                    estado: editSolicitud.estado,
                }),
            });

            if (!response.ok) {
                throw new Error("Error al actualizar solicitud");
            }

            setEditModalOpen(false);
            fetchSolicitudes();
        } catch (error) {
            console.error("Error al actualizar solicitud", error);
            alert(error.message);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen">
            <Sidebar className="hidden lg:block" />

            <div className="lg:ml-64 flex-1 p-4 bg-white overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Solicitudes de Insumos</h1>
                    <button
                        onClick={openCreateModal}
                        className="px-5 py-3 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d] transition text-sm md:text-basep-4 bg-[#592644] text-white rounded-full hover:bg-[#4b1f3d] transition"
                    >
                        Crear una Solicitud
                    </button>


                </div>

                <div className="flex gap-2 mb-8">
                    {["Pendientes", "Completas"].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setFilter(opt)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === opt
                                ? "bg-[#4b1f3d] text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {solicitudes.filter(handleFilter).length === 0 && filter === "Historial" ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-center p-10 border border-dashed border-[#592644] rounded-lg bg-[#fdf4f8] shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#592644] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h1a4 4 0 014 4v2m-6-4v-2a2 2 0 00-2-2h-1a2 2 0 00-2 2v2" />
                            </svg>

                        </div>
                    ) : (
                        solicitudes.filter(handleFilter).map((s) => (
                            <div key={s.id_solicitud} className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-[#592644] transition-all transform hover:scale-105 hover:shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-[#592644] truncate">{s.nombre_solicitud}</h2>
                                    <span
                                        className={`text-xs font-semibold ${s.estado === "Pendiente"
                                            ? "text-yellow-500"
                                            : s.estado === "Completada"
                                                ? "text-green-500"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        {s.estado}
                                    </span>
                                </div>
                                <p className="text-gray-700 text-sm mb-4 truncate">{s.observaciones}</p>
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => handleViewDetails(s)}
                                        className="text-sm px-2 py-1 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d] transition duration-300"
                                    >
                                        Ver Detalles
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <label className="text-sm font-medium text-gray-700 m-0">Completado?</label>
                                        <input
                                            type="checkbox"
                                            checked={s.estado === "Completada"}
                                            onChange={(e) => {
                                                const nuevoEstado = e.target.checked ? "Completada" : "Pendiente";
                                                setEstadoPendiente({ solicitud: s, nuevoEstado });
                                                setConfirmModalOpen(true);
                                            }}
                                            className="form-checkbox text-[#592644] rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {confirmModalOpen && estadoPendiente && (
                    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                            <h2 className="text-xl font-semibold mb-4">Confirmar cambio de estado</h2>
                            <p className="mb-6">¿Estás seguro que deseas marcar esta solicitud como <strong>{estadoPendiente.nuevoEstado}</strong>?</p>

                            <div className="flex justify-end space-x-2">
                                <button
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    onClick={() => {
                                        setConfirmModalOpen(false);
                                        setEstadoPendiente(null);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="px-4 py-2 bg-[#592644] text-white rounded hover:bg-[#4b1f3d]"
                                    onClick={async () => {
                                        try {
                                            const { solicitud, nuevoEstado } = estadoPendiente;
                                            const response = await fetch(`${API_URL}/solicitudes/${solicitud.id_solicitud}`, {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    nombre_solicitud: solicitud.nombre_solicitud,
                                                    estado: nuevoEstado,
                                                }),
                                            });

                                            if (!response.ok) throw new Error("Error al actualizar solicitud");

                                            fetchSolicitudes(); // refresca la lista
                                            setConfirmModalOpen(false);
                                            setEstadoPendiente(null);
                                        } catch (error) {
                                            console.error("Error al cambiar estado:", error);
                                            alert("Error al actualizar estado.");
                                        }
                                    }}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {showModal && selectedSolicitud && (
                    <div className="fixed inset-0 -opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-96 border-4 border-[#592644]">
                            <h3 className="text-2xl font-semibold mb-4">Detalles de la Solicitud</h3>
                            <p><strong>Nombre Solicitud:</strong> {selectedSolicitud.nombre_solicitud}</p>
                            <p><strong>Cantidad Solicitada:</strong> {selectedSolicitud.cantidad_solicitada}</p>
                            <p><strong>Estado:</strong> {selectedSolicitud.estado}</p>
                            <p><strong>Observaciones:</strong> {selectedSolicitud.observaciones}</p>

                            <h4 className="mt-4 text-xl font-semibold">Insumos Solicitados</h4>
                            <div className="mt-2">
                                {Array.isArray(selectedSolicitud.it) && selectedSolicitud.it.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-2 py-1 border">Nombre</th>
                                                <th className="px-2 py-1 border">Cantidad</th>
                                                <th className="px-2 py-1 border">Precio Estimado</th>
                                                <th className="px-2 py-1 border">Valor Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSolicitud.it.map((it, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-2 py-1 border">{it.nombre || "Insumo sin nombre"}</td>
                                                    <td className="px-2 py-1 border text-center">{it.cantidad ?? "?"}</td>
                                                    <td className="px-2 py-1 border text-center">{it.precio ?? "?"}</td>
                                                    <td className="px-2 py-1 border text-right">{(it.total ?? 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No se han solicitado insumos.</p>
                                )}
                            </div>



                            <button
                                onClick={() => setShowModal(false)}
                                className="mt-6 w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                            >
                                Cerrar Detalles
                            </button>
                        </div>
                    </div>
                )}

            </div>


            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#59264426] z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Nueva Solicitud de Insumos</h2>
                            <button onClick={() => setModalOpen(false)}>
                                <XMarkIcon className="w-6 h-6 text-gray-700 hover:text-red-500 transition" />
                            </button>
                        </div>

                        <form
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                            onSubmit={handleCreatePDF}
                        >
                            {[{ label: "Unidad Solicitante", key: "unidad", type: "text" },
                            { label: "Responsable", key: "responsable", type: "text" },
                            { label: "Fecha", key: "fecha", type: "date" }].map(({ label, key, type }) => (
                                <div key={key} className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        value={header[key]}
                                        onChange={(e) => setHeader((h) => ({ ...h, [key]: e.target.value }))}
                                        className="w-full border p-2 rounded"
                                        required
                                    />
                                </div>
                            ))}

                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Insumos Críticos</label>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-2 py-1 border">Nombre</th>
                                                <th className="px-2 py-1 border">Cantidad</th>
                                                <th className="px-2 py-1 border">Precio Estimado</th>
                                                <th className="px-2 py-1 border">Valor Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((it, idx) => (
                                                <tr key={it.id} className="hover:bg-gray-50">
                                                    <td className="px-2 py-1 border">{it.nombre}</td>
                                                    <td className="px-2 py-1 border text-center">{it.cantidad}</td>
                                                    <td className="px-2 py-1 border">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full border p-1 rounded text-right"
                                                            value={it.precio}
                                                            onChange={(e) => handlePrecioChange(idx, e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 border text-right">{it.valorTotal.toFixed(2)}</td>
                                                    <td className="px-2 py-1 border">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuitarInsumo(idx)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <XMarkIcon className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="col-span-full flex justify-end space-x-2 mt-4">
                                {/* Botón Cancelar */}
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>

                                {/* ⬇️ Sustituye tu antiguo <PDFDownloadLink> por este bloque ⬇️ */}
                                {items.length > 0 && (
                                    <PDFDownloadLink
                                        key={items.map(it => it.id).join('-')}      // fuerza que se desmonte/remonte
                                        document={
                                            <FormularioPDF
                                                data={{
                                                    unidadSolicitante: header.unidadSolicitante,
                                                    fecha: header.fecha,
                                                    centroCosto: header.centroCosto,
                                                    responsable: header.responsable,
                                                    codigoInversion: header.codigoInversion,
                                                    justificacion: header.justificacion,
                                                    observaciones: header.observaciones,
                                                    items: items.map(it => ({
                                                        cantidad: it.cantidad,
                                                        unidad: it.unidad || '',
                                                        descripcion: it.nombre,
                                                        pu: it.precio,
                                                        total: it.valorTotal,
                                                    })),
                                                    valorTotal: header.valorTotal,
                                                    valorLiteral: header.valorLiteral,
                                                }}
                                            />
                                        }
                                        fileName={`Solicitud_${header.fecha || 'sin_fecha'}.pdf`}
                                    >
                                        {({ loading }) => (
                                            <button
                                                type="submit"            
                                                className="px-4 py-2 bg-[#592644] text-white rounded hover:bg-[#4b1f3d]"
                                            >
                                                {loading ? 'Generando…' : 'Guardar y Exportar PDF'}
                                            </button>
                                        )}
                                    </PDFDownloadLink>
                                )}
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {editModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#59264426] z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Editar Solicitud</h2>
                            <button onClick={() => setEditModalOpen(false)}>
                                <XMarkIcon className="w-6 h-6 text-gray-700 hover:text-red-500 transition" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nombre de la solicitud"
                                value={editSolicitud.nombre}
                                onChange={(e) => setEditSolicitud((s) => ({ ...s, nombre: e.target.value }))}
                                className="w-full border p-2 rounded"
                            />
                            <select
                                className="w-full border p-2 rounded"
                                value={editSolicitud.estado}
                                onChange={(e) => setEditSolicitud((s) => ({ ...s, estado: e.target.value }))}
                                required
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Completada">Completada</option>

                            </select>
                            <button
                                type="submit"
                                className="w-full bg-[#592644] text-white py-2 rounded"
                            >
                                Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Solicitudes;