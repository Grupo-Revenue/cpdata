import { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import { Presupuesto, Negocio, SessionAcreditacion } from '@/types';
import { calcularTotalesPresupuesto } from '@/utils/quoteCalculations';
import { formatearPrecio, stripHtml } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const IVA_PERCENTAGE = 19;

export const createPresupuestoPDFDefinition = (
  presupuesto: Presupuesto,
  negocio: Negocio
): TDocumentDefinitions => {
  const totales = calcularTotalesPresupuesto(presupuesto.productos || []);
  const currentDate = new Date();
  const validityDate = new Date();
  validityDate.setDate(currentDate.getDate() + 30);

  return {
    content: [
      // Header Section
      createHeaderSection(presupuesto, negocio, currentDate, validityDate),
      
      // Spacer
      { text: '', margin: [0, 10] },
      
      // Products Table
      createProductsTable(presupuesto),
      
      // Spacer
      { text: '', margin: [0, 10] },
      
      // Pricing Summary
      createPricingSummary(totales),
      
      // Spacer
      { text: '', margin: [0, 15] },
      
      // Conditions Section
      createConditionsSection(),
      
      // Footer
      createFooterSection(),
    ],
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
    },
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#1f2937',
      },
      subheader: {
        fontSize: 14,
        bold: true,
        color: '#374151',
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: '#374151',
        fillColor: '#f3f4f6',
      },
      tableCell: {
        fontSize: 9,
        color: '#111827',
      },
      totalsHeader: {
        bold: true,
        fontSize: 10,
        color: '#374151',
      },
      totalsValue: {
        fontSize: 10,
        color: '#111827',
      },
      grandTotal: {
        bold: true,
        fontSize: 12,
        color: '#dc2626',
      },
      footer: {
        fontSize: 8,
        color: '#6b7280',
        alignment: 'center',
      },
    },
  };
};

const createHeaderSection = (
  presupuesto: Presupuesto,
  negocio: Negocio,
  currentDate: Date,
  validityDate: Date
): Content => {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [
          {
            stack: [
              { text: 'CP DATA', style: 'header', color: '#dc2626' },
              { text: 'Soluciones Tecnológicas', fontSize: 12, color: '#6b7280' },
              { text: '', margin: [0, 5] },
              { text: `Presupuesto #${presupuesto.nombre}`, style: 'subheader' },
              { text: `Fecha de emisión: ${format(currentDate, 'dd/MM/yyyy', { locale: es })}`, fontSize: 9 },
              { text: `Válido hasta: ${format(validityDate, 'dd/MM/yyyy', { locale: es })}`, fontSize: 9 },
            ],
          },
          {
            stack: [
              { text: 'INFORMACIÓN DEL CLIENTE', style: 'subheader', margin: [0, 0, 0, 5] },
              { text: `${negocio.contacto.nombre} ${negocio.contacto.apellido}`, fontSize: 10, bold: true },
              { text: negocio.contacto.email, fontSize: 9 },
              { text: negocio.contacto.telefono, fontSize: 9 },
              ...(negocio.productora ? [
                { text: '', margin: [0, 3] },
                { text: negocio.productora.nombre, fontSize: 9, bold: true },
              ] : negocio.clienteFinal ? [
                { text: '', margin: [0, 3] },
                { text: negocio.clienteFinal.nombre, fontSize: 9, bold: true },
              ] : []),
              { text: '', margin: [0, 5] },
              { text: 'INFORMACIÓN DEL EVENTO', style: 'subheader', margin: [0, 0, 0, 3] },
              { text: negocio.evento.nombreEvento, fontSize: 10, bold: true },
              { text: `Tipo: ${negocio.evento.tipoEvento}`, fontSize: 9 },
              { text: `Fecha: ${format(new Date(negocio.evento.fechaEvento), 'dd/MM/yyyy', { locale: es })}`, fontSize: 9 },
              { text: `Ubicación: ${negocio.evento.locacion}`, fontSize: 9 },
              { text: `Asistentes: ${negocio.evento.cantidadAsistentes}`, fontSize: 9 },
            ],
          },
        ],
      ],
    },
    layout: 'noBorders',
  };
};

