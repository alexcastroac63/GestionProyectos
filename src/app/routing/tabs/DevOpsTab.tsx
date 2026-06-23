import React, { useState } from 'react';
import { useSystemStore, useProjectsStore } from '../../AppProviders';
import { getSegmentedProjects } from '../../selectors/tenantSelectors';
import { devopsRepository } from '../../../features/devops/infrastructure/devopsRepository';
import { 
  GitCommit as CommitIcon, 
  GitPullRequest as PrIcon, 
  Plus, 
  Trash2, 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight 
} from 'lucide-react';

const DevOpsPipeline = React.lazy(() => import('../../../features/devops/DevOpsPipeline'));

export const DevOpsTab: React.FC = () => {
  const { loggedInUser, addLog } = useSystemStore();
  const { projects, selectedProjectId } = useProjectsStore();

  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);

  // Real-time interactive commits and pull request state loaded from the repository
  const [commits, setCommits] = useState(() => devopsRepository.loadCommits());
  const [prs, setPrs] = useState(() => devopsRepository.loadPRs());

  // Interactive Commit creation modal/form states
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [commitAuthor, setCommitAuthor] = useState(loggedInUser?.name || 'Alex Castro');
  const [commitBranch, setCommitBranch] = useState('main');

  // Interactive PR creation modal/form states
  const [showPrForm, setShowPrForm] = useState(false);
  const [prTitle, setPrTitle] = useState('');
  const [prAuthor, setPrAuthor] = useState(loggedInUser?.name || 'Alex Castro');
  const [prStatus, setPrStatus] = useState<'OPEN' | 'MERGED' | 'CLOSED'>('OPEN');

  const handleAddCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;

    // Generate a clean mock 7-character hexadecimal hash
    const generatedHash = Math.random().toString(16).substring(2, 9);
    const newCommit = {
      id: `commit-${Date.now()}`,
      author: commitAuthor,
      message: commitMsg,
      branch: commitBranch,
      hash: generatedHash,
      timestamp: new Date().toISOString()
    };

    const updatedCommits = [newCommit, ...commits];
    setCommits(updatedCommits);
    devopsRepository.saveCommits(updatedCommits);

    addLog(
      loggedInUser?.name || 'Developer', 
      `Simuló un commit de Git [${generatedHash}]: "${commitMsg}"`
    );

    // Clear inputs and close panel
    setCommitMsg('');
    setShowCommitForm(false);
  };

  const handleAddPr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prTitle.trim()) return;

    const nextPrNumber = prs.length > 0 ? Math.max(...prs.map(p => p.number)) + 1 : 101;
    const newPr = {
      id: `pr-${Date.now()}`,
      number: nextPrNumber,
      title: prTitle,
      author: prAuthor,
      status: prStatus,
      created_at: new Date().toISOString()
    };

    const updatedPrs = [newPr, ...prs];
    setPrs(updatedPrs);
    devopsRepository.savePRs(updatedPrs);

    addLog(
      loggedInUser?.name || 'Developer', 
      `Creó la Pull Request #${nextPrNumber}: "${prTitle}"`
    );

    // Clear inputs and close panel
    setPrTitle('');
    setShowPrForm(false);
  };

  const handleCyclePrStatus = (prId: string) => {
    const updatedPrs = prs.map(p => {
      if (p.id === prId) {
        const statuses: ('OPEN' | 'MERGED' | 'CLOSED')[] = ['OPEN', 'MERGED', 'CLOSED'];
        const nextIdx = (statuses.indexOf(p.status) + 1) % statuses.length;
        const nextStatus = statuses[nextIdx];

        addLog(
          loggedInUser?.name || 'Developer', 
          `Cambió estado de PR #${p.number} a: ${nextStatus}`
        );

        return { ...p, status: nextStatus };
      }
      return p;
    });

    setPrs(updatedPrs);
    devopsRepository.savePRs(updatedPrs);
  };

  const handleDeleteCommit = (id: string, hash: string) => {
    const filtered = commits.filter(c => c.id !== id);
    setCommits(filtered);
    devopsRepository.saveCommits(filtered);
    addLog(loggedInUser?.name || 'Developer', `Eliminó registro de commit [${hash}]`);
  };

  const handleDeletePr = (id: string, number: number) => {
    const filtered = prs.filter(p => p.id !== id);
    setPrs(filtered);
    devopsRepository.savePRs(filtered);
    addLog(loggedInUser?.name || 'Developer', `Eliminó registro de PR #${number}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="tab-devops">
      {/* Conexión de Repositorios y Telemetría */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-slate-900 font-extrabold text-base">Conexión de Repositorios y Telemetría</h3>
            <p className="text-xs text-slate-500">
              Gestione los repositorios del proyecto, visualice el historial en tiempo real y simule integraciones de código.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCommitForm(true);
                setShowPrForm(false);
              }}
              className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold px-3 py-1.5 rounded-lg border border-indigo-200/50 transition cursor-pointer"
            >
              <CommitIcon className="w-3.5 h-3.5" />
              Simular Commit
            </button>
            <button
              onClick={() => {
                setShowPrForm(true);
                setShowCommitForm(false);
              }}
              className="flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-200/50 transition cursor-pointer"
            >
              <PrIcon className="w-3.5 h-3.5" />
              Crear PR
            </button>
          </div>
        </div>

        {/* Dynamic simulation forms */}
        {showCommitForm && (
          <form onSubmit={handleAddCommit} className="bg-slate-50 border border-slate-150 p-4 rounded-xl mb-6 animate-fadeIn space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CommitIcon className="w-4 h-4 text-indigo-600" />
                Simular Nuevo Commit en Repositorio
              </span>
              <button type="button" onClick={() => setShowCommitForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Autor</label>
                <input
                  type="text"
                  required
                  value={commitAuthor}
                  onChange={(e) => setCommitAuthor(e.target.value)}
                  className="w-full text-xs border border-slate-250 bg-white rounded-lg px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rama de Destino</label>
                <input
                  type="text"
                  required
                  value={commitBranch}
                  onChange={(e) => setCommitBranch(e.target.value)}
                  className="w-full text-xs border border-slate-250 bg-white rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg transition"
                >
                  Registrar Commit
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mensaje de Commit</label>
              <input
                type="text"
                required
                placeholder="ej. fix: corrige filtrado en pipeline de despliegue"
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                className="w-full text-xs border border-slate-250 bg-white rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </form>
        )}

        {showPrForm && (
          <form onSubmit={handleAddPr} className="bg-slate-50 border border-slate-150 p-4 rounded-xl mb-6 animate-fadeIn space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PrIcon className="w-4 h-4 text-emerald-600" />
                Crear Nueva Pull Request (PR)
              </span>
              <button type="button" onClick={() => setShowPrForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Autor</label>
                <input
                  type="text"
                  required
                  value={prAuthor}
                  onChange={(e) => setPrAuthor(e.target.value)}
                  className="w-full text-xs border border-slate-250 bg-white rounded-lg px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estado Inicial</label>
                <select
                  value={prStatus}
                  onChange={(e) => setPrStatus(e.target.value as any)}
                  className="w-full text-xs border border-slate-250 bg-white rounded-lg px-2.5 py-1.5 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="OPEN">🟢 OPEN (Abierto)</option>
                  <option value="MERGED">🟣 MERGED (Integrado)</option>
                  <option value="CLOSED">🔴 CLOSED (Rechazado)</option>
                </select>
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg transition"
                >
                  Crear PR
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título de la Pull Request</label>
              <input
                type="text"
                required
                placeholder="ej. feat: agrega soporte multi-tenant en base de datos"
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                className="w-full text-xs border border-slate-250 bg-white rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Commits */}
          <div className="space-y-3">
            <span className="text-[10.5px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
              <CommitIcon className="w-3.5 h-3.5 text-slate-400" />
              Historial Reciente de Commits ({commits.length})
            </span>
            {commits.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No hay commits registrados en este repositorio.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {commits.map(commit => (
                  <div key={commit.id} className="group border border-slate-150 p-3 rounded-xl hover:bg-slate-50 text-xs transition relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-indigo-600 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                          {commit.hash}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <GitBranch className="w-2.5 h-2.5" />
                          {commit.branch}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(commit.timestamp).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteCommit(commit.id, commit.hash)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition duration-150"
                          title="Eliminar Commit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-800 mt-2">{commit.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Autor: <span className="font-bold text-slate-600">{commit.author}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pull Requests */}
          <div className="space-y-3">
            <span className="text-[10.5px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
              <PrIcon className="w-3.5 h-3.5 text-slate-400" />
              Pull Requests Activas ({prs.length})
            </span>
            {prs.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No hay Pull Requests registradas.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {prs.map(pr => (
                  <div key={pr.id} className="group border border-slate-150 p-3 rounded-xl hover:bg-slate-50 text-xs transition relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800 font-extrabold">#{pr.number}</strong>
                        <button
                          onClick={() => handleCyclePrStatus(pr.id)}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all border cursor-pointer hover:scale-102 ${
                            pr.status === 'OPEN' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : pr.status === 'MERGED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title="Click para cambiar estado"
                        >
                          {pr.status === 'OPEN' && <Clock className="w-2.5 h-2.5" />}
                          {pr.status === 'MERGED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {pr.status === 'CLOSED' && <X className="w-2.5 h-2.5" />}
                          {pr.status}
                          <ChevronRight className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeletePr(pr.id, pr.number)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition duration-150"
                        title="Eliminar PR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-semibold text-slate-800 mt-2">{pr.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Autor: <span className="font-bold text-slate-600">{pr.author}</span> • Creada: {new Date(pr.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CI/CD Dynamic Simulator Actions */}
      <React.Suspense fallback={
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-xs animate-pulse">
          Cargando Pipeline de Integración Continua (DevOps)...
        </div>
      }>
        <DevOpsPipeline selectedProjectId={selectedProjectId} projects={segmentedProjects} />
      </React.Suspense>
    </div>
  );
};
