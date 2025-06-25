
import React, { useState, useEffect } from 'react';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import ConflictResolutionDialog from '@/components/business/ConflictResolutionDialog';
import { Negocio } from '@/types';

interface ConflictHandlerProps {
  negocio: Negocio;
}

const ConflictHandler: React.FC<ConflictHandlerProps> = ({ negocio }) => {
  const { syncConflicts, resolveConflict } = useBidirectionalSync();
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);

  // Check for conflicts when component mounts or conflicts change
  useEffect(() => {
    if (negocio && syncConflicts.length > 0) {
      const businessConflict = syncConflicts.find(conflict => conflict.negocio_id === negocio.id);
      if (businessConflict && !conflictDialogOpen) {
        setCurrentConflict(businessConflict);
        setConflictDialogOpen(true);
      }
    }
  }, [negocio, syncConflicts, conflictDialogOpen]);

  const handleResolveConflict = async (negocioId: string, resolvedState: string) => {
    await resolveConflict(negocioId, resolvedState);
    setCurrentConflict(null);
    setConflictDialogOpen(false);
  };

  if (!currentConflict) return null;

  return (
    <ConflictResolutionDialog
      open={conflictDialogOpen}
      onOpenChange={setConflictDialogOpen}
      conflict={currentConflict}
      onResolve={handleResolveConflict}
    />
  );
};

export default ConflictHandler;
