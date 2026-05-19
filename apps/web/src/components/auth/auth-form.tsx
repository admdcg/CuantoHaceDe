'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    startTransition(async () => {
      const supabase = createClient()

      const { error: authError } =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password })

      if (authError) {
        setError(authError.message)
        return
      }

      if (mode === 'register') {
        setError('Revisa tu email para confirmar tu cuenta.')
        return
      }

      router.push('/')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        autoComplete="email"
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        minLength={8}
        required
      />

      {error && (
        <p className={`text-sm ${error.includes('Revisa') ? 'text-green-600' : 'text-red-600'}`}>
          {error}
        </p>
      )}

      <Button type="submit" loading={isPending} size="lg" className="w-full">
        {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {mode === 'login' ? (
          <>
            ¿Sin cuenta?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
              Regístrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Inicia sesión
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
