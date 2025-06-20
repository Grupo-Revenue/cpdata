
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone } from 'lucide-react';
import { Contacto } from '@/types';

interface ContactoCardProps {
  contacto: Contacto;
}

const ContactoCard: React.FC<ContactoCardProps> = ({ contacto }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          Contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium">{contacto.nombre} {contacto.apellido}</p>
          {contacto.cargo && <p className="text-sm text-gray-600">{contacto.cargo}</p>}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          {contacto.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          {contacto.telefono}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactoCard;
