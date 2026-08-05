'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { signIn, signUp, type AuthState } from '@/lib/actions/auth'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    mode === 'login' ? signIn : signUp,
    null
  )

  // React vacía los campos no controlados al terminar la action, así que tras
  // un intento fallido habría que reescribir el email. Controlarlo lo conserva;
  // la contraseña sí interesa que se borre.
  const [email, setEmail] = useState('')

  return (
    <form action={formAction} className="space-y-4">
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
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

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

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
