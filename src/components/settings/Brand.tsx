import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Brand = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Marca</CardTitle>
        <CardDescription>
          Personaliza la marca y apariencia de tus documentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Configuración de marca en desarrollo.
        </p>
      </CardContent>
    </Card>
  );
};

export default Brand;