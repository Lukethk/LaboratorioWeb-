import React from 'react';
import { jsPDF } from 'jspdf';
import moment from 'moment';
import { useNotifications } from '../context/NotificationContext';

const FormularioEstudiantes = ({ solicitud }) => {
    const { addNotification } = useNotifications();

    const handleImprimirFormulario = async () => {
        try {
            const tableHtml = `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f8f9fa;">Campo</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f8f9fa;">Valor</th>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Nombre del Estudiante</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${solicitud.estudiante_nombre}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Materia</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${solicitud.materia_nombre}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Estado</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${solicitud.estado}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Fecha de Inicio</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${moment(solicitud.fecha_hora_inicio).format('DD/MM/YYYY HH:mm')}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Fecha de Fin</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${moment(solicitud.fecha_hora_fin).format('DD/MM/YYYY HH:mm')}</td>
                    </tr>
                    ${solicitud.insumos && solicitud.insumos.length > 0 ? `
                        <tr>
                            <td colspan="2" style="border: 1px solid #ddd; padding: 8px; background-color: #f8f9fa; font-weight: bold;">Insumos Requeridos</td>
                        </tr>
                        ${solicitud.insumos.map(insumo => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">${insumo.insumo_nombre}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${insumo.cantidad_solicitada} ${insumo.unidad_medida}</td>
                            </tr>
                        `).join('')}
                    ` : ''}
                </table>
            `;

            // Crear un PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Agregar el contenido al PDF
            pdf.html(tableHtml, {
                callback: function(pdf) {
                    // Abrir el PDF en una nueva ventana
                    window.open(pdf.output('bloburl'), '_blank');
                },
                x: 10,
                y: 10,
                html2canvas: {
                    scale: 0.7
                }
            });

        } catch (error) {
            console.error('Error al generar el PDF:', error);
            
            addNotification({
                type: 'error',
                title: 'Error al generar el formulario',
                message: 'Hubo un error al generar el formulario. Por favor, intente nuevamente.'
            });
        }
    };

    return (
        <button
            onClick={handleImprimirFormulario}
            className="px-3 py-1.5 bg-[#592644] text-white rounded-lg hover:bg-[#7a3a5d] transition-colors text-sm font-medium flex items-center"
        >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Formulario
        </button>
    );
};

export default FormularioEstudiantes; 