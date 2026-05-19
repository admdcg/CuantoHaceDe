import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '¿Cuánto hace de?',
  description: 'Lleva el control de tus tareas periódicas y ve de un vistazo cuánto tiempo hace que las hiciste.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
