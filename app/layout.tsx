import './globals.css'
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'

export const metadata: Metadata = {
  title: 'نظام إدارة الصالة الرياضية',
  description: 'نظام شامل لإدارة صالات الرياضة',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}