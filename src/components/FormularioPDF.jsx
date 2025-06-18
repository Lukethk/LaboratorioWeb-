import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';

const logoSrc = 'https://th.bing.com/th/id/OIP.ZeLiHYRsdGEpRwkej2ijWQAAAA?cb=iwc1&rs=1&pid=ImgDetMain';

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    innerBox: {
        border: '2px solid black',
        padding: 15,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        width: 120, // como tu clase "w-32"
        height: 40,
        objectFit: 'contain',
    },
    headerText: {
        flex: 1,
        textAlign: 'left',
    },
    title: { fontSize: 12, fontWeight: 'bold' },
    subtitle: { fontSize: 10, marginTop: 2, textTransform: 'uppercase' },

    section: { marginVertical: 6 },
    row: { flexDirection: 'row', marginBottom: 3 },
    label: { width: '35%', fontWeight: 'bold', textTransform: 'uppercase' },
    value: { width: '65%', borderBottom: '1px solid black', paddingLeft: 2 },

    blockTitle: {
        backgroundColor: '#fbe7c6',
        fontWeight: 'bold',
        padding: 3,
        marginTop: 10,
        textTransform: 'uppercase',
    },
    justificationBox: {
        border: '1px solid black',
        minHeight: 40,
        padding: 4,
    },
    table: { display: 'table', width: 'auto', marginTop: 10 },
    tableRow: { flexDirection: 'row' },
    tableHeader: {
        backgroundColor: '#e0e0e0',
        fontWeight: 'bold',
    },
    cell: {
        border: '1px solid black',
        padding: 4,
        width: '10%',
        textAlign: 'center',
    },
    cellDesc: {
        border: '1px solid black',
        padding: 4,
        width: '40%',
    },
    totalContainer: { marginTop: 10 },
    observationsBox: {
        border: '1px solid black',
        minHeight: 30,
        padding: 4,
    },
    signatures: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '30%',
        borderTop: '1px solid black',
        textAlign: 'center',
        paddingTop: 4,
        fontSize: 9,
    },
    footer: { fontSize: 8, marginTop: 30, textAlign: 'right' },
});

export default function FormularioPDF({ data }) {
    const {
        unidadSolicitante = '',
        fecha = '',
        centroCosto = '',
        responsable = '',
        justificacion = '',
        observaciones = '',
        items = [],
        valorTotal = '',
        valorLiteral = '',
    } = data;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.innerBox}>
                   
                    <View style={styles.headerContainer}>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>UNIVERSIDAD PRIVADA DEL VALLE</Text>
                            <Text style={styles.subtitle}>
                                SOLICITUD DE PEDIDO DE ADQUISICIÓN DE BIENES Y SERVICIOS
                            </Text>
                        </View>
                        <Image style={styles.logo} src={logoSrc} />
                    </View>

                    {/* Datos básicos */}
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <Text style={styles.label}>UNIDAD SOLICITANTE:</Text>
                            <Text style={styles.value}>{unidadSolicitante}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>FECHA EMISIÓN DEL PEDIDO:</Text>
                            <Text style={styles.value}>{fecha}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>CENTRO DE COSTO:</Text>
                            <Text style={styles.value}>{centroCosto}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>RESPONSABLE:</Text>
                            <Text style={styles.value}>{responsable}</Text>
                        </View>

                    </View>

                    
                    <Text style={styles.blockTitle}>
                        Destino y justificación de la solicitud efectuada
                    </Text>
                    <View style={styles.justificationBox}>
                        <Text>{justificacion}</Text>
                    </View>

                   
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.cell}>CANT.</Text>
                            <Text style={styles.cell}>UNIDAD</Text>
                            <Text style={styles.cellDesc}>NOMBRE</Text>
                            <Text style={styles.cellDesc}>DESCRIPCIÓN</Text>
                            <Text style={styles.cell}>P/U</Text>
                            <Text style={styles.cell}>TOTAL</Text>
                        </View>
                        {items.map((item, i) => (
                            <View style={styles.tableRow} key={i}>
                                <Text style={styles.cell}>{item.cantidad}</Text>
                                <Text style={styles.cell}>{item.unidad_medida || item.unidad || ''}</Text>
                                <Text style={styles.cellDesc}>{item.nombre}</Text>
                                <Text style={styles.cellDesc}>{item.descripcion}</Text>
                                <Text style={styles.cell}>{item.pu}</Text>
                                <Text style={styles.cell}>{item.total}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Totales */}
                    <View style={styles.totalContainer}>
                        <Text style={{ fontWeight: 'bold' }}>VALOR TOTAL: {valorTotal}</Text>
                        <Text>Literal: {valorLiteral}</Text>
                    </View>

                   
                    <Text style={styles.blockTitle}>OBSERVACIONES</Text>
                    <View style={styles.observationsBox}>
                        <Text>{observaciones}</Text>
                    </View>

                   
                    <View style={styles.signatures}>
                        <Text style={styles.signatureBox}>Responsable Unidad Solicitante</Text>
                        <Text style={styles.signatureBox}>Almacenes / Presupuestos</Text>
                        <Text style={styles.signatureBox}>Rector / Vicerrector</Text>
                    </View>

                   
                    <Text style={styles.footer}>Código: RE-10-DIR-007 Versión 2.0</Text>
                </View>
            </Page>
        </Document>
    );
}
