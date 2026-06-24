import type { Metadata } from 'next'
import { I18nProvider } from '@/components/I18nProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Contracts',
  description: 'Contracts prototype',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
} 