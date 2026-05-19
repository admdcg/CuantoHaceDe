export type CategoryId =
  | 'hygiene'
  | 'health'
  | 'home'
  | 'car'
  | 'work'
  | 'pets'
  | 'finances'
  | 'other'

export interface Template {
  name: string
  interval_days: number
}

export interface Category {
  id: CategoryId
  label: string
  icon: string
  color: string
  bg: string
  templates: Template[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'hygiene',
    label: 'Higiene personal',
    icon: '🧴',
    color: '#8b5cf6',
    bg: 'bg-violet-50',
    templates: [
      { name: 'Cortarme el pelo', interval_days: 30 },
      { name: 'Afeitarme', interval_days: 3 },
      { name: 'Cortar uñas', interval_days: 14 },
      { name: 'Dentista', interval_days: 180 },
      { name: 'Depilación', interval_days: 21 },
    ],
  },
  {
    id: 'health',
    label: 'Salud',
    icon: '🏥',
    color: '#ef4444',
    bg: 'bg-red-50',
    templates: [
      { name: 'Revisión médica', interval_days: 365 },
      { name: 'Revisión dental', interval_days: 180 },
      { name: 'Revisión oftalmólogo', interval_days: 730 },
      { name: 'Análisis de sangre', interval_days: 365 },
      { name: 'Vacunas', interval_days: 365 },
    ],
  },
  {
    id: 'home',
    label: 'Casa',
    icon: '🏠',
    color: '#10b981',
    bg: 'bg-emerald-50',
    templates: [
      { name: 'La compra', interval_days: 7 },
      { name: 'Cambiar sábanas', interval_days: 14 },
      { name: 'Limpiar nevera', interval_days: 30 },
      { name: 'Pasar el aspirador', interval_days: 7 },
      { name: 'Limpiar ventanas', interval_days: 90 },
      { name: 'Revisión caldera', interval_days: 365 },
      { name: 'Cambiar filtros', interval_days: 180 },
    ],
  },
  {
    id: 'car',
    label: 'Coche',
    icon: '🚗',
    color: '#f97316',
    bg: 'bg-orange-50',
    templates: [
      { name: 'Pasar ITV', interval_days: 730 },
      { name: 'Cambiar aceite', interval_days: 180 },
      { name: 'Revisar neumáticos', interval_days: 90 },
      { name: 'Lavar el coche', interval_days: 14 },
      { name: 'Revisar frenos', interval_days: 365 },
    ],
  },
  {
    id: 'work',
    label: 'Trabajo',
    icon: '💼',
    color: '#3b82f6',
    bg: 'bg-blue-50',
    templates: [
      { name: 'Revisar backups', interval_days: 7 },
      { name: 'Actualizar software', interval_days: 30 },
      { name: 'Declaración de la renta', interval_days: 365 },
      { name: 'Renovar dominio web', interval_days: 365 },
    ],
  },
  {
    id: 'pets',
    label: 'Mascotas',
    icon: '🐾',
    color: '#f59e0b',
    bg: 'bg-amber-50',
    templates: [
      { name: 'Vacunas mascota', interval_days: 365 },
      { name: 'Desparasitar mascota', interval_days: 90 },
      { name: 'Visita al veterinario', interval_days: 180 },
      { name: 'Baño mascota', interval_days: 30 },
    ],
  },
  {
    id: 'finances',
    label: 'Finanzas',
    icon: '💰',
    color: '#84cc16',
    bg: 'bg-lime-50',
    templates: [
      { name: 'Revisar seguros', interval_days: 365 },
      { name: 'Revisar suscripciones', interval_days: 90 },
      { name: 'Revisión hipoteca', interval_days: 365 },
    ],
  },
  {
    id: 'other',
    label: 'Otros',
    icon: '📋',
    color: '#6b7280',
    bg: 'bg-gray-50',
    templates: [
      { name: 'Vacaciones', interval_days: 365 },
      { name: 'Renovar DNI', interval_days: 3650 },
      { name: 'Renovar pasaporte', interval_days: 3650 },
      { name: 'Revisión extintores', interval_days: 365 },
    ],
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>

export function getCategory(id: string | null): Category {
  return CATEGORY_MAP[id as CategoryId] ?? CATEGORY_MAP.other
}
