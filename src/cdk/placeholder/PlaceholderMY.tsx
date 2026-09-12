import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';

/**
 * Coming-Soon page for routes outside the Performance pack (roadmap items).
 * Common to every LBU; the only per-feature variation is the app-bar title.
 */
export default function PlaceholderMY({ titleKey }: { titleKey?: string }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="appbar">
        <button className="back" aria-label="Back" onClick={() => navigate(-1)}>←</button>
        <h1>{titleKey ? t(titleKey) : t('insights.placeholder.title')}</h1>
      </div>
      <div className="section card state">
        <div className="glyph" aria-hidden>🚧</div>
        <h3>{t('insights.placeholder.title')}</h3>
        <p className="muted small">{t('insights.placeholder.body')}</p>
      </div>
    </>
  );
}
