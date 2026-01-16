'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { contentCreatorSubmissionsApi, ContentCreatorSubmission } from '@/api/contentCreatorSubmissions';
import { categoriesApi, Category } from '@/api/categories';
import { ratiosApi, Ratio } from '@/api/ratios';
import { I18nText } from '@/api/contentCreators';
import { authService } from '@/auth/auth.service';
import { getI18nText, Language } from '@/utils/i18n';

export default function ContentCreatorSubmissionsPage() {
  const router = useRouter();
  const [allSubmissions, setAllSubmissions] = useState<ContentCreatorSubmission[]>([]);
  const [submissions, setSubmissions] = useState<ContentCreatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('ua');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [ratioFilter, setRatioFilter] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [ratios, setRatios] = useState<Ratio[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt' | 'rating' | 'submittedBy' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    limit: 10,
  });

  useEffect(() => {
    // Early return if not authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // Load data
    const loadData = async () => {
      try {
        await Promise.all([
          loadCategories(),
          loadRatios(),
          loadSubmissions(),
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    
    loadData();
  }, [router]);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadRatios = async () => {
    try {
      const data = await ratiosApi.getAll();
      setRatios(data);
    } catch (error) {
      console.error('Failed to load ratios:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      console.log('Loading submissions from API:', '/admin/content-creators/submissions');
      const data = await contentCreatorSubmissionsApi.getAll();
      console.log('Submissions loaded successfully:', data);
      console.log('Submissions count:', data?.length || 0);
      setAllSubmissions(data || []);
    } catch (error: any) {
      console.error('Failed to load submissions:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error message:', errorMessage);
      // Only show alert if it's not the routing error
      if (!errorMessage.includes('Content creator with ID submissions not found')) {
        alert(`Failed to load submissions: ${errorMessage}`);
      }
      setAllSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'name' | 'status' | 'createdAt' | 'rating' | 'submittedBy' | 'default') => {
    if (field === 'default') {
      setSortBy(null);
      setSortOrder('asc');
    } else if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Client-side filtering, sorting and pagination
  useEffect(() => {
    if (allSubmissions.length === 0) {
      setSubmissions([]);
      setPagination({
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      });
      return;
    }

    // Filter
    let filtered = [...allSubmissions];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((submission) => {
        const name = getI18nText(submission.name, language).toLowerCase();
        const id = submission.id.toLowerCase();
        return name.includes(searchLower) || id.includes(searchLower);
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((submission) => submission.currentStatus === statusFilter);
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((submission) => 
        submission.categoryIds && submission.categoryIds.includes(categoryFilter)
      );
    }

    // Ratio filter
    if (ratioFilter) {
      filtered = filtered.filter((submission) => 
        submission.ratioIds && submission.ratioIds.includes(ratioFilter)
      );
    }

    // Sort
    const sorted = [...filtered];
    if (!sortBy) {
      // Default sorting: createdAt desc
      sorted.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate; // createdAt desc
      });
    } else {
      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'name': {
            const aName = getI18nText(a.name, language) || '';
            const bName = getI18nText(b.name, language) || '';
            const cmp = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
            return sortOrder === 'asc' ? cmp : -cmp;
          }
          case 'status': {
            const order = ['submitted', 'in_review', 'accepted', 'declined', 'deleted_by_user'];
            const aStatus = a.currentStatus || '';
            const bStatus = b.currentStatus || '';
            const aIdx = order.indexOf(aStatus);
            const bIdx = order.indexOf(bStatus);
            const aVal = aIdx === -1 ? order.length : aIdx;
            const bVal = bIdx === -1 ? order.length : bIdx;
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
          }
          case 'rating': {
            if (a.rating == null && b.rating == null) return 0;
            if (a.rating == null) return 1;
            if (b.rating == null) return -1;
            return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
          }
          case 'createdAt': {
            const aDate = new Date(a.createdAt).getTime();
            const bDate = new Date(b.createdAt).getTime();
            return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
          }
          case 'submittedBy': {
            const aUser = a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''} ${a.user.email}`.toLowerCase() : 
              a.anonymousSession ? `anonymous ${a.anonymousSession.submitterId}`.toLowerCase() : 'unknown';
            const bUser = b.user ? `${b.user.firstName || ''} ${b.user.lastName || ''} ${b.user.email}`.toLowerCase() : 
              b.anonymousSession ? `anonymous ${b.anonymousSession.submitterId}`.toLowerCase() : 'unknown';
            const cmp = aUser.localeCompare(bUser);
            return sortOrder === 'asc' ? cmp : -cmp;
          }
          default:
            return 0;
        }
      });
    }

    // Pagination
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = sorted.slice(start, start + itemsPerPage);
    setSubmissions(pageItems);
    setPagination({
      page: currentPage,
      limit: itemsPerPage,
      total,
      totalPages,
    });
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [allSubmissions, sortBy, sortOrder, page, language, itemsPerPage, search, statusFilter, categoryFilter, ratioFilter]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleUpdateStatus = async (submissionId: string, status: 'submitted' | 'in_review' | 'accepted' | 'declined') => {
    try {
      await contentCreatorSubmissionsApi.updateStatus(submissionId, { status });
      await loadSubmissions();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this submission?')) {
      return;
    }
    try {
      await contentCreatorSubmissionsApi.delete(submissionId);
      await loadSubmissions();
    } catch (error: any) {
      console.error('Failed to delete submission:', error);
      alert(error.response?.data?.message || 'Failed to delete submission');
    }
  };

  const getStatusDisplay = (status?: string | null) => {
    if (!status) return { text: 'Unknown', color: '#6b7280' };
    switch (status) {
      case 'submitted':
        return { text: 'Submitted', color: '#6366f1' };
      case 'in_review':
        return { text: 'In Review', color: '#fb923c' };
      case 'accepted':
        return { text: 'Accepted', color: '#10b981' };
      case 'declined':
        return { text: 'Declined', color: '#ef4444' };
      case 'deleted_by_user':
        return { text: 'Deleted by User', color: '#6b7280' };
      default:
        return { text: status, color: '#6b7280' };
    }
  };

  const getCategoryNames = (categoryIds?: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return [];
    return categoryIds
      .map((id) => {
        const category = categories.find((c) => c.id === id);
        return category ? getI18nText(category.name as I18nText, language) : null;
      })
      .filter((name): name is string => name !== null);
  };

  const getRatioNames = (ratioIds?: string[]) => {
    if (!ratioIds || ratioIds.length === 0) return [];
    return ratioIds
      .map((id) => {
        const ratio = ratios.find((r) => r.id === id);
        return ratio ? getI18nText(ratio.name, language) : null;
      })
      .filter((name): name is string => name !== null);
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
      }}
    >
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
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Content Creator Submissions</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              <option value="en">English</option>
              <option value="ua">Українська</option>
              <option value="ru">Русский</option>
            </select>
          </div>
          <button
            onClick={() => router.push('/content-creators')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
            }}
          >
            ← Back to Content Creators
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In Review</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="deleted_by_user">Deleted by User</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getI18nText(category.name as I18nText, language)}
            </option>
          ))}
        </select>
        <select
          value={ratioFilter}
          onChange={(e) => {
            setRatioFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Ratios</option>
          {ratios.map((ratio) => (
            <option key={ratio.id} value={ratio.id}>
              {getI18nText(ratio.name, language)}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
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
          Search
        </button>
        <button
          onClick={() => {
            setSearch('');
            setStatusFilter('');
            setCategoryFilter('');
            setRatioFilter('');
            setPage(1);
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
          Clear
        </button>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th
                onClick={() => handleSort('default')}
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: !sortBy ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                Photo {!sortBy && '✓'}
              </th>
              <th
                onClick={() => handleSort('name')}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortBy === 'name' ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('status')}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortBy === 'status' ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('submittedBy')}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortBy === 'submittedBy' ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                Submitted By {sortBy === 'submittedBy' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('createdAt')}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortBy === 'createdAt' ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                Created At {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('rating')}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: sortBy === 'rating' ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                Categories
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                Ratios
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No submissions found
                </td>
              </tr>
            ) : (
              submissions.map((submission) => {
                const statusDisplay = getStatusDisplay(submission.currentStatus);
                // Priority: user takes precedence over anonymousSession
                // Show user email if authenticated, and also show anonymous ID if exists (for tracking previous anonymous activity)
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
                const photoUrl = submission.photoUrls && Array.isArray(submission.photoUrls) && submission.photoUrls.length > 0
                  ? submission.photoUrls[0]
                  : null;
                const categoryNames = getCategoryNames(submission.categoryIds);
                const ratioNames = getRatioNames(submission.ratioIds);

                return (
                  <tr
                    key={submission.id}
                    onClick={() => router.push(`/content-creators/submissions/${submission.id}`)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {photoUrl ? (
                        <img
                          src={buildResourceUrl(photoUrl) || ''}
                          alt={getI18nText(submission.name, language)}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '0.25rem',
                            border: '1px solid var(--border)',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '0.25rem',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                          }}
                        >
                          No photo
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {getI18nText(submission.name, language)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {submission.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          background: `${statusDisplay.color}20`,
                          color: statusDisplay.color,
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}
                      >
                        {statusDisplay.text}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {submitterInfo}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {new Date(submission.createdAt).toLocaleDateString()} {new Date(submission.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {submission.rating ? `${submission.rating}/10` : '-'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {categoryNames.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {categoryNames.slice(0, 2).map((name, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.125rem 0.5rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                              }}
                            >
                              {name}
                            </span>
                          ))}
                          {categoryNames.length > 2 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              +{categoryNames.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {ratioNames.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {ratioNames.slice(0, 2).map((name, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.125rem 0.5rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                              }}
                            >
                              {name}
                            </span>
                          ))}
                          {ratioNames.length > 2 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              +{ratioNames.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleUpdateStatus(submission.id, 'submitted')}
                          disabled={submission.currentStatus === 'submitted'}
                          style={{
                            padding: '0.5rem 1rem',
                            background: submission.currentStatus === 'submitted' ? 'var(--text-muted)' : '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: submission.currentStatus === 'submitted' ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            opacity: submission.currentStatus === 'submitted' ? 0.6 : 1,
                          }}
                        >
                          Submitted
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(submission.id, 'in_review')}
                          disabled={submission.currentStatus === 'in_review'}
                          style={{
                            padding: '0.5rem 1rem',
                            background: submission.currentStatus === 'in_review' ? 'var(--text-muted)' : '#fb923c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: submission.currentStatus === 'in_review' ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            opacity: submission.currentStatus === 'in_review' ? 0.6 : 1,
                          }}
                        >
                          In Review
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(submission.id, 'accepted')}
                          disabled={submission.currentStatus === 'accepted'}
                          style={{
                            padding: '0.5rem 1rem',
                            background: submission.currentStatus === 'accepted' ? 'var(--text-muted)' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: submission.currentStatus === 'accepted' ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            opacity: submission.currentStatus === 'accepted' ? 0.6 : 1,
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(submission.id, 'declined')}
                          disabled={submission.currentStatus === 'declined'}
                          style={{
                            padding: '0.5rem 1rem',
                            background: submission.currentStatus === 'declined' ? 'var(--text-muted)' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: submission.currentStatus === 'declined' ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            opacity: submission.currentStatus === 'declined' ? 0.6 : 1,
                          }}
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleDelete(submission.id)}
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
                          title="Permanently delete this submission"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {(pagination.totalPages > 1 || allSubmissions.length > 0) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Items per page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const newItemsPerPage = parseInt(e.target.value, 10);
                setItemsPerPage(newItemsPerPage);
                setPage(1);
              }}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: page === 1 ? 'var(--bg-secondary)' : 'var(--accent)',
                  color: page === 1 ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: page === pagination.totalPages ? 'var(--bg-secondary)' : 'var(--accent)',
                  color: page === pagination.totalPages ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