const createProductsTable = (presupuesto: Presupuesto): Content => {
  const productos = presupuesto.productos || [];
  
  const tableBody: TableCell[][] = [
    // Header
    [
      { text: 'DESCRIPCIÓN', style: 'tableHeader' },
      { text: 'CANT.', style: 'tableHeader', alignment: 'center' },
      { text: 'PRECIO UNIT.', style: 'tableHeader', alignment: 'right' },
      { text: 'DESC.', style: 'tableHeader', alignment: 'center' },
      { text: 'TOTAL', style: 'tableHeader', alignment: 'right' },
    ],
  ];

  productos.forEach((producto) => {
    const descripcion = stripHtml(producto.descripcion || producto.nombre);
    const cantidad = producto.cantidad || 0;
    const precioUnitario = producto.precioUnitario || 0;
    const descuento = producto.descuentoPorcentaje || 0;
    const total = cantidad * precioUnitario * (1 - descuento / 100);

    // Main product row
    tableBody.push([
      { text: descripcion, style: 'tableCell' },
      { text: cantidad.toString(), style: 'tableCell', alignment: 'center' },
      { text: formatearPrecio(precioUnitario), style: 'tableCell', alignment: 'right' },
      { text: descuento > 0 ? `${descuento}%` : '-', style: 'tableCell', alignment: 'center' },
      { text: formatearPrecio(total), style: 'tableCell', alignment: 'right' },
    ]);

    // Session details if available
    if (producto.sessions && producto.sessions.length > 0) {
      producto.sessions.forEach((sesion) => {
        const session = sesion as SessionAcreditacion;
        if (session.fecha && session.acreditadores) {
          tableBody.push([
            { 
              text: `  • ${format(new Date(session.fecha), 'dd/MM/yyyy', { locale: es })} - ${session.acreditadores} acreditadores`,
              style: 'tableCell',
              fontSize: 8,
              color: '#6b7280'
            },
            { text: '', style: 'tableCell' },
            { text: '', style: 'tableCell' },
            { text: '', style: 'tableCell' },
            { text: '', style: 'tableCell' },
          ]);
        }
      });
    }
  });

  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto', 'auto'],
      body: tableBody,
    },
    layout: {
      fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e5e7eb',
      vLineColor: () => '#e5e7eb',
    },
  };
};

const createPricingSummary = (totales: any): Content => {
  const summaryRows: TableCell[][] = [
    [
      { text: 'Subtotal:', style: 'totalsHeader', alignment: 'right' },
      { text: formatearPrecio(totales.subtotal), style: 'totalsValue', alignment: 'right' },
    ],
  ];

  if (totales.totalDescuentos > 0) {
    summaryRows.push([
      { text: 'Descuentos:', style: 'totalsHeader', alignment: 'right' },
      { text: `-${formatearPrecio(totales.totalDescuentos)}`, style: 'totalsValue', alignment: 'right' },
    ]);
    summaryRows.push([
      { text: 'Subtotal Neto:', style: 'totalsHeader', alignment: 'right' },
      { text: formatearPrecio(totales.subtotalConDescuento), style: 'totalsValue', alignment: 'right' },
    ]);
  }

  summaryRows.push([
    { text: `IVA (${IVA_PERCENTAGE}%):`, style: 'totalsHeader', alignment: 'right' },
    { text: formatearPrecio(totales.iva), style: 'totalsValue', alignment: 'right' },
  ]);

  summaryRows.push([
    { text: 'TOTAL GENERAL:', style: 'grandTotal', alignment: 'right' },
    { text: formatearPrecio(totales.total), style: 'grandTotal', alignment: 'right' },
  ]);

  return {
    table: {
      widths: ['*', 'auto'],
      body: summaryRows,
    },
    layout: 'noBorders',
    margin: [300, 0, 0, 0],
  };
};

const createConditionsSection = (): Content => {
  return {
    stack: [
      { text: 'CONDICIONES COMERCIALES', style: 'subheader', margin: [0, 0, 0, 10] },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: '• Forma de pago: 50% al confirmar, 50% al finalizar el evento', fontSize: 9 },
              { text: '• Precios válidos por 30 días desde la fecha de emisión', fontSize: 9 },
              { text: '• Valores expresados en pesos chilenos', fontSize: 9 },
              { text: '• IVA incluido en el total', fontSize: 9 },
            ],
          },
          {
            width: '*',
            stack: [
              { text: '• Equipos entregados en perfecto estado técnico', fontSize: 9 },
              { text: '• Montaje y desmontaje incluido en el servicio', fontSize: 9 },
              { text: '• Operador técnico durante todo el evento', fontSize: 9 },
              { text: '• Garantía de funcionamiento durante el evento', fontSize: 9 },
            ],
          },
        ],
      },
    ],
  };
};

const createFooterSection = (): Content => {
  return {
    stack: [
      { text: '', margin: [0, 20] },
      { text: 'Empresa certificada en normas ISO 9001:2015 | Registrada en ChileCompra', style: 'footer', bold: true },
      { text: 'Este documento constituye una propuesta comercial sujeta a aceptación formal', style: 'footer' },
    ],
  };
};