import React from 'react';
import { useBrandConfig } from '@/hooks/useBrandConfig';
import { useBudgetTermsConfig } from '@/hooks/useBudgetTermsConfig';
const PDFFooter: React.FC = () => {
  const {
    config: brandConfig
  } = useBrandConfig();
  const {
    config: termsConfig
  } = useBudgetTermsConfig();
  return <div className="border-t-2 border-gray-800 pt-6 mt-8">
      {/* Contact Information */}
      <div className="mb-6">
        
        
      </div>
      
      {/* Terms and Conditions */}
      <div className="border-t border-gray-300 pt-4">
        
        <div className="text-xs text-gray-600 leading-relaxed space-y-2">
          
          
          <div className="mt-4 pt-3 border-t border-gray-200 text-center">
            <p className="font-semibold text-gray-700">
              {termsConfig?.certificacion_texto || 'Empresa certificada en normas ISO 9001:2015 | Registrada en ChileCompra'}
            </p>
            <p className="text-gray-600 mt-1">
              {termsConfig?.documento_texto || 'Este documento constituye una propuesta comercial sujeta a aceptación formal'}
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default PDFFooter;