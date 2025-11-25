import React from 'react';
import { formatearPrecio } from '@/utils/formatters';
import { Presupuesto } from '@/types';

interface PDFProductTableProps {
  presupuesto: Presupuesto;
}

// Interface para rastrear el estado del formato
interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const PDFProductTable: React.FC<PDFProductTableProps> = ({ presupuesto }) => {
  // Sanitize HTML for PDF rendering - adds inline styles to prevent format inheritance
  const sanitizeHtmlForPDF = (html: string): string => {
    if (!html || html.trim() === '' || html.trim() === '0') return '';
    
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const cleanNode = (node: Node, format: FormatState = { bold: false, italic: false, underline: false }): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (!text.trim()) return text;
        
        // Construir estilos inline basados en el formato activo
        const styles: string[] = [];
        if (format.bold) styles.push('font-weight:bold');
        if (format.italic) styles.push('font-style:italic');
        if (format.underline) styles.push('text-decoration:underline');
        
        if (styles.length > 0) {
          return `<span style="${styles.join(';')}">${text}</span>`;
        }
        return text;
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Tags permitidos para formato
      const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'br', 'p', 'div'];
      
      if (tagName === 'br') return '<br>';
      
      // Detectar tags de formato
      const isBoldTag = tagName === 'b' || tagName === 'strong';
      const isItalicTag = tagName === 'i' || tagName === 'em';
      const isUnderlineTag = tagName === 'u';
      
      // Actualizar el estado del formato para los hijos
      const newFormat: FormatState = {
        bold: format.bold || isBoldTag,
        italic: format.italic || isItalicTag,
        underline: format.underline || isUnderlineTag,
      };
      
      const childContent = Array.from(node.childNodes)
        .map(child => cleanNode(child, newFormat))
        .join('');
      
      if (allowedTags.includes(tagName)) {
        // Normalizar strong->b, em->i
        const normalizedTag = tagName === 'strong' ? 'b' : tagName === 'em' ? 'i' : tagName;
        if (!childContent.trim() && normalizedTag !== 'br') return childContent;
        
        // Para p y div, agregar estilos inline para prevenir herencia de formato
        if (normalizedTag === 'p' || normalizedTag === 'div') {
          return `<${normalizedTag} style="text-decoration:none;font-weight:normal;font-style:normal;display:block">${childContent}</${normalizedTag}>`;
        }
        
        // Saltar los tags de formato ya que aplicamos estilos directamente al texto
        if (normalizedTag === 'u' || normalizedTag === 'b' || normalizedTag === 'i') {
          return childContent;
        }
        
        return `<${normalizedTag}>${childContent}</${normalizedTag}>`;
      }
      
      return childContent;
    };
    
    let result = Array.from(temp.childNodes).map(child => cleanNode(child, { bold: false, italic: false, underline: false })).join('');
    
    // Limpiar "0" sueltos, tags vacíos y br excesivos
    result = result
      .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
      .replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '')
      .replace(/<[^>]*>\s*<\/[^>]*>/g, '')
      .replace(/^\s*0\s*$/g, '')
      .trim();
    
    return result === '0' || result === '' ? '' : result;
  };

  // Function to clean HTML and prevent unwanted "0" values
  const cleanHtmlContent = (html: string) => {
    // First sanitize the HTML
    const sanitized = sanitizeHtmlForPDF(html);
    if (!sanitized) return '';
    
    // Create temporary element to clean remaining "0" text nodes
    const temp = document.createElement('div');
    temp.innerHTML = sanitized;
    
    // Remove all text nodes that are just "0"
    const walker = document.createTreeWalker(
      temp,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textNodes: Node[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.trim() === '0') {
        textNodes.push(node);
      }
    }
    
    textNodes.forEach(n => n.parentNode?.removeChild(n));
    

    return temp.innerHTML.trim();
  };

  const renderSessionDetails = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) {
      return null;
    }
    
    // Filter sessions that have valid personnel data
    const validSessions = sessions.filter(session => {
      const acreditadores = session.acreditadores || 0;
      const supervisor = session.supervisor || 0;
      const totalPersonal = acreditadores + supervisor;
      
      // Only show sessions with personnel > 0 and valid pricing
      return totalPersonal > 0 && session.precio > 0;
    });

    if (validSessions.length === 0) {
      return null;
    }
    
    return (
      <div className="ml-4 mt-2">
        {validSessions.map((session, index) => {
          const acreditadores = session.acreditadores || 0;
          const supervisor = session.supervisor || 0;
          const totalPersonal = acreditadores + supervisor;
          const subtotal = session.precio * totalPersonal;
          
          return (
            <div key={session.id || index} className="flex justify-between items-center py-1 text-sm border-b border-gray-200 last:border-b-0">
              <div className="flex-1">
                <span className="text-gray-700">{session.fecha} - {session.servicio}</span>
              </div>
              <div className="flex-1 text-center">
                <span className="text-gray-600">{acreditadores} acred. + {supervisor} super.</span>
              </div>
              <div className="flex-1 text-right">
                <span className="text-gray-700 font-medium">{formatearPrecio(session.precio)}</span>
              </div>
              <div className="w-24 text-right">
                <span className="text-gray-700 font-medium">{formatearPrecio(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 p-3 text-left font-bold text-gray-800">DESCRIPCIÓN</th>
            <th className="border border-gray-400 p-3 text-center font-bold text-gray-800 w-20">CANT.</th>
            <th className="border border-gray-400 p-3 text-right font-bold text-gray-800 w-32">PRECIO UNIT.</th>
            <th className="border border-gray-400 p-3 text-right font-bold text-gray-800 w-32">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {(presupuesto.productos || []).map((producto, index) => (
            <React.Fragment key={`producto-${producto.id || index}`}>
              <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-400 p-3">
                  <div className="product-description">
                    <div className="font-semibold text-gray-800 text-lg">{producto.nombre}</div>
                    {producto.descripcion && cleanHtmlContent(producto.descripcion) && (
                      <div 
                        className="text-sm text-gray-600 mt-1" 
                        style={{ textDecoration: 'none', fontWeight: 'normal', fontStyle: 'normal' }}
                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(producto.descripcion) }} 
                      />
                    )}
                    {producto.comentarios && cleanHtmlContent(producto.comentarios) && (
                      <div 
                        className="text-sm text-gray-600 mt-2 italic" 
                        style={{ textDecoration: 'none', fontWeight: 'normal' }}
                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(producto.comentarios) }} 
                      />
                    )}
                    {producto.descuentoPorcentaje !== undefined && producto.descuentoPorcentaje > 0 && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Descuento aplicado: {producto.descuentoPorcentaje}%
                      </div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-400 p-3 text-center font-medium">{producto.cantidad}</td>
                <td className="border border-gray-400 p-3 text-right font-medium">
                  {formatearPrecio(producto.precioUnitario || producto.precio_unitario)}
                </td>
                <td className="border border-gray-400 p-3 text-right font-bold">{formatearPrecio(producto.total)}</td>
              </tr>
              
              {/* Session Details as Sub-rows */}
              {producto.sessions && producto.sessions.length > 0 && (
                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td colSpan={4} className="border border-gray-400 p-0">
                    <div className="bg-gray-100 border-t border-gray-300">
                      <div className="px-3 py-2">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Detalle de Sesiones de Acreditación:</div>
                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 pb-1 border-b border-gray-300">
                          <div className="col-span-4">Fecha y Servicio</div>
                          <div className="col-span-3 text-center">Personal</div>
                          <div className="col-span-2 text-right">Precio por Persona</div>
                          <div className="col-span-3 text-right">Subtotal</div>
                        </div>
                        {renderSessionDetails(producto.sessions)}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PDFProductTable;
