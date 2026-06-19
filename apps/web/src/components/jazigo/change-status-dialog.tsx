'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

type GraveStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED';

const ALLOWED: Record<GraveStatus, GraveStatus[]> = {
  AVAILABLE: ['OCCUPIED', 'RESERVED', 'BLOCKED'],
  RESERVED: ['OCCUPIED', 'AVAILABLE', 'BLOCKED'],
  OCCUPIED: ['AVAILABLE', 'BLOCKED'],
  BLOCKED: ['AVAILABLE'],
};

const STATUS_LABEL: Record<GraveStatus, string> = {
  AVAILABLE: 'Disponível',
  OCCUPIED: 'Ocupado',
  RESERVED: 'Reservado',
  BLOCKED: 'Interditado',
};

interface Props {
  open: boolean;
  jazigoId: string;
  currentStatus: GraveStatus;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangeStatusDialog({ open, jazigoId, currentStatus, onClose, onSuccess }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<GraveStatus | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allowed = ALLOWED[currentStatus] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStatus) return;
    setLoading(true);
    setError('');
    try {
      await api.patch(`/api/v1/graves/${jazigoId}/status`, {
        status: selectedStatus,
        reason: reason.trim() || undefined,
      });
      setSelectedStatus('');
      setReason('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-base font-semibold text-neutral-900 mb-4">Alterar status do jazigo</h3>

        <div className="flex items-center gap-2 mb-5 p-3 bg-neutral-50 rounded-lg text-sm">
          <span className="font-medium text-neutral-700">{STATUS_LABEL[currentStatus]}</span>
          <ArrowRight size={14} className="text-neutral-400" />
          <span className="text-neutral-500">novo status</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Novo status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allowed.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStatus(s)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedStatus === s
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Motivo <span className="text-neutral-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Descreva o motivo da mudança..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStatus}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
