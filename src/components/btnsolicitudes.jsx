import React, { useState } from "react";

const Solicitudes = () => {
    const [showModal, setShowModal] = useState(false);
    const [nombreSolicitud, setNombreSolicitud] = useState("");
    const [cantidadSolicitada, setCantidadSolicitada] = useState(0);
    const [estado, setEstado] = useState("Pendiente");
    const [observaciones, setObservaciones] = useState("");
    const [solicitudes, setSolicitudes] = useState([]);

    const createSolicitud = async () => {
        try {
            const response = await fetch("http://localhost:3000/solicitudes-uso", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_solicitud: nombreSolicitud,
                    cantidad_solicitada: cantidadSolicitada,
                    estado,
                    observaciones,
                }),
            });

            if (response.ok) {
                const newSolicitud = await response.json();
                setSolicitudes((prev) => [...prev, newSolicitud]);
                setShowModal(false);

                setNombreSolicitud("");
                setCantidadSolicitada(0);
                setEstado("Pendiente");
                setObservaciones("");
            } else {
                console.error("Error al crear solicitud");
            }
        } catch (e) {
            console.error("Error al crear solicitud:", e);
        }
    };

    return (
        <div>
            <button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg mb-6"
            >
                + Agregar Solicitud
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                        <h2 className="text-xl font-bold mb-4">Crear Solicitud</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Nombre de la solicitud</label>
                            <input
                                type="text"
                                value={nombreSolicitud}
                                onChange={(e) => setNombreSolicitud(e.target.value)}
                                className="border rounded p-2 w-full"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Cantidad solicitada</label>
                            <input
                                type="number"
                                value={cantidadSolicitada}
                                onChange={(e) => setCantidadSolicitada(e.target.value)}
                                className="border rounded p-2 w-full"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Estado</label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="border rounded p-2 w-full"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Rechazada">Rechazada</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Observaciones</label>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className="border rounded p-2 w-full"
                                rows="3"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-gray-400 hover:bg-gray-500 text-white py-1 px-4 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createSolicitud}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-lg"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                {solicitudes.map((solicitud) => (
                    <div key={solicitud.id_solicitud}>
                        <h3>{solicitud.nombre_solicitud}</h3>
                        <p>Cantidad solicitada: {solicitud.cantidad_solicitada}</p>
                        <p>Estado: {solicitud.estado}</p>
                        <p>Observaciones: {solicitud.observaciones}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Solicitudes;
