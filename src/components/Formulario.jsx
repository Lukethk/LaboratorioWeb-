import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import FormularioPDF from './FormularioPDF';
import { insumosCriticos } from './data';

export default function Formulario() {
    const [precios, setPrecios] = useState(insumosCriticos.map(() => ''));

    const handlePrecioChange = (index, value) => {
        const updated = [...precios];
        updated[index] = value;
        setPrecios(updated);
    };

    const calcularTotal = (cantidad, precio) => {
        const parsed = parseFloat(precio);
        return isNaN(parsed) ? 0 : cantidad * parsed;
    };

    const montoTotal = insumosCriticos.reduce((acc, item, i) => {
        return acc + calcularTotal(item.cantidad, precios[i]);
    }, 0);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Solicitud de Adquisición</h1>
            <table className="w-full text-sm border border-black">
                <thead className="bg-gray-200">
                <tr>
                    <th className="border px-2">Cant.</th>
                    <th className="border px-2">Unidad</th>
                    <th className="border px-2">Descripción</th>
                    <th className="border px-2">P/U Estimado (Bs)</th>
                    <th className="border px-2">Valor Total (Bs)</th>
                </tr>
                </thead>
                <tbody>
                {insumosCriticos.map((item, i) => (
                    <tr key={i}>
                        <td className="border px-2 text-center">{item.cantidad}</td>
                        <td className="border px-2 text-center">{item.unidad}</td>
                        <td className="border px-2">{item.descripcion}</td>
                        <td className="border px-2">
                            <input
                                type="number"
                                value={precios[i]}
                                onChange={(e) => handlePrecioChange(i, e.target.value)}
                                className="w-full border px-1"
                            />
                        </td>
                        <td className="border px-2 text-right">{calcularTotal(item.cantidad, precios[i]).toFixed(2)}</td>
                    </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                    <td colSpan="4" className="text-right px-2 border">TOTAL:</td>
                    <td className="text-right px-2 border">{montoTotal.toFixed(2)} Bs</td>
                </tr>
                </tbody>
            </table>

            <div className="mt-4">
                <PDFDownloadLink
                    document={<FormularioPDF insumos={insumosCriticos} precios={precios} />}
                    fileName="solicitud_adquisicion.pdf"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Descargar PDF
                </PDFDownloadLink>
            </div>
        </div>
    );
}
