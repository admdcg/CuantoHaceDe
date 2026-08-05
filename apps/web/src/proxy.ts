import { NextResponse, type NextRequest } from 'next/server'
import { decrypt, SESSION_COOKIE } from '@/lib/auth/token'

const AUTH_ROUTES = ['/login', '/register']

/**
 * Comprobación optimista: solo mira la cookie para ahorrarle a un visitante
 * anónimo el viaje a una página protegida. No consulta la base de datos, tal y
 * como recomienda la documentación de Next, porque el proxy corre en cada
 * petición incluidas las de prefetch. La comprobación que manda está en
 * requireUser() (src/lib/auth/dal.ts), que sí valida contra la base de datos.
 */
export async function proxy(request: NextRequest) {
  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value)

  const { pathname } = request.nextUrl
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  if (!session && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (session && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
