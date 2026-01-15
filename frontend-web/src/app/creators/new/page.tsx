'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { contentCreatorSubmissionsApi, CreateContentCreatorSubmissionDto } from '@/api/contentCreatorSubmissions';
import { contentCreatorsApi } from '@/api/contentCreators';
import { proofSubmissionsApi, CreateProofSubmissionDto, ProofSubmission } from '@/api/proofSubmissions';
import { getI18nText, getBrowserLanguage, Language, createI18nText } from '@/utils/i18n';
import { authService } from '@/auth/auth.service';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { parseApiError } from '@/utils/errorHandler';
import Logo from '@/components/Logo';

export default function NewCreatorSubmissionPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('ua');
  const [user, setUser] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [ratios, setRatios] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  
  // Proofs state
  const [proofs, setProofs] = useState<ProofSubmission[]>([]);
  const [showProofModal, setShowProofModal] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [uploadingProofImage, setUploadingProofImage] = useState(false);
  const [proofForm, setProofForm] = useState<CreateProofSubmissionDto>({
    contentCreatorSubmissionId: undefined,
    url: '',
    imageUrl: '',
    description: createI18nText(),
  });

  const [selectedRatioId, setSelectedRatioId] = useState<string>('');
  const [formData, setFormData] = useState<CreateContentCreatorSubmissionDto>({
    name: createI18nText(),
    quote: createI18nText(),
    description: createI18nText(),
    locale: 'uk-UA',
    mainLink: '',
    rating: undefined,
    categoryIds: [],
    tagIds: [],
    ratioIds: [], // Will be set from selectedRatioId when submitting
    contentFormats: [],
    tone: 0,
    piterTest: undefined,
    platforms: [],
  });

  useEffect(() => {
    setLanguage(getBrowserLanguage());
    const currentUser = authService.getUser();
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [cats, tgs, rts, plts] = await Promise.all([
        contentCreatorsApi.getCategories().catch((err) => {
          console.error('Failed to load categories:', err);
          return [];
        }),
        contentCreatorsApi.getTags().catch(() => []),
        contentCreatorsApi.getRatios().catch((err) => {
          console.error('Failed to load ratios:', err);
          return [];
        }),
        contentCreatorsApi.getPlatforms().catch(() => []),
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
      setRatios(rts || []);
      setPlatforms(plts || []);
      
      if ((!cats || cats.length === 0) && (!rts || rts.length === 0)) {
        const msg = language === 'en' 
          ? 'Warning: No categories or ratios found. Please check the API connection.' 
          : language === 'ua' 
            ? 'Попередження: Категорії або рейтинги не знайдено. Будь ласка, перевірте підключення до API.'
            : 'Предупреждение: Категории или рейтинги не найдены. Пожалуйста, проверьте подключение к API.';
        console.warn(msg);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      const errorMsg = parseApiError(error as any, language);
      setError(errorMsg.message);
    }
  };
  
  const loadProofs = async () => {
    if (!submissionId) return;
    try {
      const loadedProofs = await proofSubmissionsApi.getByContentCreator(undefined, submissionId);
      setProofs(loadedProofs);
    } catch (error) {
      console.error('Failed to load proofs:', error);
      setProofs([]);
    }
  };
  
  useEffect(() => {
    if (submissionId) {
      loadProofs();
    }
  }, [submissionId]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If submission not created yet, create it first with minimal data
    if (!submissionId) {
      if (!formData.name?.[language] || formData.name[language].trim() === '') {
        const msg = language === 'en' 
          ? 'Please enter a name first before uploading photos' 
          : language === 'ua' 
            ? 'Будь ласка, спочатку введіть ім\'я перед завантаженням фото'
            : 'Пожалуйста, сначала введите имя перед загрузкой фото';
        alert(msg);
        e.target.value = '';
        return;
      }
      
      // Create submission first
      let createdSubmissionId: string;
      try {
        setSubmitting(true);
        const submission = await contentCreatorSubmissionsApi.create({
          ...formData,
          ratioIds: selectedRatioId ? [selectedRatioId] : [],
          name: { ...formData.name, [language]: formData.name[language] || '' },
        }, language);
        createdSubmissionId = submission.id;
        setSubmissionId(createdSubmissionId);
        if (submission.photoUrls) {
          setPhotoUrls(submission.photoUrls);
        }
        // Small delay to ensure database transaction is committed
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error('Failed to create submission:', error);
        const errorMsg = parseApiError(error, language);
        alert(errorMsg.message);
        e.target.value = '';
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
      
      // Use the created submission ID directly
      setUploadingPhotoIndex(index);
      try {
        const updated = await contentCreatorSubmissionsApi.uploadPhoto(createdSubmissionId, file, index);
        setPhotoUrls(updated.photoUrls || []);
      } catch (error: any) {
        console.error('Failed to upload photo:', error);
        const errorMsg = parseApiError(error, language);
        alert(errorMsg.message);
      } finally {
        setUploadingPhotoIndex(null);
        e.target.value = '';
      }
      return;
    }

    // If submission already exists, use existing submissionId
    setUploadingPhotoIndex(index);
    try {
      const updated = await contentCreatorSubmissionsApi.uploadPhoto(submissionId!, file, index);
      setPhotoUrls(updated.photoUrls || []);
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      const errorMsg = parseApiError(error, language);
      alert(errorMsg.message);
    } finally {
      setUploadingPhotoIndex(null);
      e.target.value = '';
    }
  };

  const handlePhotoRemove = async (index: number) => {
    const newPhotoUrls = [...photoUrls];
    newPhotoUrls.splice(index, 1);
    setPhotoUrls(newPhotoUrls);
    if (submissionId) {
      try {
        await contentCreatorSubmissionsApi.update(submissionId, { photoUrls: newPhotoUrls });
      } catch (error: any) {
        console.error('Failed to remove photo:', error);
        const errorMsg = parseApiError(error, language);
        alert(errorMsg.message);
        // Revert on error
        setPhotoUrls(photoUrls);
      }
    }
  };
  
  const handleProofImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImageFile(file);
    }
    e.target.value = '';
  };

  const handleSubmitProof = async () => {
    if (!submissionId) {
      const msg = language === 'en' 
        ? 'Please create the submission first before adding proofs' 
        : language === 'ua' 
          ? 'Будь ласка, спочатку створіть заявку, перш ніж додавати пруфи'
          : 'Пожалуйста, сначала создайте заявку, прежде чем добавлять пруфы';
      alert(msg);
      return;
    }
    
    setSubmittingProof(true);
    try {
      // Send only current language in description
      const descriptionText = proofForm.description?.[language];
      const newProof = await proofSubmissionsApi.create({
        contentCreatorSubmissionId: submissionId,
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
          alert(parseApiError(error, language).message || 'Proof created but failed to upload image');
        } finally {
          setUploadingProofImage(false);
        }
      }

      setProofForm({
        contentCreatorSubmissionId: undefined,
        url: '',
        imageUrl: '',
        description: createI18nText(),
      });
      setProofImageFile(null);
      setShowProofModal(false);
      await loadProofs();
    } catch (error: any) {
      console.error('Failed to submit proof:', error);
      const errorMsg = parseApiError(error, language);
      alert(errorMsg.message);
    } finally {
      setSubmittingProof(false);
    }
  };
  
  const handleDeleteProof = async (proofId: string, currentStatus?: string | null) => {
    if (currentStatus && currentStatus !== 'submitted') {
      const msg = language === 'en' 
        ? 'This proof cannot be deleted because it is being reviewed or has been processed.' 
        : language === 'ua' 
          ? 'Цей пруф не можна видалити, оскільки він перевіряється або вже оброблений.'
          : 'Этот пруф нельзя удалить, так как он проверяется или уже обработан.';
      alert(msg);
      return;
    }
    
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this proof?' : language === 'ua' ? 'Ви впевнені, що хочете видалити цей пруф?' : 'Вы уверены, что хотите удалить этот пруф?')) {
      return;
    }
    
    try {
      await proofSubmissionsApi.delete(proofId);
      setProofs(proofs.filter(p => p.id !== proofId));
    } catch (error: any) {
      console.error('Failed to delete proof:', error);
      const errorMsg = parseApiError(error, language);
      alert(errorMsg.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Debug logging
    const token = authService.getToken();
    const currentUser = authService.getUser();
    console.log('[NewCreatorSubmissionPage] handleSubmit', {
      hasToken: !!token,
      tokenLength: token?.length,
      hasUser: !!currentUser,
      userEmail: currentUser?.email,
      userId: currentUser?.id,
    });

    try {
      const submission = await contentCreatorSubmissionsApi.create({
        ...formData,
        ratioIds: selectedRatioId ? [selectedRatioId] : [],
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      }, language);
      
      setSubmissionId(submission.id);
      // Update photoUrls from response
      if (submission.photoUrls) {
        setPhotoUrls(submission.photoUrls);
      }
      
      // Don't redirect immediately - allow user to add photos and proofs
      setSuccess(false);
      const msg = language === 'en' 
        ? 'Submission created successfully! You can now add photos and proofs, or submit to complete.' 
        : language === 'ua' 
          ? 'Заявку успішно створено! Тепер ви можете додати фото та пруфи, або надіслати для завершення.'
          : 'Заявка успешно создана! Теперь вы можете добавить фото и пруфы, или отправить для завершения.';
      alert(msg);
    } catch (error: any) {
      console.error('Failed to submit:', error);
      const errorMsg = parseApiError(error, language);
      setError(errorMsg.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleFinalSubmit = async () => {
    // Final submit - redirect to home
    setSuccess(true);
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    router.push('/');
  };

  if (success) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {language === 'en' ? 'Submission Successful!' : language === 'ua' ? 'Відправка успішна!' : 'Отправка успешна!'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {language === 'en' 
              ? 'Your content creator submission has been received and will be reviewed by our team.'
              : language === 'ua'
                ? 'Вашу заявку на додавання контент-мейкера отримано, і вона буде розглянута нашою командою.'
                : 'Ваша заявка на добавление контент-мейкера получена и будет рассмотрена нашей командой.'}
          </p>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            {language === 'en' ? '← Back to home' : language === 'ua' ? '← Назад на головну' : '← Назад на главную'}
          </Link>
        </div>
      </div>
    );
  }

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
                opacity: 0.6,
                cursor: 'default',
              }}
              onClick={(e) => e.preventDefault()}
              title={language === 'en' ? 'You are already on the add page' : language === 'ua' ? 'Ви вже на сторінці додавання' : 'Вы уже на странице добавления'}
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
                <button onClick={handleLogout} className="auth-button">
                  {language === 'en' ? 'Logout' : language === 'ua' ? 'Вийти' : 'Выйти'}
                </button>
              </>
            ) : (
              <Link href="/login" className="auth-button">
                {language === 'en' ? 'Login' : language === 'ua' ? 'Увійти' : 'Войти'}
              </Link>
            )}
            <ThemeToggle />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="language-selector"
            >
              <option value="en">EN</option>
              <option value="ua">UA</option>
              <option value="ru">RU</option>
            </select>
          </div>
        </div>
      </header>

      <main className="app-main" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" className="back-link">
            {language === 'en' ? '← Back to list' : language === 'ua' ? '← Назад до списку' : '← Назад к списку'}
          </Link>
        </div>

        <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
          {language === 'en' ? 'Submit New Content Creator' : language === 'ua' ? 'Відправити нового контент-мейкера' : 'Отправить нового контент-мейкера'}
        </h1>

        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '0.5rem',
            color: '#ef4444',
            marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Name *' : language === 'ua' ? 'Ім\'я *' : 'Имя *'}
            </label>
            <input
              type="text"
              value={formData.name?.[language] || ''}
              onChange={(e) => setFormData({
                ...formData,
                name: {
                  ...formData.name,
                  [language]: e.target.value,
                },
              })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Quote */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Quote' : language === 'ua' ? 'Цитата' : 'Цитата'}
            </label>
            <textarea
              value={formData.quote?.[language] || ''}
              onChange={(e) => setFormData({
                ...formData,
                quote: {
                  ...(formData.quote || createI18nText()),
                  [language]: e.target.value,
                },
              })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Description' : language === 'ua' ? 'Опис' : 'Описание'}
            </label>
            <textarea
              value={formData.description?.[language] || ''}
              onChange={(e) => setFormData({
                ...formData,
                description: {
                  ...(formData.description || createI18nText()),
                  [language]: e.target.value,
                },
              })}
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Main Link */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Main Link' : language === 'ua' ? 'Основне посилання' : 'Основная ссылка'}
            </label>
            <input
              type="url"
              value={formData.mainLink || ''}
              onChange={(e) => setFormData({ ...formData, mainLink: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Photos Section */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Photos (max 4)' : language === 'ua' ? 'Фото (макс. 4)' : 'Фото (макс. 4)'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              {photoUrls.map((photoUrl, index) => (
                <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${photoUrl}`}
                    alt={`Photo ${index + 1}`}
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(index)}
                    style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.25rem',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(220, 38, 38, 0.9)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      lineHeight: '1',
                      padding: 0,
                      fontWeight: 'bold',
                    }}
                    title={language === 'en' ? 'Remove photo' : language === 'ua' ? 'Видалити фото' : 'Удалить фото'}
                  >
                    −
                  </button>
                  {uploadingPhotoIndex === index && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                      }}
                    >
                      {language === 'en' ? 'Uploading...' : language === 'ua' ? 'Завантаження...' : 'Загрузка...'}
                    </div>
                  )}
                </div>
              ))}
              {photoUrls.length < 4 && (
                <label
                  style={{
                    width: '150px',
                    height: '150px',
                    border: '2px dashed var(--border)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: uploadingPhotoIndex === null && !submitting ? 'pointer' : 'not-allowed',
                    background: uploadingPhotoIndex === null && !submitting ? 'var(--bg-secondary)' : 'var(--bg-input)',
                    opacity: uploadingPhotoIndex === null && !submitting ? 1 : 0.6,
                    fontSize: '2rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => handlePhotoSelect(e, photoUrls.length)}
                    disabled={uploadingPhotoIndex !== null || submitting}
                    style={{ display: 'none' }}
                  />
                  +
                </label>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {language === 'en' 
                ? 'Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP. Maximum 4 photos allowed. Submission will be created automatically if you upload a photo before submitting.' 
                : language === 'ua' 
                  ? 'Максимальний розмір файлу: 5 МБ. Підтримувані формати: JPG, PNG, GIF, WebP. Дозволено максимум 4 фото. Заявка буде створена автоматично, якщо ви завантажите фото перед відправкою.'
                  : 'Максимальный размер файла: 5 МБ. Поддерживаемые форматы: JPG, PNG, GIF, WebP. Разрешено максимум 4 фото. Заявка будет создана автоматически, если вы загрузите фото перед отправкой.'}
            </p>
          </div>

          {/* Categories */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Categories' : language === 'ua' ? 'Категорії' : 'Категории'}
            </label>
            {categories.length === 0 ? (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}>
                {language === 'en' 
                  ? 'No categories available. Please check the API connection or contact support.' 
                  : language === 'ua' 
                    ? 'Категорії недоступні. Будь ласка, перевірте підключення до API або зверніться до підтримки.'
                    : 'Категории недоступны. Пожалуйста, проверьте подключение к API или обратитесь в поддержку.'}
              </div>
            ) : (
              <>
                <select
                  multiple
                  value={formData.categoryIds || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setFormData({ ...formData, categoryIds: selected });
                  }}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getI18nText(category.name, language)}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {language === 'en' ? 'Hold Ctrl/Cmd to select multiple' : language === 'ua' ? 'Утримуйте Ctrl/Cmd для вибору кількох' : 'Удерживайте Ctrl/Cmd для выбора нескольких'}
                </p>
              </>
            )}
          </div>

          {/* Ratios */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Ratios' : language === 'ua' ? 'Рейтинги' : 'Рейтинги'}
            </label>
            {ratios.length === 0 ? (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
              }}>
                {language === 'en' 
                  ? 'No ratios available. Please check the API connection or contact support.' 
                  : language === 'ua' 
                    ? 'Рейтинги недоступні. Будь ласка, перевірте підключення до API або зверніться до підтримки.'
                    : 'Рейтинги недоступны. Пожалуйста, проверьте подключение к API или обратитесь в поддержку.'}
              </div>
            ) : (
              <>
                <select
                  value={selectedRatioId}
                  onChange={(e) => {
                    setSelectedRatioId(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">{language === 'en' ? 'Select a ratio...' : language === 'ua' ? 'Виберіть рейтинг...' : 'Выберите рейтинг...'}</option>
                  {ratios.map((ratio) => (
                    <option key={ratio.id} value={ratio.id}>
                      {getI18nText(ratio.name, language)}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {language === 'en' ? 'Select a single ratio' : language === 'ua' ? 'Виберіть один рейтинг' : 'Выберите один рейтинг'}
                </p>
              </>
            )}
          </div>

          {/* Rating */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {language === 'en' ? 'Rating (1-10)' : language === 'ua' ? 'Рейтинг (1-10)' : 'Рейтинг (1-10)'}
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.rating || ''}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseInt(e.target.value) : undefined })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Proofs Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500' }}>
                {language === 'en' ? 'Proofs' : language === 'ua' ? 'Пруфи' : 'Пруфы'}
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!submissionId) {
                    const msg = language === 'en' 
                      ? 'Please create the submission first before adding proofs' 
                      : language === 'ua' 
                        ? 'Будь ласка, спочатку створіть заявку перед додаванням пруфів'
                        : 'Пожалуйста, сначала создайте заявку перед добавлением пруфов';
                    alert(msg);
                    return;
                  }
                  setShowProofModal(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: submissionId ? 'var(--accent)' : 'var(--text-muted)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: submissionId ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: submissionId ? 1 : 0.6,
                }}
              >
                + {language === 'en' ? 'Add Proof' : language === 'ua' ? 'Додати пруф' : 'Добавить пруф'}
              </button>
            </div>
              
            {!submissionId ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>
                {language === 'en' 
                  ? 'Create submission first to add proofs. Note: Proofs can only be added after your submission is accepted and becomes a content creator.' 
                  : language === 'ua' 
                    ? 'Спочатку створіть заявку для додавання пруфів. Примітка: Пруфи можна додати лише після того, як вашу заявку буде прийнято і вона стане контент-мейкером.'
                    : 'Сначала создайте заявку для добавления пруфов. Примечание: Пруфы можно добавить только после того, как вашу заявку примут и она станет контент-мейкером.'}
              </p>
            ) : proofs.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>
                {language === 'en' 
                  ? 'No proofs added yet. Note: Proofs can only be added after your submission is accepted and becomes a content creator.' 
                  : language === 'ua' 
                    ? 'Пруфи ще не додані. Примітка: Пруфи можна додати лише після того, як вашу заявку буде прийнято і вона стане контент-мейкером.'
                    : 'Пруфы еще не добавлены. Примечание: Пруфы можно добавить только после того, как вашу заявку примут и она станет контент-мейкером.'}
              </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {proofs.map((proof) => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
                    const proofImageUrl = proof.imageUrl 
                      ? (proof.imageUrl.startsWith('http') ? proof.imageUrl : `${apiUrl}${proof.imageUrl}`)
                      : null;
                    const proofDescription = proof.description ? getI18nText(proof.description, language) : null;
                    return (
                      <div
                        key={proof.id}
                        style={{
                          padding: '1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          {proofImageUrl && (
                            <div style={{ flexShrink: 0 }}>
                              <img
                                src={proofImageUrl}
                                alt="Proof"
                                style={{
                                  width: '120px',
                                  height: '120px',
                                  objectFit: 'cover',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--border)',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            {proof.url && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>URL: </strong>
                                <a href={proof.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>
                                  {proof.url}
                                </a>
                              </div>
                            )}
                            {proofDescription && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description: </strong>
                                <span style={{ fontSize: '0.875rem' }}>{proofDescription}</span>
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                              {language === 'en' ? 'Created: ' : language === 'ua' ? 'Створено: ' : 'Создано: '}
                              {new Date(proof.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteProof(proof.id, proof.currentStatus)}
                            disabled={Boolean(proof.currentStatus && proof.currentStatus !== 'submitted')}
                            style={{
                              padding: '0.5rem 1rem',
                              background: proof.currentStatus && proof.currentStatus !== 'submitted' ? 'var(--text-muted)' : 'var(--error)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: proof.currentStatus && proof.currentStatus !== 'submitted' ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              opacity: proof.currentStatus && proof.currentStatus !== 'submitted' ? 0.6 : 1,
                            }}
                          >
                            {language === 'en' ? 'Delete' : language === 'ua' ? 'Видалити' : 'Удалить'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            {submissionId && (
              <button
                type="button"
                onClick={handleFinalSubmit}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--success, #10b981)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                }}
              >
                {language === 'en' ? 'Complete Submission' : language === 'ua' ? 'Завершити відправку' : 'Завершить отправку'}
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                background: submitting ? 'var(--text-muted)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              {submitting
                ? (language === 'en' ? 'Submitting...' : language === 'ua' ? 'Відправка...' : 'Отправка...')
                : submissionId
                  ? (language === 'en' ? 'Update Submission' : language === 'ua' ? 'Оновити заявку' : 'Обновить заявку')
                  : (language === 'en' ? 'Create Submission' : language === 'ua' ? 'Створити заявку' : 'Создать заявку')}
            </button>
          </div>
        </form>

        {/* Proof Modal */}
        {showProofModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => {
              setShowProofModal(false);
              setProofForm({ contentCreatorSubmissionId: undefined, url: '', imageUrl: '', description: createI18nText() });
              setProofImageFile(null);
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                minWidth: '400px',
                maxWidth: '90%',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                {language === 'en' ? 'Add Proof' : language === 'ua' ? 'Додати пруф' : 'Добавить пруф'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    {language === 'en' ? 'URL (optional)' : language === 'ua' ? 'URL (необов\'язково)' : 'URL (необязательно)'}
                  </label>
                  <input
                    type="text"
                    value={proofForm.url}
                    onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                    placeholder="https://example.com/proof"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    {language === 'en' ? 'Image (optional)' : language === 'ua' ? 'Зображення (необов\'язково)' : 'Изображение (необязательно)'}
                  </label>
                  {proofImageFile && (
                    <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {language === 'en' ? 'Selected: ' : language === 'ua' ? 'Вибрано: ' : 'Выбрано: '}{proofImageFile.name}
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleProofImageSelect}
                    disabled={uploadingProofImage}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      cursor: uploadingProofImage ? 'not-allowed' : 'pointer',
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {language === 'en' ? 'Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP' : language === 'ua' ? 'Максимальний розмір файлу: 5 МБ. Підтримувані формати: JPG, PNG, GIF, WebP' : 'Максимальный размер файла: 5 МБ. Поддерживаемые форматы: JPG, PNG, GIF, WebP'}
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    {language === 'en' ? 'Description' : language === 'ua' ? 'Опис' : 'Описание'}
                  </label>
                  <textarea
                    value={proofForm.description?.[language] || ''}
                    onChange={(e) => setProofForm({ 
                      ...proofForm, 
                      description: { 
                        ...(proofForm.description || createI18nText()), 
                        [language]: e.target.value 
                      } 
                    })}
                    placeholder={language === 'en' ? 'Enter description' : language === 'ua' ? 'Введіть опис' : 'Введите описание'}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProofModal(false);
                      setProofForm({ contentCreatorSubmissionId: undefined, url: '', imageUrl: '', description: createI18nText() });
                      setProofImageFile(null);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    {language === 'en' ? 'Cancel' : language === 'ua' ? 'Скасувати' : 'Отмена'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitProof}
                    disabled={submittingProof || uploadingProofImage}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: (submittingProof || uploadingProofImage) ? 'var(--text-muted)' : 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: (submittingProof || uploadingProofImage) ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    }}
                  >
                    {(submittingProof || uploadingProofImage) 
                      ? (language === 'en' ? 'Submitting...' : language === 'ua' ? 'Відправка...' : 'Отправка...')
                      : (language === 'en' ? 'Add Proof' : language === 'ua' ? 'Додати пруф' : 'Добавить пруф')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
