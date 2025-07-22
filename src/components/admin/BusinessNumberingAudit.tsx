import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuditEntry {
  id: string;
  user_id: string;
  business_number: number;
  negocio_id: string | null;
  assigned_at: string;
  status: string;
  notes: string | null;
}

interface ConsistencyIssue {
  issue_type: string;
  description: string;
  expected_number: number;
  actual_number: number;
  negocio_id: string;
}

interface UserCounter {
  user_id: string;
  contador_negocio: number;
  updated_at: string;
  profile?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

const BusinessNumberingAudit: React.FC = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [userCounters, setUserCounters] = useState<UserCounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAuditData = async () => {
    try {
      setRefreshing(true);

      // Get audit entries
      const { data: audit, error: auditError } = await supabase
        .from('business_number_audit')
        .select('*')
        .order('assigned_at', { ascending: false })
        .limit(50);

      if (auditError) throw auditError;
      setAuditEntries(audit || []);

      // Get user counters with profile info
      const { data: counters, error: countersError } = await supabase
        .from('contadores_usuario')
        .select(`
          *,
          profiles:user_id (
            nombre,
            apellido,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (countersError) throw countersError;
      setUserCounters(counters || []);

      // Check consistency for current user
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser) {
        const { data: issues, error: issuesError } = await supabase
          .rpc('check_business_numbering_consistency', { p_user_id: currentUser.id });

        if (issuesError) throw issuesError;
        setConsistencyIssues(issues || []);
      }

    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de auditoría.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" />Asignado</Badge>;
      case 'used':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Usado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIssueTypeBadge = (issueType: string) => {
    switch (issueType) {
      case 'gap':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />Salto</Badge>;
      case 'duplicate':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Duplicado</Badge>;
      default:
        return <Badge variant="outline">{issueType}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando auditoría...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auditoría de Numeración</h2>
          <p className="text-sm text-muted-foreground">
            Monitoreo y auditoría del sistema de números correlativos únicos
          </p>
        </div>
        <Button onClick={fetchAuditData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Consistency Issues */}
      {consistencyIssues.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Se detectaron {consistencyIssues.length} inconsistencia(s) en la numeración.</strong>
            <div className="mt-2 space-y-1">
              {consistencyIssues.map((issue, index) => (
                <div key={index} className="text-sm">
                  {getIssueTypeBadge(issue.issue_type)} {issue.description} - 
                  Esperado: {issue.expected_number}, Actual: {issue.actual_number}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* User Counters */}
      <Card>
        <CardHeader>
          <CardTitle>Contadores por Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Último Número</TableHead>
                <TableHead>Última Actualización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userCounters.map((counter) => (
                <TableRow key={counter.user_id}>
                  <TableCell>
                    {counter.profile ? 
                      `${counter.profile.nombre} ${counter.profile.apellido}` : 
                      'Usuario desconocido'
                    }
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {counter.profile?.email || 'No disponible'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      #{counter.contador_negocio}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(counter.updated_at).toLocaleString('es-CL')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Audit Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría Recientes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimas 50 asignaciones de números correlativos
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Negocio ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      #{entry.business_number}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(entry.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {entry.negocio_id ? entry.negocio_id.substring(0, 8) + '...' : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.assigned_at).toLocaleString('es-CL')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {entry.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessNumberingAudit;