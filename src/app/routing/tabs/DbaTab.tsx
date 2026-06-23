import React from 'react';

const DbaSchema = React.lazy(() => import('../../../features/dba/DbaSchema'));

export const DbaTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn" id="tab-dba">
      <React.Suspense fallback={
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-xs animate-pulse">
          Cargando Modelador de Base de Datos (DBA)...
        </div>
      }>
        <DbaSchema />
      </React.Suspense>
    </div>
  );
};
