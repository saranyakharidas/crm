import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthGuard } from '@/components/auth/auth-guard'
import { CRMProvider } from '@/lib/crm-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
})

export const metadata: Metadata = {
  title: 'CRM Pro - Modern Customer Relationship Management',
  description: 'A powerful, modern CRM system with AI-powered insights, deal pipeline management, and comprehensive customer tracking.',
  keywords: ['CRM', 'Customer Relationship Management', 'Sales', 'Pipeline', 'AI', 'Analytics'],
}

export const viewport: Viewport = {
  themeColor: '#1a1625',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthGuard>
          <NotificationsProvider>
            <CRMProvider>
              {children}
              <Toaster position="top-right" richColors />
            </CRMProvider>
          </NotificationsProvider>
        </AuthGuard>
        <Analytics />
      </body>
    </html>
  )
}
