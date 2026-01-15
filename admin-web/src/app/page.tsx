'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, AuthResponse } from '@/auth/auth.service';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = authService.getUser();
    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (!user) {
    return (
      <main
        style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main
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
        <div>
          <h1 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            LugaBus - Admin Panel
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Welcome, {user.firstName || user.email}!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--error)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 4px var(--shadow)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          User Information
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Email:</strong> {user.email}
          </p>
          {user.firstName && (
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>First Name:</strong>{' '}
              {user.firstName}
            </p>
          )}
          {user.lastName && (
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Last Name:</strong>{' '}
              {user.lastName}
            </p>
          )}
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Roles:</strong>{' '}
            {user.roles?.join(', ') || 'No roles assigned'}
          </p>
          <p style={{ margin: 0, color: 'var(--text-primary)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Permissions:</strong>{' '}
            {user.permissions?.length || 0} permission(s)
          </p>
        </div>
      </div>

      <div
        style={{
          background: 'var(--accent-light)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 4px var(--shadow)',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          This is the main admin dashboard. Add your admin features here.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/content-creators')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            Manage Content Creators
          </button>
          <button
            onClick={() => router.push('/categories')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            Manage Categories
          </button>
          <button
            onClick={() => router.push('/tags')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            Manage Tags
          </button>
          <button
            onClick={() => router.push('/ratios')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            Manage Ratios
          </button>
          <button
            onClick={() => router.push('/platforms')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            Manage Platforms
          </button>
          <button
            onClick={() => router.push('/users')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            Manage Users
          </button>
        </div>
      </div>
    </main>
  );
}

