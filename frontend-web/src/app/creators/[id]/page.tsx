'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contentCreatorsApi, ContentCreator } from '@/api/contentCreators';
import { getI18nText, getBrowserLanguage, Language, createI18nText } from '@/utils/i18n';
import { authService } from '@/auth/auth.service';
import { proofSubmissionsApi, ProofSubmission, CreateProofSubmissionDto } from '@/api/proofSubmissions';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [creator, setCreator] = useState<ContentCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('ua');
  const [user, setUser] = useState<any | null>(null);
  const [userProofs, setUserProofs] = useState<ProofSubmission[]>([]);
  const [showProofForm, setShowProofForm] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [uploadingProofImage, setUploadingProofImage] = useState(false);
  const [proofForm, setProofForm] = useState<CreateProofSubmissionDto>({
    contentCreatorId: '',
    url: '',
    imageUrl: '',
    description: createI18nText(),
  });
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(getBrowserLanguage());
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const loadCreator = async () => {
    if (!id) {
      setLoading(false);
      setCreator(null);
      return;
    }
    
    try {
      setLoading(true);
      const data = await contentCreatorsApi.getById(id);
      setCreator(data);
    } catch (error: any) {
      console.error('Failed to load creator:', error);
      setCreator(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCreator();
      loadUserProofs();
    } else {
      setLoading(false);
      setCreator(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle Escape key to close lightbox
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [lightboxImage]);

  const loadUserProofs = async () => {
    if (!id) return;
    try {
      const proofs = await proofSubmissionsApi.getByContentCreator(id);
      setUserProofs(proofs);
    } catch (error) {
      console.error('Failed to load user proofs:', error);
    }
  };

  const handleProofImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImageFile(file);
      // Clear imageUrl when file is selected
      setProofForm({ ...proofForm, imageUrl: '' });
    }
    e.target.value = '';
  };

  const handleSubmitProof = async () => {
    if (!id) return;
    
    setSubmittingProof(true);
    try {
      // Send only current language in description
      const descriptionText = proofForm.description?.[language];
      const newProof = await proofSubmissionsApi.create({
        contentCreatorId: id,
        url: proofForm.url || undefined,
        imageUrl: proofForm.imageUrl || undefined,
        description: descriptionText ? { [language]: descriptionText } : undefined,
      }, language);

      // If image file was selected, upload it
      if (proofImageFile) {
        setUploadingProofImage(true);
        try {
          await proofSubmissionsApi.uploadImage(newProof.id, proofImageFile);
        } catch (error: any) {
          console.error('Failed to upload proof image:', error);
          alert(error.response?.data?.message || 'Proof created but failed to upload image');
        } finally {
          setUploadingProofImage(false);
        }
      }

      setProofForm({
        contentCreatorId: '',
        url: '',
        imageUrl: '',
        description: createI18nText(),
      });
      setProofImageFile(null);
      setShowProofForm(false);
      await loadUserProofs();
    } catch (error: any) {
      console.error('Failed to submit proof:', error);
      alert(error.response?.data?.message || 'Failed to submit proof');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleDeleteProof = async (proofId: string, currentStatus?: string | null) => {
    // Block deletion if status is in_review (submitted can be deleted)
    if (currentStatus === 'in_review') {
      alert(language === 'en' 
        ? 'Cannot delete proof submission that is in review' 
        : language === 'ua' 
          ? 'Неможливо видалити підтвердження, яке перевіряється' 
          : 'Невозможно удалить подтверждение, которое проверяется');
      return;
    }

    if (!confirm(language === 'en' ? 'Are you sure you want to delete this proof?' : language === 'ua' ? 'Ви впевнені, що хочете видалити цей пруф?' : 'Вы уверены, что хотите удалить этот пруф?')) {
      return;
    }
    
    try {
      await proofSubmissionsApi.delete(proofId);
      await loadUserProofs();
    } catch (error: any) {
      console.error('Failed to delete proof:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete proof';
      alert(errorMessage);
    }
  };

  // Helper function to get status display
  const getStatusDisplay = (status?: string | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'submitted':
        return {
          text: language === 'en' ? 'Submitted' : language === 'ua' ? 'Надіслано' : 'Отправлено',
          class: 'status-submitted',
          icon: null,
        };
      case 'in_review':
        return {
          text: language === 'en' ? 'In Review' : language === 'ua' ? 'На перевірці' : 'На проверке',
          class: 'status-in-review',
          icon: null,
        };
      case 'accepted':
        return {
          text: language === 'en' ? 'Accepted' : language === 'ua' ? 'Прийнято' : 'Принято',
          class: 'status-accepted',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ),
        };
      case 'declined':
        return {
          text: language === 'en' ? 'Declined' : language === 'ua' ? 'Відхилено' : 'Отклонено',
          class: 'status-declined',
          icon: null,
        };
      case 'deleted_by_user':
        return {
          text: language === 'en' ? 'Deleted by User' : language === 'ua' ? 'Видалено користувачем' : 'Удалено пользователем',
          class: 'status-declined',
          icon: null,
        };
      default:
        return null;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{language === 'en' ? 'Loading...' : language === 'ua' ? 'Завантаження...' : 'Загрузка...'}</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <p>{language === 'en' ? 'Creator not found' : language === 'ua' ? 'Креатора не знайдено' : 'Креатор не найден'}</p>
          <Link href="/" className="back-link">
            {language === 'en' ? '← Back to list' : language === 'ua' ? '← Назад до списку' : '← Назад к списку'}
          </Link>
        </div>
      </div>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  // Use first photo from photoUrls array, or fallback to photoUrl for backward compatibility
  const firstPhotoUrl = creator.photoUrls && creator.photoUrls.length > 0 
    ? creator.photoUrls[0] 
    : creator.photoUrl;
  const photoUrl = firstPhotoUrl ? `${apiUrl}${firstPhotoUrl}` : null;
  // Get all photo URLs
  const allPhotoUrls = creator.photoUrls && creator.photoUrls.length > 0
    ? creator.photoUrls.map(url => `${apiUrl}${url}`)
    : (creator.photoUrl ? [`${apiUrl}${creator.photoUrl}`] : []);
  const name = getI18nText(creator.name, language);
  const profession = creator.categories && creator.categories.length > 0 
    ? getI18nText(creator.categories[0].name, language) 
    : '';

  // Helper function to check if text is not empty and not just whitespace
  const hasContent = (text: any): boolean => {
    if (!text) return false;
    const textValue = typeof text === 'string' ? text : getI18nText(text, language);
    return textValue && textValue.trim().length > 0;
  };

  // Helper function to get score badge class based on rating
  const getScoreClass = (rating: number): string => {
    if (rating < 4) return 'score-low';
    if (rating >= 4 && rating < 7) return 'score-medium';
    return 'score-high';
  };

  const quoteText = creator.quote ? getI18nText(creator.quote, language) : null;
  const descriptionText = creator.description ? getI18nText(creator.description, language) : null;

  // Get ratio badge (same logic as in ContentCreatorCard)
  const getRatioBadge = () => {
    if (!creator.ratios || creator.ratios.length === 0) return null;
    const firstRatio = creator.ratios[0];
    const ratioName = getI18nText(firstRatio.name, language);
    const ratioSlug = firstRatio.slug.toLowerCase();
    const getRatioColor = (slug: string) => {
      if (slug.includes('зрадник') || slug.includes('zradnik') || slug.includes('traitor')) return '#ef4444';
      if (slug.includes('нейтральний') || slug.includes('neutral')) return '#fb923c';
      if (slug.includes('патріот') || slug.includes('patriot')) return '#10b981';
      return '#6b7280';
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
  };

  // Get rating for SCORE display
  const rating = creator.rating ?? creator.metrics?.engagementRate;
  const scoreClass = rating != null ? getScoreClass(rating) : '';
  const scoreColor = scoreClass === 'score-low' ? '#ef4444' : scoreClass === 'score-medium' ? '#eab308' : '#10b981';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" className="app-title-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <Logo size={40} />
              <h1 className="app-title">LugaBus</h1>
            </Link>
            <Link
              href="/creators/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: 'var(--accent)',
                color: 'white',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-hover, #4f46e5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
              }}
            >
              <span>
                {language === 'en' ? 'Add new blogger' : language === 'ua' ? 'Додати нового блогера' : 'Добавить нового блогера'}
              </span>
              <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span>
            </Link>
          </div>
          <div className="header-controls">
            {user ? (
              <>
                <span className="user-info">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email}
                </span>
                <button onClick={handleLogout} className="logout-button">
                  {language === 'en' ? 'Logout' : language === 'ua' ? 'Вийти' : 'Выйти'}
                </button>
              </>
            ) : (
              <Link href="/login" className="login-button">
                {language === 'en' ? 'Login' : language === 'ua' ? 'Вхід' : 'Вход'}
              </Link>
            )}
            <ThemeToggle />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="language-selector"
            >
              <option value="en">English</option>
              <option value="ua">Українська</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>
      </header>

      <main className="app-main detail-page">
        <Link href="/" className="back-link">
          ← {language === 'en' ? 'Back to list' : language === 'ua' ? 'Назад до списку' : 'Назад к списку'}
        </Link>

        <div className="creator-card creator-detail-card">
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
              {profession && (
                <p className="creator-card-profession">{profession}</p>
              )}
              {getRatioBadge()}
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

          {allPhotoUrls.length > 0 && (
            <div className="creator-card-section">
              <div className="section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>{language === 'en' ? 'PHOTOS' : language === 'ua' ? 'ФОТО' : 'ФОТО'}</span>
              </div>
              <div className="section-content">
                <div className="photos-gallery">
                  {allPhotoUrls.map((url, index) => (
                    <div 
                      key={index} 
                      className="photo-gallery-item"
                      onClick={() => setLightboxImage(url)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={url} alt={`${name} - Photo ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {creator.platforms && Object.keys(creator.platforms).length > 0 && (
            <div className="creator-card-section">
              <div className="section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>{language === 'en' ? 'EVIDENCE AND SOURCES' : language === 'ua' ? 'ДОКАЗИ ТА ДЖЕРЕЛА' : 'ДОКАЗАТЕЛЬСТВА И ИСТОЧНИКИ'}</span>
              </div>
              <div className="section-content">
                {creator.platforms.youtube && (
                  <a 
                    href={creator.platforms.youtube.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="evidence-link"
                  >
                    {language === 'en' ? 'Broadcast on YouTube' : language === 'ua' ? 'Ефір на YouTube' : 'Трансляция на YouTube'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
                {creator.platforms.telegram && (
                  <a 
                    href={creator.platforms.telegram.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="evidence-link"
                  >
                    {language === 'en' ? 'Channel on Telegram' : language === 'ua' ? 'Канал на Telegram' : 'Канал в Telegram'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
                {creator.platforms.instagram && (
                  <a 
                    href={creator.platforms.instagram.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="evidence-link"
                  >
                    {language === 'en' ? 'Profile on Instagram' : language === 'ua' ? 'Профіль на Instagram' : 'Профиль в Instagram'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {creator.proofs && creator.proofs.length > 0 && (
            <div className="creator-card-section">
              <div className="section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>{language === 'en' ? 'PROOFS' : language === 'ua' ? 'ПРУФИ' : 'ПРУФЫ'}</span>
              </div>
              <div className="section-content">
                <div className="proofs-list">
                  {creator.proofs.map((proof) => {
                    const proofImageUrl = proof.imageUrl 
                      ? (proof.imageUrl.startsWith('http') ? proof.imageUrl : `${apiUrl}${proof.imageUrl}`)
                      : null;
                    const proofDescription = proof.description ? getI18nText(proof.description, language) : null;
                    return (
                      <div key={proof.id} className="proof-item">
                        {proofImageUrl && (
                          <div 
                            className="proof-image"
                            onClick={() => setLightboxImage(proofImageUrl)}
                            style={{ cursor: 'pointer' }}
                          >
                            <img 
                              src={proofImageUrl} 
                              alt={proofDescription || 'Proof'} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="proof-content">
                          {proof.url && (
                            <div className="proof-url">
                              <strong>{language === 'en' ? 'URL: ' : language === 'ua' ? 'URL: ' : 'URL: '}</strong>
                              <a 
                                href={proof.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="proof-link"
                              >
                                {proof.url}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            </div>
                          )}
                          {proofDescription && (
                            <div className="proof-description">
                              <strong>{language === 'en' ? 'Description: ' : language === 'ua' ? 'Опис: ' : 'Описание: '}</strong>
                              <span>{proofDescription}</span>
                            </div>
                          )}
                          <div className="proof-date">
                            {language === 'en' ? 'Created: ' : language === 'ua' ? 'Створено: ' : 'Создано: '}
                            {new Date(proof.createdAt).toLocaleDateString(language === 'ua' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* User Proof Submissions Section */}
          <div className="creator-card-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>{language === 'en' ? 'MY PROOF SUBMISSIONS' : language === 'ua' ? 'МОЇ ПРУФИ' : 'МОИ ПРУФЫ'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProofForm(!showProofForm);
                  if (showProofForm) {
                    // Clear form when closing
                    setProofForm({
                      contentCreatorId: '',
                      url: '',
                      imageUrl: '',
                      description: createI18nText(),
                    });
                    setProofImageFile(null);
                  }
                }}
                className="proof-submit-button"
              >
                {showProofForm 
                  ? (language === 'en' ? 'Cancel' : language === 'ua' ? 'Скасувати' : 'Отмена')
                  : (language === 'en' ? '+ Add Proof' : language === 'ua' ? '+ Додати пруф' : '+ Добавить пруф')
                }
              </button>
            </div>
            
            {showProofForm && (
              <div className="proof-form">
                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'URL (optional)' : language === 'ua' ? 'URL (необов\'язково)' : 'URL (необязательно)'}
                  </label>
                  <input
                    type="text"
                    value={proofForm.url || ''}
                    onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                    className="form-input"
                    placeholder="https://example.com/proof"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Image URL (optional)' : language === 'ua' ? 'URL зображення (необов\'язково)' : 'URL изображения (необязательно)'}
                  </label>
                  <input
                    type="text"
                    value={proofForm.imageUrl || ''}
                    onChange={(e) => setProofForm({ ...proofForm, imageUrl: e.target.value })}
                    className="form-input"
                    placeholder="/uploads/proofs/image.jpg"
                    disabled={!!proofImageFile}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Upload Image (optional)' : language === 'ua' ? 'Завантажити зображення (необов\'язково)' : 'Загрузить изображение (необязательно)'}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleProofImageSelect}
                    className="form-input"
                    disabled={uploadingProofImage || submittingProof}
                  />
                  {proofImageFile && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      {language === 'en' ? 'Selected: ' : language === 'ua' ? 'Вибрано: ' : 'Выбрано: '}
                      {proofImageFile.name}
                    </p>
                  )}
                  {uploadingProofImage && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      {language === 'en' ? 'Uploading image...' : language === 'ua' ? 'Завантаження зображення...' : 'Загрузка изображения...'}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {language === 'en' ? 'Description' : language === 'ua' ? 'Опис' : 'Описание'}
                  </label>
                  <textarea
                    value={proofForm.description?.[language] || ''}
                    onChange={(e) => setProofForm({
                      ...proofForm,
                      description: {
                        ...(proofForm.description || createI18nText()),
                        [language]: e.target.value,
                      },
                    })}
                    className="form-input"
                    rows={3}
                    placeholder={language === 'en' ? 'Enter description...' : language === 'ua' ? 'Введіть опис...' : 'Введите описание...'}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSubmitProof}
                  disabled={submittingProof || uploadingProofImage}
                  className="proof-submit-button"
                >
                  {(submittingProof || uploadingProofImage)
                    ? (language === 'en' ? 'Submitting...' : language === 'ua' ? 'Відправка...' : 'Отправка...')
                    : (language === 'en' ? 'Submit Proof' : language === 'ua' ? 'Відправити пруф' : 'Отправить пруф')
                  }
                </button>
              </div>
            )}

            {userProofs.length > 0 && (
              <div className="section-content" style={{ marginTop: '1rem' }}>
                <div className="proofs-list">
                  {userProofs.map((proof) => {
                    const proofImageUrl = proof.imageUrl 
                      ? (proof.imageUrl.startsWith('http') ? proof.imageUrl : `${apiUrl}${proof.imageUrl}`)
                      : null;
                    const proofDescription = proof.description ? getI18nText(proof.description, language) : null;
                    const statusDisplay = getStatusDisplay(proof.currentStatus);
                    const canDelete = proof.currentStatus !== 'in_review';
                    
                    return (
                      <div key={proof.id} className="proof-item">
                        {proofImageUrl && (
                          <div 
                            className="proof-image"
                            onClick={() => setLightboxImage(proofImageUrl)}
                            style={{ cursor: 'pointer' }}
                          >
                            <img 
                              src={proofImageUrl} 
                              alt={proofDescription || 'Proof'} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="proof-content">
                          {statusDisplay && (
                            <div className={`proof-status ${statusDisplay.class}`}>
                              {statusDisplay.icon && <span className="status-icon">{statusDisplay.icon}</span>}
                              <span className="status-text">{statusDisplay.text}</span>
                            </div>
                          )}
                          {proof.url && (
                            <div className="proof-url">
                              <strong>{language === 'en' ? 'URL: ' : language === 'ua' ? 'URL: ' : 'URL: '}</strong>
                              <a 
                                href={proof.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="proof-link"
                              >
                                {proof.url}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            </div>
                          )}
                          {proofDescription && (
                            <div className="proof-description">
                              <strong>{language === 'en' ? 'Description: ' : language === 'ua' ? 'Опис: ' : 'Описание: '}</strong>
                              <span>{proofDescription}</span>
                            </div>
                          )}
                          <div className="proof-date">
                            {language === 'en' ? 'Created: ' : language === 'ua' ? 'Створено: ' : 'Создано: '}
                            {new Date(proof.createdAt).toLocaleDateString(language === 'ua' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProof(proof.id, proof.currentStatus)}
                          className="proof-delete-button"
                          disabled={!canDelete}
                          title={canDelete 
                            ? (language === 'en' ? 'Delete' : language === 'ua' ? 'Видалити' : 'Удалить')
                            : (language === 'en' ? 'Cannot delete while in review' : language === 'ua' ? 'Неможливо видалити під час перевірки' : 'Невозможно удалить во время проверки')
                          }
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="creator-card-section creator-card-section-bottom">
            <div style={{ display: 'flex', justifyContent: rating != null ? 'space-between' : 'flex-end', alignItems: 'flex-start' }}>
              {rating != null && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SCORE
                  </div>
                  <div style={{ fontSize: '1.25rem', color: scoreColor, fontWeight: '500' }}>
                    {rating}
                  </div>
                </div>
              )}
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
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={lightboxImage}
              alt="Full size"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '0.5rem',
              }}
            />
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-2.5rem',
                right: 0,
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              aria-label={language === 'en' ? 'Close' : language === 'ua' ? 'Закрити' : 'Закрыть'}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
