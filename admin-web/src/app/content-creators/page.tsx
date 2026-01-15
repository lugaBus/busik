'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { contentCreatorsApi, ContentCreator, StatusHistoryItem } from '@/api/contentCreators';
import { categoriesApi, Category } from '@/api/categories';
import { authService } from '@/auth/auth.service';
import { getI18nText, Language } from '@/utils/i18n';

function SortableItem({ creator, language, position, onEdit, onDelete, onViewHistory }: { creator: ContentCreator; language: Language; position?: number; onEdit: () => void; onDelete: () => void; onViewHistory: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: creator.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={{
        ...style,
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.2s',
        cursor: 'grab',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <td style={{ padding: '1rem', width: '40px' }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            color: 'var(--text-secondary)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="7" cy="5" r="1.5" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" />
            <circle cx="13" cy="15" r="1.5" />
          </svg>
        </div>
      </td>
      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        {position !== undefined ? (
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
            }}
          >
            {position}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td style={{ padding: '1rem' }}>
        {creator.photoUrls && creator.photoUrls.length > 0 && creator.photoUrls[0] ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${creator.photoUrls[0]}`}
            alt={getI18nText(creator.name, language)}
            style={{
              width: '50px',
              height: '50px',
              objectFit: 'cover',
              borderRadius: '0.25rem',
              border: '1px solid var(--border)',
            }}
          />
        ) : (
          <div
            style={{
              width: '50px',
              height: '50px',
              background: 'var(--bg-secondary)',
              borderRadius: '0.25rem',
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
                  <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    {getI18nText(creator.name, language)}
                  </td>
      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {creator.rating ? (
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
            }}
          >
            {creator.rating}/10
          </span>
        ) : (
          '-'
        )}
      </td>
      <td style={{ padding: '1rem' }}>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '500',
            background:
              creator.status === 'active'
                ? 'var(--success-bg)'
                : creator.status === 'pending'
                ? 'var(--accent-light)'
                : 'var(--error-bg)',
            color:
              creator.status === 'active'
                ? 'var(--success)'
                : creator.status === 'pending'
                ? 'var(--accent)'
                : 'var(--error)',
          }}
        >
          {creator.status}
        </span>
      </td>
      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {creator.categories?.slice(0, 2).map((c: any) => getI18nText(c.name, language) || c).join(', ') || '-'}
        {creator.categories?.length > 2 && '...'}
      </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {creator.ratios?.slice(0, 2).map((r: any) => getI18nText(r.name, language) || r).join(', ') || '-'}
        {creator.ratios?.length > 2 && '...'}
      </td>
      <td style={{ padding: '1rem' }}>
        <div 
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Edit button clicked for creator:', creator.id);
              onEdit();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              pointerEvents: 'auto',
            }}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('History button clicked for creator:', creator.id);
              onViewHistory();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              console.log('History button pointerDown for creator:', creator.id);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              console.log('History button mouseDown for creator:', creator.id);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              pointerEvents: 'auto',
            }}
          >
            History
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Delete button clicked for creator:', creator.id);
              onDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--error)',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              pointerEvents: 'auto',
            }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ContentCreatorsPage() {
  const router = useRouter();
  const [allCreators, setAllCreators] = useState<ContentCreator[]>([]);
  const [creators, setCreators] = useState<ContentCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPositions, setSavingPositions] = useState(false);
  const [language, setLanguage] = useState<Language>('ua');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [ratioFilter, setRatioFilter] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'status' | 'position' | 'createdAt' | 'categories' | 'ratios' | 'photo' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    limit: 10,
  });
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<ContentCreator | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [creatorPositions, setCreatorPositions] = useState<Map<string, number>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCategories();
    loadCreators();
  }, [router, statusFilter, categoryFilter, ratioFilter]);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadCreators = async () => {
    try {
      setLoading(true);
      const response = await contentCreatorsApi.getAll({
        page: 1,
        limit: 1000, // fetch all to avoid pagination issues on server
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        ratio: ratioFilter || undefined,
      });
      setAllCreators(response.data);
    } catch (error) {
      console.error('Failed to load content creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'name' | 'rating' | 'status' | 'position' | 'createdAt' | 'categories' | 'ratios' | 'photo' | 'default') => {
    if (field === 'default') {
      // Reset to default sorting (no sortBy = backend default: position asc, createdAt desc)
      setSortBy(null);
      setSortOrder('asc');
    } else if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with default ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  // Client-side sorting and pagination
  useEffect(() => {
    if (allCreators.length === 0) {
      setCreators([]);
      setPagination({
        page: 1,
        limit: itemsPerPage,
        total: 0,
        totalPages: 0,
      });
      return;
    }

    const limit = itemsPerPage;
    // sort
    const sorted = [...allCreators];
    if (!sortBy) {
      // Default sorting: position asc, then createdAt desc (matching backend default)
      sorted.sort((a, b) => {
        const aPos = a.position ?? 0;
        const bPos = b.position ?? 0;
        if (aPos !== bPos) {
          return aPos - bPos; // position asc
        }
        // If positions are equal, sort by createdAt desc
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
          case 'rating': {
            if (a.rating == null && b.rating == null) return 0;
            if (a.rating == null) return 1;
            if (b.rating == null) return -1;
            return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
          }
          case 'status': {
            const order = ['active', 'pending', 'inactive', 'user_added'];
            const aIdx = order.indexOf(a.status as any);
            const bIdx = order.indexOf(b.status as any);
            const aVal = aIdx === -1 ? order.length : aIdx;
            const bVal = bIdx === -1 ? order.length : bIdx;
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
          }
          case 'categories': {
            // Sort by first category name alphabetically, or by count if no categories
            const aCategories = a.categories || [];
            const bCategories = b.categories || [];
            
            // If both have no categories, they're equal
            if (aCategories.length === 0 && bCategories.length === 0) return 0;
            // Items without categories go to the end
            if (aCategories.length === 0) return 1;
            if (bCategories.length === 0) return -1;
            
            // Sort by first category name
            const aFirstName = getI18nText(aCategories[0]?.name, language) || '';
            const bFirstName = getI18nText(bCategories[0]?.name, language) || '';
            const cmp = aFirstName.localeCompare(bFirstName, undefined, { sensitivity: 'base' });
            return sortOrder === 'asc' ? cmp : -cmp;
          }
          case 'ratios': {
            const aCount = a.ratios?.length || 0;
            const bCount = b.ratios?.length || 0;
            return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
          }
          case 'createdAt': {
            const aDate = new Date(a.createdAt).getTime();
            const bDate = new Date(b.createdAt).getTime();
            return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
          }
          case 'position': {
            const aPos = a.position ?? 0;
            const bPos = b.position ?? 0;
            return sortOrder === 'asc' ? aPos - bPos : bPos - aPos;
          }
          case 'photo': {
            // Sort by photo presence: has photo = 1, no photo = 0
            const aHasPhoto = a.photoUrls && Array.isArray(a.photoUrls) && a.photoUrls.length > 0 && a.photoUrls[0] ? 1 : 0;
            const bHasPhoto = b.photoUrls && Array.isArray(b.photoUrls) && b.photoUrls.length > 0 && b.photoUrls[0] ? 1 : 0;
            return sortOrder === 'asc' ? bHasPhoto - aHasPhoto : aHasPhoto - bHasPhoto; // asc: photos first, desc: no photos first
          }
          default:
            return 0;
        }
      });
    }
    // Create position map for all sorted creators (1-based index)
    const positionsMap = new Map<string, number>();
    sorted.forEach((creator, index) => {
      positionsMap.set(creator.id, index + 1);
    });
    setCreatorPositions(positionsMap);

    // pagination
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * limit;
    const pageItems = sorted.slice(start, start + limit);
    setCreators(pageItems);
    setPagination({
      page: currentPage,
      limit,
      total,
      totalPages,
    });
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [allCreators, sortBy, sortOrder, page, language, itemsPerPage]);

  const sortedCreators = creators;

  const handleSearch = () => {
    setPage(1);
    loadCreators();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content creator?')) {
      return;
    }
    try {
      await contentCreatorsApi.delete(id);
      loadCreators();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete content creator');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = creators.findIndex((c) => c.id === active.id);
      const newIndex = creators.findIndex((c) => c.id === over.id);

      const newCreators = arrayMove(creators, oldIndex, newIndex);
      setCreators(newCreators);

      // Update positions on server
      try {
        setSavingPositions(true);
        const positions = newCreators.map((creator, index) => ({
          id: creator.id,
          position: index,
        }));
        await contentCreatorsApi.updatePositions(positions);
      } catch (error) {
        console.error('Failed to update positions:', error);
        alert('Failed to save new order');
        loadCreators(); // Reload on error
      } finally {
        setSavingPositions(false);
      }
    }
  };

  const loadStatusHistory = async (creatorId: string) => {
    try {
      setLoadingHistory(true);
      setHistoryError(null);
      setSelectedCreatorId(creatorId);
      
      // Find creator in the list to get name and ID
      const creator = allCreators.find((c) => c.id === creatorId);
      if (creator) {
        setSelectedCreator(creator);
      }
      
      console.log('Loading status history for:', creatorId);
      const history = await contentCreatorsApi.getStatusHistory(creatorId);
      console.log('Status history loaded:', history);
      if (history.length === 0) {
        throw new Error('No status history found. This should not happen - every creator must have at least one status history entry from creation.');
      }
      setStatusHistory(history);
    } catch (error: any) {
      console.error('Failed to load status history:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load status history';
      setHistoryError(errorMessage);
      setStatusHistory([]);
    } finally {
      setLoadingHistory(false);
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
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Content Creators</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
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
          {savingPositions && (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Saving order...</span>
          )}
          <button
            onClick={() => router.push('/ratios')}
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
            Manage Ratios
          </button>
          <button
            onClick={() => router.push('/content-creators/submissions')}
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
            View Submissions
          </button>
          <button
            onClick={() => router.push('/content-creators/new')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            + Add New
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
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="user_added">User Added</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getI18nText(category.name, language)}
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
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', width: '40px' }}></th>
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
                  Position {!sortBy && '✓'}
                </th>
                <th
                  onClick={() => handleSort('photo')}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortBy === 'photo' ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  Photo {sortBy === 'photo' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                  onClick={() => handleSort('categories')}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortBy === 'categories' ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  Categories {sortBy === 'categories' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('ratios')}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortBy === 'ratios' ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  Ratios {sortBy === 'ratios' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {creators.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No content creators found
                  </td>
                </tr>
              ) : (
                <SortableContext items={sortedCreators.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {sortedCreators.map((creator) => (
                    <SortableItem
                      key={creator.id}
                      creator={creator}
                      language={language}
                      position={creatorPositions.get(creator.id)}
                      onEdit={() => router.push(`/content-creators/${creator.id}`)}
                      onDelete={() => handleDelete(creator.id)}
                      onViewHistory={() => loadStatusHistory(creator.id)}
                    />
                  ))}
                </SortableContext>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Status History Modal */}
      {selectedCreatorId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCreatorId(null);
              setSelectedCreator(null);
              setStatusHistory([]);
              setHistoryError(null);
            }
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-primary)',
                zIndex: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600' }}>
                  Status Change History
                </h2>
                {selectedCreator && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {getI18nText(selectedCreator.name, language)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {selectedCreator.id}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCreatorId(null);
                  setSelectedCreator(null);
                  setStatusHistory([]);
                  setHistoryError(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginLeft: '1rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {loadingHistory ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Loading...</div>
                  <div style={{ fontSize: '0.875rem' }}>Please wait while we fetch the status history</div>
                </div>
              ) : historyError ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--error)',
                    background: 'var(--error-bg)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--error)',
                  }}
                >
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                    ⚠️ Error loading status history
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>{historyError}</div>
                </div>
              ) : statusHistory.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--error)',
                    background: 'var(--error-bg)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--error)',
                  }}
                >
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                    ⚠️ No Status History Found
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                    No status history found. This should not happen - every creator must have at least one status history entry from creation.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Time
                        </th>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Who
                        </th>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Previous Status
                        </th>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          New Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusHistory.map((item, index) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                          }}
                        >
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {new Date(item.time).toLocaleString()}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {item.who}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {item.previousStatus === '-' ? (
                              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Initial</span>
                            ) : (
                              item.previousStatus
                            )}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {item.newStatus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(pagination.totalPages > 1 || allCreators.length > 0) && (
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
                setPage(1); // Reset to first page when changing items per page
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
