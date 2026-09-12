/** DRAFT screen (S-P4-05, specVersion 0.9.0) — proposed VMs behind the BFF draft stub (OQ-17/18). */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';
import { apiFetch } from '@/lib/apiClient';

interface Money { kind: 'MONEY'; amount: string; currency: string }
interface BenefitCard {
  benefitCode: string; title: string;
  rate: { pct: number; sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' };
  assessmentYear: number;
  progress?: { min: Money; current: Money; max: Money };
  statusSentiment?: 'POSITIVE' | 'NEGATIVE';
  pinned: boolean;
}
interface BenefitsPayload { draft: boolean; tabs: string[]; bonus: BenefitCard[]; contests: unknown[] }

export default function MilestonesMY() {
  const navigate = useNavigate();
  const [vm, setVm] = useState<BenefitsPayload | null>(null);
  const [tab, setTab] = useState<'BONUS' | 'CONTESTS'>('BONUS');
  const [pins, setPins] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/bff/v1/benefits')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setVm)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <div className="section card">Error {error}</div>;
  if (!vm) return <div className="section muted">Loading…</div>;

  return (
    <>
      <div className="appbar">
        <button className="back" aria-label="Back" onClick={() => navigate(-1)}>←</button>
        <h1>{t('insights.quicklink.MILESTONES')}</h1>
      </div>

      <div className="section segtabs" role="tablist">
        <button role="tab" aria-selected={tab === 'BONUS'} className={`seg ${tab === 'BONUS' ? 'active' : ''}`} onClick={() => setTab('BONUS')}>
          {t('insights.benefits.tab.bonus')}
        </button>
        <button role="tab" aria-selected={tab === 'CONTESTS'} className={`seg ${tab === 'CONTESTS' ? 'active' : ''}`} onClick={() => setTab('CONTESTS')}>
          {t('insights.benefits.tab.contests')}
        </button>
      </div>

      {tab === 'BONUS' && vm.bonus.map((b, i) => {
        const pinned = pins[i] ?? b.pinned;
        const pct = b.progress
          ? Math.min(100, Math.round((Number(b.progress.current.amount) / Number(b.progress.max.amount)) * 100))
          : null;
        return (
          <div className="section card" key={i}>
            <div className="spread">
              <div className="title16" style={{ flex: 1, paddingRight: 8 }}>{b.title}</div>
              <span className={`tag badge-${b.rate.sentiment === 'NEGATIVE' ? 'danger' : 'success'}`}>
                {t('insights.benefits.rateChip', { pct: b.rate.pct })}
              </span>
            </div>
            <div className="caption muted" style={{ marginTop: 4 }}>
              {t('insights.benefits.assessmentYear', { year: b.assessmentYear })}
            </div>
            {b.progress && pct !== null && (
              <>
                <div className="progress" style={{ marginTop: 10 }}><div style={{ width: `${pct}%` }} /></div>
                <div className="spread small muted" style={{ marginTop: 4 }}>
                  <span>{formatMoney(b.progress.min.amount, b.progress.min.currency)}</span>
                  <span className="text-strong" style={{ color: 'var(--color-text)' }}>{formatMoney(b.progress.current.amount, b.progress.current.currency)}</span>
                  <span>{formatMoney(b.progress.max.amount, b.progress.max.currency)}</span>
                </div>
              </>
            )}
            <div className="spread" style={{ marginTop: 12 }}>
              <button className="btn-outline" aria-pressed={pinned}
                onClick={() => setPins((p) => ({ ...p, [i]: !pinned }))}>
                {pinned ? '♥' : '♡'} {t('insights.benefits.pinToHome')}
              </button>
              <span className="caption text-semibold">{t('insights.benefits.viewDetails')} ›</span>
            </div>
          </div>
        );
      })}

      {tab === 'CONTESTS' && (
        <div className="section card muted" style={{ textAlign: 'center', padding: 28 }}>
          {t('insights.benefits.contests.empty')}
        </div>
      )}
    </>
  );
}
