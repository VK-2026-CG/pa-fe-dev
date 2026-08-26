'use client';
/** DRAFT screen (S-P4-06, specVersion 0.9.0) — proposed VMs behind the BFF draft stub (OQ-18). */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { formatMoney, formatShortDate } from '@/lib/format';

interface Money { kind: 'MONEY'; amount: string; currency: string }
interface BonusRow { bonusCode: string; amount: Money; status: 'PAID' | 'PENDING'; paidOn?: string }
interface CompPayload { draft: boolean; tabs: string[]; staleness?: { asOnDate: string }; rows: BonusRow[]; retirement: unknown[] }

export default function CompBenMY() {
  const router = useRouter();
  const [vm, setVm] = useState<CompPayload | null>(null);
  const [tab, setTab] = useState<'PAID_COMMISSION' | 'RETIREMENT'>('PAID_COMMISSION');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bff/v1/compensation?stale=1')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setVm)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <div className="section card">Error {error}</div>;
  if (!vm) return <div className="section muted">Loading…</div>;

  return (
    <>
      <div className="appbar">
        <button className="back" aria-label="Back" onClick={() => router.back()}>←</button>
        <h1>{t('insights.compben.title')}</h1>
      </div>

      <div className="section segtabs" role="tablist">
        <button role="tab" aria-selected={tab === 'PAID_COMMISSION'} className={`seg ${tab === 'PAID_COMMISSION' ? 'active' : ''}`} onClick={() => setTab('PAID_COMMISSION')}>
          {t('insights.compben.tab.paidCommission')}
        </button>
        <button role="tab" aria-selected={tab === 'RETIREMENT'} className={`seg ${tab === 'RETIREMENT' ? 'active' : ''}`} onClick={() => setTab('RETIREMENT')}>
          {t('insights.compben.tab.retirement')}
        </button>
      </div>

      {vm.staleness && (
        <div className="section">
          <div className="notice info" role="status">
            <span aria-hidden>ℹ️</span>
            <span>
              {t('insights.compben.staleNotice')}
              <span className="caption" style={{ display: 'block', marginTop: 2 }}>
                {t('insights.compben.asOnDate', { date: formatShortDate(vm.staleness.asOnDate) })}
              </span>
            </span>
          </div>
        </div>
      )}

      {tab === 'PAID_COMMISSION' && (
        <div className="section">
          {vm.rows.map((r, i) => (
            <div className="bonus-row" key={i}>
              <span className={`accent ${r.status === 'PAID' ? 'success' : 'warning'}`} aria-hidden />
              <span style={{ flex: 1 }}>
                <span className="title14" style={{ display: 'block' }}>{t(`insights.compben.${r.bonusCode}.title`)}</span>
                <span className="caption muted">
                  {r.status === 'PAID' && r.paidOn
                    ? t('insights.compben.paidOn', { date: formatShortDate(r.paidOn) })
                    : t('insights.compben.pending')}
                </span>
              </span>
              <span className="text-strong">{formatMoney(r.amount.amount, r.amount.currency)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'RETIREMENT' && (
        <div className="section card muted" style={{ textAlign: 'center', padding: 28 }}>
          {t('insights.compben.retirement.empty')}
        </div>
      )}
    </>
  );
}
