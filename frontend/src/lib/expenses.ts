import { apiFetch } from './api'
import type { Category, Expense, ExpenseFilters, FamilyMember, Paginated } from './types'

export function listCategories(includeInactive = false) {
  const qs = includeInactive ? '?include_inactive=true' : ''
  return apiFetch<{ data: Category[] }>(`/api/categories${qs}`).then((r) => r.data)
}

export function listFamilyMembers(includeInactive = false) {
  const qs = includeInactive ? '?include_inactive=true' : ''
  return apiFetch<{ data: FamilyMember[] }>(`/api/family-members${qs}`).then((r) => r.data)
}

export type CategoryInput = {
  name: string
  color: string
  icon: string
  display_order?: number
  is_active?: boolean
}

export function createCategory(input: CategoryInput) {
  return apiFetch<{ data: Category }>('/api/categories', {
    method: 'POST',
    json: input,
  }).then((r) => r.data)
}

export function updateCategory(id: number, input: Partial<CategoryInput>) {
  return apiFetch<{ data: Category }>(`/api/categories/${id}`, {
    method: 'PATCH',
    json: input,
  }).then((r) => r.data)
}

export function deleteCategory(id: number) {
  return apiFetch<void>(`/api/categories/${id}`, { method: 'DELETE' })
}

export type FamilyMemberInput = CategoryInput

export function createFamilyMember(input: FamilyMemberInput) {
  return apiFetch<{ data: FamilyMember }>('/api/family-members', {
    method: 'POST',
    json: input,
  }).then((r) => r.data)
}

export function updateFamilyMember(id: number, input: Partial<FamilyMemberInput>) {
  return apiFetch<{ data: FamilyMember }>(`/api/family-members/${id}`, {
    method: 'PATCH',
    json: input,
  }).then((r) => r.data)
}

export function deleteFamilyMember(id: number) {
  return apiFetch<void>(`/api/family-members/${id}`, { method: 'DELETE' })
}

function buildQuery(filters: ExpenseFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function listExpenses(filters: ExpenseFilters = {}) {
  return apiFetch<Paginated<Expense>>(`/api/expenses${buildQuery(filters)}`)
}

export function getExpense(id: number) {
  return apiFetch<{ data: Expense }>(`/api/expenses/${id}`).then((r) => r.data)
}

export type RecurringInput = {
  day_of_month: number
  ends_on: string
}

export type ExpenseInput = {
  amount_cents: number
  category_id: number
  family_member_id: number
  description?: string | null
  occurred_on: string
  recurring?: RecurringInput
}

export function createExpense(input: ExpenseInput) {
  return apiFetch<{ data: Expense }>('/api/expenses', {
    method: 'POST',
    json: input,
  }).then((r) => r.data)
}

export function updateExpense(id: number, input: Partial<ExpenseInput>) {
  return apiFetch<{ data: Expense }>(`/api/expenses/${id}`, {
    method: 'PATCH',
    json: input,
  }).then((r) => r.data)
}

export function deleteExpense(id: number) {
  return apiFetch<void>(`/api/expenses/${id}`, { method: 'DELETE' })
}
