'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { contentCreatorSubmissionsApi, ContentCreatorSubmission, UpdateContentCreatorSubmissionStatusDto, UpdateContentCreatorSubmissionDto } from '@/api/contentCreatorSubmissions';
import { categoriesApi, Category } from '@/api/categories';
import { ratiosApi, Ratio } from '@/api/ratios';
import { proofSubmissionsApi, ProofSubmission, UpdateProofSubmissionStatusDto, UpdateProofSubmissionDto } from '@/api/proofSubmissions';
import apiClient from '@/api/client';
import { authService } from '@/auth/auth.service';
import { getI18nText, createI18nText, Language, I18nText } from '@/utils/i18n';
import { parseApiError } from '@/utils/errorHandler';

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<ContentCreatorSubmission | null>(null);
  const [proofSubmissions, setProofSubmissions] = useState<ProofSubmission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ratios, setRatios] = useState<Ratio[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('ua');
  const [editLanguage, setEditLanguage] = useState<Language>('ua');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<UpdateContentCreatorSubmissionDto>({});
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [editingProofId, setEditingProofId] = useState<string | null>(null);
  const [proofFormData, setProofFormData] = useState<Record<string, UpdateProofSubmissionDto>>({});
  const [savingProof, setSavingProof] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, submissionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [submissionData, categoriesData, ratiosData] = await Promise.all([
        contentCreatorSubmissionsApi.getById(submissionId),
        categoriesApi.getAll(),
        ratiosApi.getAll(),
      ]);
      setSubmission(submissionData);
      setCategories(categoriesData);
      setRatios(ratiosData);

      // Initialize form data
      if (submissionData) {
        setFormData({
          name: submissionData.name,
          quote: submissionData.quote || createI18nText(),
          description: submissionData.description || createI18nText(),
          locale: submissionData.locale,
          mainLink: submissionData.mainLink,
          photoUrls: submissionData.photoUrls,
          rating: submissionData.rating,
          contentFormats: submissionData.contentFormats || [],
          tone: submissionData.tone,
          audience: submissionData.audience,
          metrics: submissionData.metrics,
          piterTest: submissionData.piterTest,
          categoryIds: submissionData.categoryIds || [],
          tagIds: submissionData.tagIds || [],
          ratioIds: submissionData.ratioIds || [],
          platforms: submissionData.platforms || [],
        });
        setPhotoUrls(submissionData.photoUrls || []);
      }

      // Load proof submissions for this submission
      if (submissionData) {
        try {
          const response = await apiClient.get(`/admin/content-creators/submissions/${submissionId}/proof-submissions`);
          setProofSubmissions(response.data || []);
        } catch (error) {
          console.error('Failed to load proof submissions:', error);
          setProofSubmissions([]);
        }
      }
    } catch (error: any) {
      console.error('Failed to load submission:', error);
      alert(parseApiError(error, language).message);
      router.push('/content-creators/submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'submitted' | 'in_review' | 'accepted' | 'declined') => {
    if (!submission) return;
    
    try {
      setUpdatingStatus(true);
      const updated = await contentCreatorSubmissionsApi.updateStatus(submission.id, { status });
      setSubmission(updated);
      alert(`Status updated to ${status}`);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(parseApiError(error, language).message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!submission) return;
    if (!confirm('Are you sure you want to permanently delete this submission?')) {
      return;
    }
    try {
      setDeleting(true);
      await contentCreatorSubmissionsApi.delete(submission.id);
      alert('Submission deleted successfully');
      router.push('/content-creators/submissions');
    } catch (error: any) {
      console.error('Failed to delete submission:', error);
      alert(parseApiError(error, language).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateProofStatus = async (proofId: string, status: 'submitted' | 'in_review' | 'accepted' | 'declined') => {
    if (!submission) return;
    
    try {
      const response = await apiClient.patch(
        `/admin/content-creators/submissions/${submission.id}/proof-submissions/${proofId}/status`,
        { status }
      );
      setProofSubmissions(proofSubmissions.map(p => p.id === proofId ? response.data : p));
      alert(`Proof submission status updated to ${status}`);
    } catch (error: any) {
      console.error('Failed to update proof submission status:', error);
      alert(parseApiError(error, language).message);
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!submission) return;
    if (!confirm('Are you sure you want to permanently delete this proof submission?')) {
      return;
    }
    try {
      await apiClient.delete(`/admin/content-creators/submissions/${submission.id}/proof-submissions/${proofId}`);
      setProofSubmissions(proofSubmissions.filter(p => p.id !== proofId));
      alert('Proof submission deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete proof submission:', error);
      alert(parseApiError(error, language).message);
    }
  };

  const handleEditProof = (proof: ProofSubmission) => {
    setEditingProofId(proof.id);
    setProofFormData({
      [proof.id]: {
        url: proof.url || '',
        imageUrl: proof.imageUrl || '',
        description: proof.description || createI18nText(),
      },
    });
  };

  const handleCancelEditProof = (proofId: string) => {
    setEditingProofId(null);
    setProofFormData({});
  };

  const handleSaveProof = async (proofId: string) => {
    if (!submission) return;
    try {
      setSavingProof(proofId);
      const updated = await proofSubmissionsApi.updateForSubmission(
        submission.id,
        proofId,
        proofFormData[proofId]
      );
      setProofSubmissions(proofSubmissions.map(p => p.id === proofId ? updated : p));
      setEditingProofId(null);
      setProofFormData({});
      alert('Proof submission updated successfully');
    } catch (error: any) {
      console.error('Failed to update proof submission:', error);
      alert(parseApiError(error, language).message);
    } finally {
      setSavingProof(null);
    }
  };

  const handleSave = async () => {
    if (!submission) return;
    
    try {
      setSaving(true);
      const updated = await contentCreatorSubmissionsApi.update(submission.id, formData);
      setSubmission(updated);
      // Update form data with the response
      setFormData({
        name: updated.name,
        quote: updated.quote || createI18nText(),
        description: updated.description || createI18nText(),
        locale: updated.locale,
        mainLink: updated.mainLink,
        photoUrls: updated.photoUrls,
        rating: updated.rating,
        contentFormats: updated.contentFormats || [],
        tone: updated.tone,
        audience: updated.audience,
        metrics: updated.metrics,
        piterTest: updated.piterTest,
        categoryIds: updated.categoryIds || [],
        tagIds: updated.tagIds || [],
        ratioIds: updated.ratioIds || [],
        platforms: updated.platforms || [],
      });
      setPhotoUrls(updated.photoUrls || []);
      setIsEditing(false);
      alert('Submission updated successfully');
    } catch (error: any) {
      console.error('Failed to update submission:', error);
      alert(parseApiError(error, language).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!submission) return;
    // Reset form data to original submission data
    setFormData({
      name: submission.name,
      quote: submission.quote || createI18nText(),
      description: submission.description || createI18nText(),
      locale: submission.locale,
      mainLink: submission.mainLink,
      photoUrls: submission.photoUrls,
      rating: submission.rating,
      contentFormats: submission.contentFormats || [],
      tone: submission.tone,
      audience: submission.audience,
      metrics: submission.metrics,
      piterTest: submission.piterTest,
      categoryIds: submission.categoryIds || [],
      tagIds: submission.tagIds || [],
      ratioIds: submission.ratioIds || [],
      platforms: submission.platforms || [],
    });
    setPhotoUrls(submission.photoUrls || []);
    setIsEditing(false);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!submission) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoUrls.length >= 4) {
      alert('Maximum 4 photos allowed');
      e.target.value = '';
      return;
    }

    try {
      setUploadingPhotoIndex(photoUrls.length);
      const updated = await contentCreatorSubmissionsApi.addPhoto(submission.id, file);
      setPhotoUrls(updated.photoUrls || []);
      setFormData({ ...formData, photoUrls: updated.photoUrls || [] });
      setSubmission(updated);
      alert('Photo uploaded successfully');
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      alert(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhotoIndex(null);
      e.target.value = '';
    }
  };

  const handlePhotoRemove = async (photoIndex: number) => {
    if (!submission) return;
    if (!confirm('Are you sure you want to remove this photo?')) {
      return;
    }

    try {
      await contentCreatorSubmissionsApi.removePhoto(submission.id, photoIndex);
      const newPhotoUrls = photoUrls.filter((_, i) => i !== photoIndex);
      setPhotoUrls(newPhotoUrls);
      setFormData({ ...formData, photoUrls: newPhotoUrls });
      // Reload submission to get updated data
      const updated = await contentCreatorSubmissionsApi.getById(submission.id);
      setSubmission(updated);
      alert('Photo removed successfully');
    } catch (error: any) {
      console.error('Failed to remove photo:', error);
      alert(error.response?.data?.message || 'Failed to remove photo');
    }
  };

  const getStatusDisplay = (status?: string | null) => {
    if (!status) return { text: 'Unknown', color: '#6b7280' };
    switch (status) {
      case 'submitted': return { text: 'Submitted', color: '#6366f1' };
      case 'in_review': return { text: 'In Review', color: '#fb923c' };
      case 'accepted': return { text: 'Accepted', color: '#10b981' };
      case 'declined': return { text: 'Declined', color: '#ef4444' };
      case 'deleted_by_user': return { text: 'Deleted by User', color: '#6b7280' };
      default: return { text: status, color: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <p>Submission not found</p>
        <button
          onClick={() => router.push('/content-creators/submissions')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginTop: '1rem',
          }}
        >
          Back to Submissions
        </button>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(submission.currentStatus);
  // Show user email if authenticated, and also show anonymous ID if exists
  let submitterInfo = 'Unknown';
  if (submission.user && submission.user.id) {
    // User is authenticated - show email and UUID
    const userName = `${submission.user.firstName || ''} ${submission.user.lastName || ''}`.trim();
    submitterInfo = `${submission.user.email} (${submission.user.id})`;
    if (userName) {
      submitterInfo = `${userName} - ${submitterInfo}`;
    }
    // Also show anonymous ID if exists (user might have added things anonymously before)
    if (submission.anonymousSession && submission.anonymousSession.submitterId) {
      submitterInfo += ` [Anonymous: ${submission.anonymousSession.submitterId}]`;
    } else if (submission.anonymousSessionId) {
      submitterInfo += ` [Anonymous: ${submission.anonymousSessionId}]`;
    }
  } else if (submission.userId) {
    // userId exists but user relation not loaded
    submitterInfo = `User (${submission.userId})`;
    if (submission.anonymousSession && submission.anonymousSession.submitterId) {
      submitterInfo += ` [Anonymous: ${submission.anonymousSession.submitterId}]`;
    } else if (submission.anonymousSessionId) {
      submitterInfo += ` [Anonymous: ${submission.anonymousSessionId}]`;
    }
  } else if (submission.anonymousSession && submission.anonymousSession.submitterId) {
    submitterInfo = `Anonymous (${submission.anonymousSession.submitterId})`;
  } else if (submission.anonymousSessionId) {
    submitterInfo = `Anonymous (${submission.anonymousSessionId})`;
  }

  const categoryNames = submission.categoryIds
    ? submission.categoryIds.map(id => {
        const category = categories.find(c => c.id === id);
        return category ? getI18nText(category.name as any, language) : id;
      })
    : [];

  const ratioNames = submission.ratioIds
    ? submission.ratioIds.map(id => {
        const ratio = ratios.find(r => r.id === id);
        return ratio ? getI18nText(ratio.name, language) : id;
      })
    : [];

  return (
    <div
      style={{
        padding: '2rem',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/content-creators/submissions')}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            ← Back to Submissions
          </button>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>
            Submission Details
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '0.5rem 1rem',
                  background: saving ? 'var(--text-muted)' : '#10b981',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--text-primary)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Language:
            </label>
            <select
              value={isEditing ? editLanguage : language}
              onChange={(e) => {
                if (isEditing) {
                  setEditLanguage(e.target.value as Language);
                } else {
                  setLanguage(e.target.value as Language);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="en">English</option>
              <option value="ua">Українська</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        {/* Basic Info */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
            Basic Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                ID
              </label>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {submission.id}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Status
              </label>
              <div>
                <span
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    background: `${statusDisplay.color}20`,
                    color: statusDisplay.color,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  {statusDisplay.text}
                </span>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name?.[editLanguage] || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: {
                        ...(formData.name || submission.name),
                        [editLanguage]: e.target.value,
                      },
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: '500',
                  }}
                />
              ) : (
                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: '500' }}>
                  {getI18nText(submission.name, language)}
                </div>
              )}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Quote
              </label>
              {isEditing ? (
                <textarea
                  value={formData.quote?.[editLanguage] || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      quote: {
                        en: (formData.quote || submission.quote || {}).en || '',
                        ua: (formData.quote || submission.quote || {}).ua || '',
                        ru: (formData.quote || submission.quote || {}).ru || '',
                        [editLanguage]: e.target.value,
                      },
                    });
                  }}
                  rows={3}
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
              ) : (
                submission.quote && Object.keys(submission.quote).length > 0 ? (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                    {getI18nText(submission.quote, language)}
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No quote
                  </div>
                )
              )}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description?.[editLanguage] || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      description: {
                        en: (formData.description || submission.description || {}).en || '',
                        ua: (formData.description || submission.description || {}).ua || '',
                        ru: (formData.description || submission.description || {}).ru || '',
                        [editLanguage]: e.target.value,
                      },
                    });
                  }}
                  rows={5}
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
              ) : (
                submission.description && Object.keys(submission.description).length > 0 ? (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                    {getI18nText(submission.description, language)}
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No description
                  </div>
                )
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Locale
              </label>
              {isEditing ? (
                <select
                  value={formData.locale || submission.locale}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      locale: e.target.value,
                    });
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
                  <option value="uk-UA">uk-UA</option>
                  <option value="en-US">en-US</option>
                  <option value="ru-RU">ru-RU</option>
                </select>
              ) : (
                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                  {submission.locale}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Rating
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.rating ?? submission.rating ?? ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      rating: e.target.value ? parseFloat(e.target.value) : undefined,
                    });
                  }}
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
              ) : (
                <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                  {submission.rating ? `${submission.rating}/10` : '-'}
                </div>
              )}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Main Link
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.mainLink || submission.mainLink || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      mainLink: e.target.value || undefined,
                    });
                  }}
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
              ) : (
                submission.mainLink ? (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                    <a href={submission.mainLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>
                      {submission.mainLink}
                    </a>
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No main link
                  </div>
                )
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Submitted By
              </label>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {submitterInfo}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Created At
              </label>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {new Date(submission.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Updated At
              </label>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {new Date(submission.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
            Photos ({photoUrls.length}/4)
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            {photoUrls.map((photoUrl, index) => (
              <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={buildResourceUrl(photoUrl) || ''}
                  alt={`Photo ${index + 1}`}
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {isEditing && (
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
                    title="Remove photo"
                  >
                    −
                  </button>
                )}
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
                    Uploading...
                  </div>
                )}
              </div>
            ))}
            {isEditing && photoUrls.length < 4 && (
              <label
                style={{
                  width: '150px',
                  height: '150px',
                  border: '2px dashed var(--border)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingPhotoIndex === null ? 'pointer' : 'not-allowed',
                  background: uploadingPhotoIndex === null ? 'var(--bg-secondary)' : 'var(--bg-input)',
                  opacity: uploadingPhotoIndex === null ? 1 : 0.6,
                  fontSize: '2rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handlePhotoSelect}
                  disabled={uploadingPhotoIndex !== null}
                  style={{ display: 'none' }}
                />
                +
              </label>
            )}
          </div>
          {isEditing && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP. Maximum 4 photos allowed.
            </p>
          )}
        </div>

        {/* Categories */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
            Categories
          </h2>
          {isEditing ? (
            <>
              <select
                multiple
                value={formData.categoryIds || submission.categoryIds || []}
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
                  cursor: 'pointer',
                }}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getI18nText(category.name as any, editLanguage)}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Hold Ctrl/Cmd to select multiple categories
              </p>
            </>
          ) : (
            categoryNames.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {categoryNames.map((name, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No categories</p>
            )
          )}
        </div>

        {/* Ratios */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
            Ratios
          </h2>
          {isEditing ? (
            <>
              <select
                multiple
                value={formData.ratioIds || submission.ratioIds || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                  setFormData({ ...formData, ratioIds: selected });
                }}
                style={{ width: '100%' }}
              >
                {ratios.length === 0 ? (
                  <option disabled>No ratios available</option>
                ) : (
                  ratios.map((ratio) => (
                    <option key={ratio.id} value={ratio.id}>
                      {getI18nText(ratio.name, editLanguage)}
                    </option>
                  ))
                )}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {ratios.length === 0 
                  ? 'No ratios available'
                  : 'Hold Ctrl/Cmd to select multiple ratios'}
              </p>
            </>
          ) : (
            ratioNames.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ratioNames.map((name, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No ratios</p>
            )
          )}
        </div>

        {/* Proof Submissions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
            Proof Submissions ({proofSubmissions.length})
          </h2>
          {proofSubmissions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No proof submissions
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {proofSubmissions.map((proof) => {
                const proofStatus = getStatusDisplay(proof.currentStatus);
                const isEditing = editingProofId === proof.id;
                const formData = proofFormData[proof.id] || {};
                return (
                  <div
                    key={proof.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status: </strong>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              background: `${proofStatus.color}20`,
                              color: proofStatus.color,
                              fontSize: '0.75rem',
                              fontWeight: '500',
                            }}
                          >
                            {proofStatus.text}
                          </span>
                        </div>
                        {isEditing ? (
                          <>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                URL
                              </label>
                              <input
                                type="url"
                                value={formData.url || ''}
                                onChange={(e) => {
                                  setProofFormData({
                                    ...proofFormData,
                                    [proof.id]: {
                                      ...formData,
                                      url: e.target.value || undefined,
                                    },
                                  });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid var(--border)',
                                  borderRadius: '0.25rem',
                                  background: 'var(--bg-input)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.875rem',
                                }}
                                placeholder="https://example.com"
                              />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                Image URL
                              </label>
                              <input
                                type="text"
                                value={formData.imageUrl || ''}
                                onChange={(e) => {
                                  setProofFormData({
                                    ...proofFormData,
                                    [proof.id]: {
                                      ...formData,
                                      imageUrl: e.target.value || undefined,
                                    },
                                  });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid var(--border)',
                                  borderRadius: '0.25rem',
                                  background: 'var(--bg-input)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.875rem',
                                }}
                                placeholder="/public/uploads/proofs/image.jpg"
                              />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                Description ({editLanguage})
                              </label>
                              <textarea
                                value={formData.description?.[editLanguage] || ''}
                                onChange={(e) => {
                                  setProofFormData({
                                    ...proofFormData,
                                    [proof.id]: {
                                      ...formData,
                                      description: {
                                        en: (formData.description || proof.description || {}).en || '',
                                        ua: (formData.description || proof.description || {}).ua || '',
                                        ru: (formData.description || proof.description || {}).ru || '',
                                        [editLanguage]: e.target.value,
                                      },
                                    },
                                  });
                                }}
                                rows={3}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid var(--border)',
                                  borderRadius: '0.25rem',
                                  background: 'var(--bg-input)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.875rem',
                                  resize: 'vertical',
                                }}
                                placeholder="Enter description"
                              />
                            </div>
                            {formData.imageUrl && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <img
                                  src={buildResourceUrl(formData.imageUrl) || ''}
                                  alt="Proof preview"
                                  style={{
                                    maxWidth: '300px',
                                    maxHeight: '300px',
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
                          </>
                        ) : (
                          <>
                            {proof.url && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>URL: </strong>
                                <a href={proof.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                                  {proof.url}
                                </a>
                              </div>
                            )}
                            {proof.description && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Description: </strong>
                                <span style={{ fontSize: '0.875rem' }}>{getI18nText(proof.description, language)}</span>
                              </div>
                            )}
                            {proof.imageUrl && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <img
                                  src={buildResourceUrl(proof.imageUrl) || ''}
                                  alt="Proof"
                                  style={{
                                    maxWidth: '300px',
                                    maxHeight: '300px',
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
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveProof(proof.id)}
                              disabled={savingProof === proof.id}
                              style={{
                                padding: '0.5rem 1rem',
                                background: savingProof === proof.id ? 'var(--text-muted)' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: savingProof === proof.id ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem',
                                opacity: savingProof === proof.id ? 0.6 : 1,
                              }}
                            >
                              {savingProof === proof.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleCancelEditProof(proof.id)}
                              disabled={savingProof === proof.id}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '0.25rem',
                                color: 'var(--text-primary)',
                                cursor: savingProof === proof.id ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditProof(proof)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleUpdateProofStatus(proof.id, 'submitted')}
                              disabled={proof.currentStatus === 'submitted'}
                              style={{
                                padding: '0.5rem 1rem',
                                background: proof.currentStatus === 'submitted' ? 'var(--text-muted)' : '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: proof.currentStatus === 'submitted' ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem',
                                opacity: proof.currentStatus === 'submitted' ? 0.6 : 1,
                              }}
                            >
                              Submitted
                            </button>
                            <button
                              onClick={() => handleUpdateProofStatus(proof.id, 'in_review')}
                              disabled={proof.currentStatus === 'in_review'}
                              style={{
                                padding: '0.5rem 1rem',
                                background: proof.currentStatus === 'in_review' ? 'var(--text-muted)' : '#fb923c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: proof.currentStatus === 'in_review' ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem',
                                opacity: proof.currentStatus === 'in_review' ? 0.6 : 1,
                              }}
                            >
                              In Review
                            </button>
                            <button
                              onClick={() => handleUpdateProofStatus(proof.id, 'accepted')}
                              disabled={proof.currentStatus === 'accepted'}
                              style={{
                                padding: '0.5rem 1rem',
                                background: proof.currentStatus === 'accepted' ? 'var(--text-muted)' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: proof.currentStatus === 'accepted' ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem',
                                opacity: proof.currentStatus === 'accepted' ? 0.6 : 1,
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateProofStatus(proof.id, 'declined')}
                              disabled={proof.currentStatus === 'declined'}
                              style={{
                                padding: '0.5rem 1rem',
                                background: proof.currentStatus === 'declined' ? 'var(--text-muted)' : '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: proof.currentStatus === 'declined' ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem',
                                opacity: proof.currentStatus === 'declined' ? 0.6 : 1,
                              }}
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleDeleteProof(proof.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
          padding: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>
          Actions
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleUpdateStatus('submitted')}
            disabled={submission.currentStatus === 'submitted' || updatingStatus}
            style={{
              padding: '0.75rem 1.5rem',
              background: submission.currentStatus === 'submitted' ? 'var(--text-muted)' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: submission.currentStatus === 'submitted' || updatingStatus ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: submission.currentStatus === 'submitted' || updatingStatus ? 0.6 : 1,
            }}
          >
            Set to Submitted
          </button>
          <button
            onClick={() => handleUpdateStatus('in_review')}
            disabled={submission.currentStatus === 'in_review' || updatingStatus}
            style={{
              padding: '0.75rem 1.5rem',
              background: submission.currentStatus === 'in_review' ? 'var(--text-muted)' : '#fb923c',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: submission.currentStatus === 'in_review' || updatingStatus ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: submission.currentStatus === 'in_review' || updatingStatus ? 0.6 : 1,
            }}
          >
            Set to In Review
          </button>
          <button
            onClick={() => handleUpdateStatus('accepted')}
            disabled={submission.currentStatus === 'accepted' || updatingStatus}
            style={{
              padding: '0.75rem 1.5rem',
              background: submission.currentStatus === 'accepted' ? 'var(--text-muted)' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: submission.currentStatus === 'accepted' || updatingStatus ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: submission.currentStatus === 'accepted' || updatingStatus ? 0.6 : 1,
            }}
          >
            Accept
          </button>
          <button
            onClick={() => handleUpdateStatus('declined')}
            disabled={submission.currentStatus === 'declined' || updatingStatus}
            style={{
              padding: '0.75rem 1.5rem',
              background: submission.currentStatus === 'declined' ? 'var(--text-muted)' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: submission.currentStatus === 'declined' || updatingStatus ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: submission.currentStatus === 'declined' || updatingStatus ? 0.6 : 1,
            }}
          >
            Decline
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
