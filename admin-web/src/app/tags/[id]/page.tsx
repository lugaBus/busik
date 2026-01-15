'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { tagsApi, Tag, CreateTagDto } from '@/api/tags';
import { authService } from '@/auth/auth.service';
import { createI18nText, I18nText, Language } from '@/utils/i18n';

export default function TagFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isEdit = id !== 'new';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [editLanguage, setEditLanguage] = useState<Language>('ua');
  const [formData, setFormData] = useState<CreateTagDto>({
    name: createI18nText(),
    slug: '',
    description: createI18nText(),
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (isEdit) {
      loadTag();
    }
  }, [router, id]);

  const loadTag = async () => {
    try {
      setLoading(true);
      const tag = await tagsApi.getById(id);
      setFormData({
        name: tag.name || createI18nText(),
        slug: tag.slug,
        description: tag.description || createI18nText(),
      });
    } catch (error) {
      console.error('Failed to load tag:', error);
      alert('Failed to load tag');
      router.push('/tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await tagsApi.update(id, formData);
      } else {
        await tagsApi.create(formData);
      }
      router.push('/tags');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.message || 'Failed to save tag');
    } finally {
      setSaving(false);
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

  return (
    <div
      style={{
        padding: '2rem',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => router.push('/')}
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
                  ← Home
                </button>
                <button
                  onClick={() => router.push('/tags')}
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
                  ← Back to List
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>
                  {isEdit ? 'Edit' : 'Create'} Tag
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Edit Language:
                  </label>
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value as Language)}
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

      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {isEdit && (
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ID: </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{id}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Name * (i18n)
            </label>
            <input
              type="text"
              value={formData.name?.[editLanguage] || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                name: { 
                  ...formData.name, 
                  [editLanguage]: e.target.value 
                } 
              })}
              required
              placeholder={`Enter name in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
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
              Slug
            </label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="Auto-generated from name if empty"
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Leave empty to auto-generate from name
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Description (i18n)
            </label>
            <textarea
              value={formData.description?.[editLanguage] || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                description: { 
                  ...formData.description || createI18nText(), 
                  [editLanguage]: e.target.value 
                } 
              })}
              rows={4}
              placeholder={`Enter description in ${editLanguage === 'en' ? 'English' : editLanguage === 'ua' ? 'Ukrainian' : 'Russian'}`}
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
              onClick={() => router.push('/tags')}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? 'var(--text-muted)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
