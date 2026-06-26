import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlaylistLeads, useCreateLead, useUpdateLead, useAssignableMembers } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Loader2, Save, Check, Grid3X3 } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import type { Playlist, Lead, LeadStatus, Industry } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

interface PlaylistSpreadsheetProps {
  playlist: Playlist;
  onBack: () => void;
}

interface RowData {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  customFields: Record<string, string>;
  isNew: boolean;
  isDirty: boolean;
  isSaving: boolean;
  assignedTo?: string | null;
}

const VISIBLE_ROWS = 30;
const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const FIXED_HEADERS = ['Name', 'Company', 'Email', 'Phone', 'Status'];

function makeEmptyRow(userId?: string | null): RowData {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '', company: '', email: '', phone: '',
    status: 'New' as LeadStatus,
    customFields: {},
    isNew: true, isDirty: false, isSaving: false,
    assignedTo: userId || null,
  };
}

export function PlaylistSpreadsheet({ playlist, onBack }: PlaylistSpreadsheetProps) {
  const { data: allLeads, isLoading } = usePlaylistLeads(playlist.id);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const user = useAuthStore((s) => s.user);
  const assignableMembers = useAssignableMembers();
  const canAssign = assignableMembers && assignableMembers.length > 0;

  const [customHeaders, setCustomHeaders] = useState<string[]>([]);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [rows, setRows] = useState<RowData[]>(() =>
    Array.from({ length: VISIBLE_ROWS }, () => makeEmptyRow(user?.id))
  );
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [savedMsg, setSavedMsg] = useState('');
  const initialized = useRef(false);

  // Initialize rows from DB — only ONCE
  useEffect(() => {
    if (!allLeads || initialized.current) return;
    initialized.current = true;

    const mine = allLeads.filter(l => l.playlistId === playlist.id);

    const hdrs = new Set<string>();
    mine.forEach(lead => {
      if (lead.customFields) Object.keys(lead.customFields).forEach(k => hdrs.add(k));
    });
    setCustomHeaders(Array.from(hdrs));

    const existing: RowData[] = mine.map(lead => ({
      id: lead.id,
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      status: (lead.status || 'New') as LeadStatus,
      customFields: lead.customFields || {},
      isNew: false, isDirty: false, isSaving: false,
      assignedTo: lead.assignedTo,
    }));

    const pad = Math.max(VISIBLE_ROWS - existing.length, 5);
    setRows([...existing, ...Array.from({ length: pad }, () => makeEmptyRow(user?.id))]);
  }, [allLeads, playlist.id, user?.id]);

  const allHeaders = [...FIXED_HEADERS, ...(canAssign ? ['Assigned To'] : []), ...customHeaders];
  const totalCols = allHeaders.length;

  // ---- Cell value helpers ----
  const getVal = (row: RowData, col: number) => {
    if (col === 0) return row.name;
    if (col === 1) return row.company;
    if (col === 2) return row.email;
    if (col === 3) return row.phone;
    if (col === 4) return row.status;
    if (canAssign && col === 5) return row.assignedTo || '';
    const customIdx = col - (FIXED_HEADERS.length + (canAssign ? 1 : 0));
    return row.customFields[customHeaders[customIdx]] || '';
  };

  const setVal = (ri: number, ci: number, v: string) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== ri) return r;
      const updated = { ...r, isDirty: true };
      if (ci === 0) updated.name = v;
      else if (ci === 1) updated.company = v;
      else if (ci === 2) updated.email = v;
      else if (ci === 3) updated.phone = v;
      else if (ci === 4) updated.status = v as LeadStatus;
      else if (canAssign && ci === 5) updated.assignedTo = v || null;
      else {
        const customIdx = ci - (FIXED_HEADERS.length + (canAssign ? 1 : 0));
        const key = customHeaders[customIdx];
        updated.customFields = { ...r.customFields, [key]: v };
      }
      return updated;
    }));
  };

  // ---- Keyboard navigation ----
  const handleKeyDown = (e: React.KeyboardEvent, ri: number, ci: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const next = e.shiftKey ? ci - 1 : ci + 1;
      if (next >= 0 && next < totalCols) {
        setActiveCell({ row: ri, col: next });
      } else if (!e.shiftKey && next >= totalCols && ri + 1 < rows.length) {
        setActiveCell({ row: ri + 1, col: 0 });
      } else if (e.shiftKey && next < 0 && ri > 0) {
        setActiveCell({ row: ri - 1, col: totalCols - 1 });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (ri + 1 < rows.length) setActiveCell({ row: ri + 1, col: ci });
    } else if (e.key === 'ArrowDown' && !e.shiftKey) {
      if (ri + 1 < rows.length) { e.preventDefault(); setActiveCell({ row: ri + 1, col: ci }); }
    } else if (e.key === 'ArrowUp' && !e.shiftKey) {
      if (ri > 0) { e.preventDefault(); setActiveCell({ row: ri - 1, col: ci }); }
    }
  };

  // Focus active cell
  useEffect(() => {
    if (!activeCell) return;
    const el = document.querySelector(`[data-cell="${activeCell.row}-${activeCell.col}"]`) as HTMLElement;
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement) el.select();
    }
  }, [activeCell]);

  // ---- Add column ----
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newColumnName.trim();
    if (!name) return;
    if (!customHeaders.includes(name)) {
      setCustomHeaders(prev => [...prev, name]);
    }
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  // ---- Add rows ----
  const addMoreRows = () => {
    setRows(prev => [...prev, ...Array.from({ length: 10 }, () => makeEmptyRow(user?.id))]);
  };

  // ---- Save ----
  const dirtyRows = rows.filter(r => r.isDirty);

  const handleSaveAll = async () => {
    const toSave = rows.filter(r => r.isDirty);
    if (!toSave.length) return;

    setRows(prev => prev.map(r => r.isDirty ? { ...r, isSaving: true } : r));

    const updatedRows = [...rows];
    let ok = 0, fail = 0;

    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i];
      if (!row.isDirty) continue;

      try {
        if (row.isNew) {
          if (!row.name.trim()) continue;
          const created = await createLead.mutateAsync({
            name: row.name,
            company: row.company,
            email: row.email,
            phone: row.phone,
            status: row.status,
            industry: 'Other' as Industry,
            playlistId: playlist.id,
            customFields: row.customFields,
            assignedTo: row.assignedTo || user?.id || null,
          });
          updatedRows[i] = {
            ...row,
            id: created.id,
            isNew: false,
            isDirty: false,
            isSaving: false,
          };
          ok++;
        } else {
          await updateLead.mutateAsync({
            id: row.id,
            updates: {
              name: row.name, company: row.company,
              email: row.email, phone: row.phone,
              status: row.status, customFields: row.customFields,
              assignedTo: row.assignedTo || null,
            },
          });
          updatedRows[i] = {
            ...row,
            isDirty: false,
            isSaving: false,
          };
          ok++;
        }
      } catch {
        updatedRows[i] = {
          ...row,
          isSaving: false,
        };
        fail++;
      }
    }

    setRows(updatedRows);

    if (fail) {
      toast({ title: `Saved ${ok}, failed ${fail}`, variant: 'destructive' });
    } else if (ok) {
      setSavedMsg(`✓ ${ok} saved`);
      setTimeout(() => setSavedMsg(''), 3000);
      toast({ title: `${ok} lead${ok > 1 ? 's' : ''} saved!` });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#060e09] overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-[#0a1810] shrink-0">
        <Button
          variant="ghost" size="icon" onClick={onBack}
          className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5 cursor-pointer transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/30">
            <Grid3X3 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-white truncate">{playlist.name}</h1>
            <p className="text-[11px] text-emerald-500/60 leading-none mt-0.5">
              {rows.filter(r => !r.isNew).length} leads  •  {dirtyRows.length > 0 ? `${dirtyRows.length} unsaved` : 'All saved'}
            </p>
          </div>
        </div>

        {savedMsg && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 animate-pulse">
            <Check className="h-3 w-3" /> {savedMsg}
          </span>
        )}

        <Button
          variant="ghost" size="sm" onClick={addMoreRows}
          className="h-7 text-[11px] text-white/40 hover:text-white border border-white/8 hover:border-white/15 hover:bg-white/5 cursor-pointer transition-colors duration-200"
        >
          <Plus className="h-3 w-3 mr-1" /> Rows
        </Button>

        <Button
          size="sm" onClick={handleSaveAll}
          disabled={!dirtyRows.length || createLead.isPending}
          className={cn(
            "h-7 text-[11px] font-semibold gap-1.5 cursor-pointer transition-all duration-200",
            dirtyRows.length
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          {createLead.isPending
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Save className="h-3 w-3" />}
          Save All
        </Button>
      </div>

      {/* ── Spreadsheet Grid ── */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="min-w-max">
            <table className="w-full text-sm border-collapse select-none" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              <thead className="sticky top-0 z-20">
                {/* Column letters */}
                <tr className="bg-[#0c1e13] text-emerald-700/60 text-[10px] font-mono">
                  <th className="w-[52px] min-w-[52px] px-1 py-1 border-r border-b border-white/6 text-center bg-[#091a0f]" />
                  {allHeaders.map((_, i) => (
                    <th key={i} className="min-w-[160px] px-1 py-1 border-r border-b border-white/6 text-center">
                      {i < 26 ? COL_LETTERS[i] : `A${COL_LETTERS[i - 26]}`}
                    </th>
                  ))}
                  <th className="min-w-[110px] py-1 border-b border-white/6" />
                </tr>

                {/* Header labels */}
                <tr className="bg-[#0b1a11] text-emerald-400/70 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="w-[52px] min-w-[52px] px-2 py-2 border-r border-b border-white/8 text-center text-white/15 bg-[#091a0f]">#</th>
                  {allHeaders.map((h, i) => (
                    <th key={i} className="min-w-[160px] px-3 py-2 border-r border-b border-white/8 text-left font-semibold">
                      {h}{i === 0 && <span className="text-rose-400 ml-0.5">*</span>}
                    </th>
                  ))}
                  <th className="min-w-[110px] px-2 py-2 border-b border-white/8">
                    {isAddingColumn ? (
                      <form onSubmit={handleAddColumn} className="flex items-center">
                        <input
                          autoFocus
                          type="text"
                          className="h-6 w-full text-[11px] px-2 bg-black/50 border border-emerald-500/40 rounded text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-colors duration-150"
                          placeholder="Column name..."
                          value={newColumnName}
                          onChange={e => setNewColumnName(e.target.value)}
                          onBlur={() => { if (!newColumnName.trim()) setIsAddingColumn(false); }}
                          onKeyDown={e => { if (e.key === 'Escape') setIsAddingColumn(false); }}
                        />
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsAddingColumn(true)}
                        className="flex items-center gap-1 text-[10px] text-emerald-600/50 hover:text-emerald-400 cursor-pointer transition-colors duration-200 font-medium"
                      >
                        <Plus className="h-3 w-3" /> Column
                      </button>
                    )}
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, ri) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "group transition-colors duration-100",
                      row.isSaving && "opacity-40",
                      row.status === 'Contacted' && "bg-amber-500/[0.12]",
                      row.status === 'Qualified' && "bg-purple-500/[0.12]",
                      row.status === 'Proposal Sent' && "bg-cyan-500/[0.12]",
                      row.status === 'Won' && "bg-emerald-500/[0.15]",
                      row.status === 'Lost' && "bg-rose-500/[0.12]",
                      row.status === 'Rejected' && "bg-stone-500/[0.12]",
                      row.status === 'Visited' && "bg-sky-500/[0.12]",
                      row.isDirty && !row.isSaving && "bg-emerald-950/15"
                    )}
                  >
                    {/* Row number */}
                    <td className={cn(
                      "w-[52px] min-w-[52px] px-2 py-0 border-r border-b border-white/5 text-center text-[11px] font-mono",
                      row.isDirty
                        ? "text-emerald-400/80 bg-emerald-950/25"
                        : "text-white/15 bg-[#091a0f]",
                      row.status === 'Contacted' && "border-l-2 border-l-amber-500/80",
                      row.status === 'Qualified' && "border-l-2 border-l-purple-500/80",
                      row.status === 'Proposal Sent' && "border-l-2 border-l-cyan-500/80",
                      row.status === 'Won' && "border-l-2 border-l-emerald-500/80",
                      row.status === 'Lost' && "border-l-2 border-l-rose-500/80",
                      row.status === 'Rejected' && "border-l-2 border-l-stone-500/80",
                      row.status === 'Visited' && "border-l-2 border-l-sky-500/80",
                    )}>
                      {ri + 1}
                    </td>

                    {/* Data cells */}
                    {allHeaders.map((_, ci) => {
                      const isActive = activeCell?.row === ri && activeCell?.col === ci;
                      const val = getVal(row, ci);

                      // Status dropdown
                      if (ci === 4) {
                        return (
                          <td key={ci} className={cn(
                            "min-w-[160px] p-0 border-r border-b border-white/5 relative",
                            isActive && "outline outline-2 outline-emerald-500 outline-offset-[-2px] z-10"
                          )}>
                            <select
                              data-cell={`${ri}-${ci}`}
                              className="w-full bg-transparent px-3 py-[7px] text-sm text-white/70 focus:text-white focus:outline-none appearance-none cursor-pointer hover:bg-white/[0.03] transition-colors duration-150"
                              value={val}
                              onChange={e => setVal(ri, ci, e.target.value)}
                              onFocus={() => setActiveCell({ row: ri, col: ci })}
                              onKeyDown={e => handleKeyDown(e, ri, ci)}
                            >
                              <option value="New" className="bg-[#0a1810] text-white">New</option>
                              <option value="Contacted" className="bg-[#0a1810] text-white">Contacted</option>
                              <option value="Qualified" className="bg-[#0a1810] text-white">Qualified</option>
                              <option value="Proposal Sent" className="bg-[#0a1810] text-white">Proposal Sent</option>
                              <option value="Won" className="bg-[#0a1810] text-white">Won</option>
                              <option value="Lost" className="bg-[#0a1810] text-white">Lost</option>
                              <option value="Rejected" className="bg-[#0a1810] text-white">Rejected</option>
                              <option value="Visited" className="bg-[#0a1810] text-white">Visited</option>
                            </select>
                          </td>
                        );
                      }

                      // Assigned To dropdown
                      if (canAssign && ci === 5) {
                        return (
                          <td key={ci} className={cn(
                            "min-w-[160px] p-0 border-r border-b border-white/5 relative",
                            isActive && "outline outline-2 outline-emerald-500 outline-offset-[-2px] z-10"
                          )}>
                            <select
                              data-cell={`${ri}-${ci}`}
                              className="w-full bg-transparent px-3 py-[7px] text-sm text-white/70 focus:text-white focus:outline-none appearance-none cursor-pointer hover:bg-white/[0.03] transition-colors duration-150"
                              value={val || ''}
                              onChange={e => setVal(ri, ci, e.target.value)}
                              onFocus={() => setActiveCell({ row: ri, col: ci })}
                              onKeyDown={e => handleKeyDown(e, ri, ci)}
                            >
                              <option value="" className="bg-[#0a1810] text-white">Unassigned</option>
                              {assignableMembers.map((m) => (
                                <option key={m.id} value={m.id} className="bg-[#0a1810] text-white">
                                  {m.name || m.email}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      }

                      // Text input
                      return (
                        <td key={ci} className={cn(
                          "min-w-[160px] p-0 border-r border-b border-white/5 relative",
                          isActive && "outline outline-2 outline-emerald-500 outline-offset-[-2px] z-10"
                        )}>
                          <input
                            data-cell={`${ri}-${ci}`}
                            type="text"
                            className={cn(
                              "w-full bg-transparent px-3 py-[7px] text-sm focus:outline-none transition-colors duration-150",
                              val ? "text-white/85" : "text-transparent",
                              !isActive && "hover:bg-white/[0.02]",
                              isActive && "bg-black/20 text-white",
                            )}
                            value={val}
                            onChange={e => setVal(ri, ci, e.target.value)}
                            onFocus={() => setActiveCell({ row: ri, col: ci })}
                            onKeyDown={e => handleKeyDown(e, ri, ci)}
                          />
                        </td>
                      );
                    })}

                    <td className="min-w-[110px] border-b border-white/5" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Status Bar ── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/8 bg-[#0a1810] text-[11px] text-white/25 shrink-0 font-mono">
        <span>
          {activeCell
            ? `${activeCell.col < 26 ? COL_LETTERS[activeCell.col] : '?'}${activeCell.row + 1}`
            : 'Ready'}
        </span>
        <span>
          {rows.filter(r => !r.isNew).length} saved  ·  {rows.filter(r => r.isNew && r.isDirty).length} new  ·  {rows.length} rows
        </span>
      </div>
    </div>
  );
}
