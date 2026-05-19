import { AuthForm } from '@/components/auth/auth-form'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">¿Cuánto hace de?</h1>
          <p className="mt-2 text-gray-500">Crea tu cuenta gratuita</p>
        </div>
        <AuthForm mode="register" />
      </div>
    </div>
  )
}
