import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LugaBus - Content Creators',
  description: 'Discover amazing content creators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  )
}
