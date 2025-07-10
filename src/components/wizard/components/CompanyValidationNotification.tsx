import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface CompanyValidationNotificationProps {
  message: string;
  isFound: boolean | null;
}

export const CompanyValidationNotification: React.FC<CompanyValidationNotificationProps> = ({
  message,
  isFound
}) => {
  if (!message) return null;

  return (
    <div className={`flex items-start space-x-2 p-3 rounded-md mt-2 ${
      isFound === true 
        ? 'bg-green-50 border border-green-200' 
        : 'bg-blue-50 border border-blue-200'
    }`}>
      {isFound === true ? (
        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
      )}
      <p className={`text-sm ${
        isFound === true ? 'text-green-700' : 'text-blue-700'
      }`}>
        {message}
      </p>
    </div>
  );
};