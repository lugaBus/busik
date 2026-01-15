'use client';

import { ContentCreator } from '@/api/contentCreators';
import { getI18nText, Language } from '@/utils/i18n';
import Link from 'next/link';

interface ContentCreatorCardProps {
  creator: ContentCreator;
  language: Language;
}

export default function ContentCreatorCard({ creator, language }: ContentCreatorCardProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  // Use first photo from photoUrls array, or fallback to photoUrl for backward compatibility
  const firstPhotoUrl = creator.photoUrls && creator.photoUrls.length > 0 
    ? creator.photoUrls[0] 
    : creator.photoUrl;
  const photoUrl = firstPhotoUrl ? `${apiUrl}${firstPhotoUrl}` : null;
  const name = getI18nText(creator.name, language);

  // Helper function to check if text is not empty and not just whitespace
  const hasContent = (text: any): boolean => {
    if (!text) return false;
    const textValue = typeof text === 'string' ? text : getI18nText(text, language);
    return Boolean(textValue && textValue.trim().length > 0);
  };

  // Helper function to get score badge class based on rating
  const getScoreClass = (rating: number): string => {
    if (rating < 4) return 'score-low';
    if (rating >= 4 && rating < 7) return 'score-medium';
    return 'score-high';
  };

  const quoteText = creator.quote ? getI18nText(creator.quote, language) : null;
  const descriptionText = creator.description ? getI18nText(creator.description, language) : null;

  return (
    <Link href={`/creators/${creator.id}`} className="creator-card">
      <div className="creator-card-header">
        <div className="creator-card-photo">
          {photoUrl ? (
            <img src={photoUrl} alt={name} />
          ) : (
            <div className="creator-card-photo-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>
        <div className="creator-card-info">
          <h3 className="creator-card-name">{name}</h3>
          {creator.categories && creator.categories.length > 0 && (
            <p className="creator-card-profession">
              {getI18nText(creator.categories[0].name, language)}
            </p>
          )}
          {creator.ratios && creator.ratios.length > 0 && (() => {
            const firstRatio = creator.ratios[0];
            const ratioName = getI18nText(firstRatio.name, language);
            const ratioSlug = firstRatio.slug.toLowerCase();
            const getRatioColor = (slug: string) => {
              if (slug.includes('зрадник') || slug.includes('zradnik') || slug.includes('traitor')) return '#ef4444'; // Red
              if (slug.includes('нейтральний') || slug.includes('neutral')) return '#fb923c'; // Light orange
              if (slug.includes('патріот') || slug.includes('patriot')) return '#10b981'; // Green
              return '#6b7280'; // Default gray
            };
            const getRatioIcon = (slug: string) => {
              if (slug.includes('зрадник') || slug.includes('zradnik') || slug.includes('traitor')) {
                return (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4c-2.5 0-4.5 2-4.5 4.5 0 1.5 1 2.5 2 3.5v6h5v-6c1-1 2-2 2-3.5C16.5 6 14.5 4 12 4z" />
                    <path d="M8 12h8M8 8h8M8 16h8" />
                    <path d="M6 20h12" strokeLinecap="round" />
                  </svg>
                );
              }
              if (slug.includes('нейтральний') || slug.includes('neutral')) {
                return (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                );
              }
              if (slug.includes('патріот') || slug.includes('patriot')) {
                return (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                );
              }
              return null;
            };
            return (
              <div className="creator-card-ratio-badge" style={{ backgroundColor: getRatioColor(ratioSlug) + '20', borderColor: getRatioColor(ratioSlug), color: getRatioColor(ratioSlug) }}>
                {getRatioIcon(ratioSlug) && <span className="ratio-icon">{getRatioIcon(ratioSlug)}</span>}
                <span>{ratioName}</span>
              </div>
            );
          })()}
          <div className="creator-card-status">
          </div>
        </div>
      </div>
      
      {hasContent(creator.quote) && quoteText && (
        <div className="creator-card-section key-statement-section">
          <div className="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>{language === 'en' ? 'KEY STATEMENT' : language === 'ua' ? 'КЛЮЧОВА ЗАЯВА' : 'КЛЮЧЕВОЕ ЗАЯВЛЕНИЕ'}</span>
          </div>
          <div className="section-content key-statement">
            <p className="key-statement-text">
              {quoteText}
            </p>
          </div>
        </div>
      )}

      {hasContent(creator.description) && descriptionText && (
        <div className="creator-card-section">
          <div className="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{language === 'en' ? 'DESCRIPTION' : language === 'ua' ? 'ОПИС' : 'ОПИСАНИЕ'}</span>
          </div>
          <div className="section-content">
            <p className="description-text">
              {descriptionText}
            </p>
          </div>
        </div>
      )}

      <div className="creator-card-section creator-card-section-bottom">
        <div style={{ display: 'flex', justifyContent: (() => {
          const rating = creator.rating ?? creator.metrics?.engagementRate;
          return rating != null ? 'space-between' : 'flex-end';
        })(), alignItems: 'flex-start' }}>
            {(() => {
              const rating = creator.rating ?? creator.metrics?.engagementRate;
              const scoreClass = rating != null ? getScoreClass(rating) : '';
              const scoreColor = scoreClass === 'score-low' ? '#ef4444' : scoreClass === 'score-medium' ? '#eab308' : '#10b981';
              return rating != null && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SCORE
                  </div>
                  <div style={{ fontSize: '1.25rem', color: scoreColor, fontWeight: '500' }}>
                    {rating}
                  </div>
                </div>
              );
            })()}
            {creator.proofs !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'en' ? 'PROOFS' : language === 'ua' ? 'ПРУФИ' : 'ПРУФЫ'}
                </div>
                <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {creator.proofs.length || 0}
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="creator-card-updated">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Added: {(() => {
            const date = new Date(creator.createdAt);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          })()}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Last Updated: {(() => {
            const date = new Date(creator.updatedAt);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          })()}
        </span>
      </div>
    </Link>
  );
}
