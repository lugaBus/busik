'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, User, BlockUserDto, DeleteUserDto } from '@/api/users';
import { authService } from '@/auth/auth.service';

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    limit: 10,
  });
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadUsers();
  }, [router, pagination.page, debouncedSearch, isActiveFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        isActive: isActiveFilter,
      });
      setUsers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }));
    } catch (error: any) {
      console.error('Failed to load users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedUser) return;
    try {
      setBlockingUserId(selectedUser.id);
      await usersApi.blockUser(selectedUser.id, { blockReason: blockReason || undefined });
      setShowBlockModal(false);
      setSelectedUser(null);
      setBlockReason('');
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to block user:', error);
      alert(error.response?.data?.message || 'Failed to block user');
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      setBlockingUserId(userId);
      await usersApi.unblockUser(userId);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to unblock user:', error);
      alert(error.response?.data?.message || 'Failed to unblock user');
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to delete user ${selectedUser.email}? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingUserId(selectedUser.id);
      await usersApi.deleteUser(selectedUser.id, { deleteReason: deleteReason || undefined });
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeleteReason('');
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const openBlockModal = (user: User) => {
    setSelectedUser(user);
    setBlockReason(user.blockReason || '');
    setShowBlockModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)' }}>Users Management</h1>
        <button
          onClick={() => router.push('/')}
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
        >
          Home
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by email, first name, or last name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '300px',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
          }}
        />
        <select
          value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'blocked'}
          onChange={(e) => {
            const value = e.target.value;
            setIsActiveFilter(value === 'all' ? undefined : value === 'active');
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No users found</div>
      ) : (
        <>
          <div style={{ background: 'var(--bg-card)', borderRadius: '0.75rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Block Reason</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Created</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: user.isActive ? '#10b98120' : '#ef444420',
                          color: user.isActive ? '#10b981' : '#ef4444',
                        }}
                      >
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.blockReason || '-'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {user.isActive ? (
                          <button
                            onClick={() => openBlockModal(user)}
                            disabled={blockingUserId === user.id}
                            style={{
                              padding: '0.5rem 1rem',
                              background: blockingUserId === user.id ? 'var(--text-muted)' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: blockingUserId === user.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              opacity: blockingUserId === user.id ? 0.6 : 1,
                            }}
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(user.id)}
                            disabled={blockingUserId === user.id}
                            style={{
                              padding: '0.5rem 1rem',
                              background: blockingUserId === user.id ? 'var(--text-muted)' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: blockingUserId === user.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              opacity: blockingUserId === user.id ? 0.6 : 1,
                            }}
                          >
                            Unblock
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(user)}
                          disabled={deletingUserId === user.id}
                          style={{
                            padding: '0.5rem 1rem',
                            background: deletingUserId === user.id ? 'var(--text-muted)' : '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: deletingUserId === user.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            opacity: deletingUserId === user.id ? 0.6 : 1,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Items per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
                  }}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.25rem',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    paddingRight: '2rem',
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    background: pagination.page === 1 ? 'var(--bg-secondary)' : 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.25rem',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: pagination.page === 1 ? 0.6 : 1,
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    background: pagination.page >= pagination.totalPages ? 'var(--bg-secondary)' : 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.25rem',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: pagination.page >= pagination.totalPages ? 0.6 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Block Modal */}
      {showBlockModal && selectedUser && (
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
            setShowBlockModal(false);
            setSelectedUser(null);
            setBlockReason('');
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
              minWidth: '400px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>Block User</h2>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                User: <strong>{selectedUser.email}</strong>
              </p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Block Reason (optional)
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking this user..."
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
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedUser(null);
                  setBlockReason('');
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
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={blockingUserId === selectedUser.id}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: blockingUserId === selectedUser.id ? 'var(--text-muted)' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: blockingUserId === selectedUser.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  opacity: blockingUserId === selectedUser.id ? 0.6 : 1,
                }}
              >
                {blockingUserId === selectedUser.id ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
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
            setShowDeleteModal(false);
            setSelectedUser(null);
            setDeleteReason('');
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
              minWidth: '400px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', color: '#ef4444' }}>Delete User</h2>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                User: <strong>{selectedUser.email}</strong>
              </p>
              <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.5rem' }}>
                Warning: This action cannot be undone!
              </p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Delete Reason (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deleting this user..."
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                  setDeleteReason('');
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
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingUserId === selectedUser.id}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: deletingUserId === selectedUser.id ? 'var(--text-muted)' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: deletingUserId === selectedUser.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  opacity: deletingUserId === selectedUser.id ? 0.6 : 1,
                }}
              >
                {deletingUserId === selectedUser.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
