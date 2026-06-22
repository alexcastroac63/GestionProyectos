import React from 'react';
import { Briefcase, Users2, Trash2 } from 'lucide-react';
import { useSystemStore } from '../../app/AppProviders';

interface ClientSponsorSettingsProps {
  clientsList: string[];
  setClientsList: (list: string[]) => void;
  sponsorsList: string[];
  setSponsorsList: (list: string[]) => void;
}

export const ClientSponsorSettings: React.FC<ClientSponsorSettingsProps> = ({
  clientsList,
  setClientsList,
  sponsorsList,
  setSponsorsList,
}) => {
  const { addLog, setDeleteConfirmState } = useSystemStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn text-left">
      {/* Management box for Clients Category */}
      <div className="space-y-4 border border-slate-150 rounded-2xl p-5 bg-slate-50/50">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-emerald-500" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              Clientes (Sponsor Empresas)
            </span>
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">
            Total: {clientsList.length}
          </span>
        </div>

        {/* Add Client Form */}
        <div className="flex gap-2.5">
          <input
            type="text"
            id="new-client-input"
            placeholder="Nombre del nuevo cliente corporativo..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  if (!clientsList.includes(val)) {
                    const updated = [...clientsList, val];
                    setClientsList(updated);
                    localStorage.setItem('gcp_clients_list', JSON.stringify(updated));
                    (e.target as HTMLInputElement).value = '';
                    addLog('Configuración', `Agregó cliente al catálogo: ${val}`);
                  } else {
                    alert('El cliente ya se encuentra en el catálogo.');
                  }
                }
              }
            }}
            className="flex-1 bg-white border border-slate-200 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById('new-client-input') as HTMLInputElement;
              const val = input?.value.trim();
              if (val) {
                if (!clientsList.includes(val)) {
                  const updated = [...clientsList, val];
                  setClientsList(updated);
                  localStorage.setItem('gcp_clients_list', JSON.stringify(updated));
                  input.value = '';
                  addLog('Configuración', `Agregó cliente al catálogo: ${val}`);
                } else {
                  alert('El cliente ya se encuentra en el catálogo.');
                }
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl transition shrink-0 cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            Añadir
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl bg-white max-h-[350px] overflow-y-auto divide-y divide-slate-100 shadow-xs">
          {clientsList.map((client, idx) => (
            <div
              key={idx}
              className="p-3.5 gap-2 flex items-center justify-between text-xs hover:bg-slate-50 text-slate-705 text-slate-700 transition"
            >
              <span className="font-semibold break-all text-slate-800">{client}</span>
              <button
                onClick={() => {
                  setDeleteConfirmState({
                    isOpen: true,
                    title: 'Eliminar Cliente',
                    message: `¿Está seguro de que desea eliminar al cliente "${client}" del catálogo corporativo?`,
                    onConfirm: () => {
                      const updated = clientsList.filter((c) => c !== client);
                      setClientsList(updated);
                      localStorage.setItem('gcp_clients_list', JSON.stringify(updated));
                      addLog('Configuración', `Eliminó cliente del catálogo: ${client}`);
                    },
                  });
                }}
                className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition cursor-pointer shrink-0 ml-2 animate-fadeIn"
                title="Eliminar cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Management box for Sponsors */}
      <div className="space-y-4 border border-slate-150 rounded-2xl p-5 bg-slate-50/50">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <Users2 className="w-4.5 h-4.5 text-purple-500" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              Sponsors (Líderes Firmas)
            </span>
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">
            Total: {sponsorsList.length}
          </span>
        </div>

        {/* Add Sponsor Form */}
        <div className="flex gap-2.5">
          <input
            type="text"
            id="new-sponsor-input"
            placeholder="Nombre del nuevo líder de firma / sponsor..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  if (!sponsorsList.includes(val)) {
                    const updated = [...sponsorsList, val];
                    setSponsorsList(updated);
                    localStorage.setItem('gcp_sponsors_list', JSON.stringify(updated));
                    (e.target as HTMLInputElement).value = '';
                    addLog('Configuración', `Agregó sponsor al catálogo: ${val}`);
                  } else {
                    alert('El sponsor ya se encuentra en el catálogo.');
                  }
                }
              }
            }}
            className="flex-1 bg-white border border-slate-200 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById('new-sponsor-input') as HTMLInputElement;
              const val = input?.value.trim();
              if (val) {
                if (!sponsorsList.includes(val)) {
                  const updated = [...sponsorsList, val];
                  setSponsorsList(updated);
                  localStorage.setItem('gcp_sponsors_list', JSON.stringify(updated));
                  input.value = '';
                  addLog('Configuración', `Agregó sponsor al catálogo: ${val}`);
                } else {
                  alert('El sponsor ya se encuentra en el catálogo.');
                }
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 rounded-xl transition shrink-0 cursor-pointer shadow-sm shadow-purple-500/10"
          >
            Añadir
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl bg-white max-h-[350px] overflow-y-auto divide-y divide-slate-100 shadow-xs">
          {sponsorsList.map((sponsor, idx) => (
            <div
              key={idx}
              className="p-3.5 gap-2 flex items-center justify-between text-xs hover:bg-slate-50 text-slate-700 transition"
            >
              <span className="font-semibold break-all text-slate-800">{sponsor}</span>
              <button
                onClick={() => {
                  setDeleteConfirmState({
                    isOpen: true,
                    title: 'Eliminar Sponsor',
                    message: `¿Está seguro de que desea eliminar al sponsor "${sponsor}" del catálogo corporativo?`,
                    onConfirm: () => {
                      const updated = sponsorsList.filter((s) => s !== sponsor);
                      setSponsorsList(updated);
                      localStorage.setItem('gcp_sponsors_list', JSON.stringify(updated));
                      addLog('Configuración', `Eliminó sponsor del catálogo: ${sponsor}`);
                    },
                  });
                }}
                className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition cursor-pointer shrink-0 ml-2 animate-fadeIn"
                title="Eliminar sponsor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
