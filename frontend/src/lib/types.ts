export type Category = {
  id: number
  name: string
  color: string
  icon: string
  display_order: number
  is_active: boolean
}

export type FamilyMember = {
  id: number
  name: string
  color: string
  icon: string
  display_order: number
  is_active: boolean
}

export type Expense = {
  id: number
  amount_cents: number
  description: string | null
  occurred_on: string
  category_id: number
  family_member_id: number
  registered_by_user_id: number
  recurring_expense_id: number | null
  category?: Category
  family_member?: FamilyMember
  registered_by?: { id: number; username: string; name: string }
}

export type Paginated<T> = {
  data: T[]
  links: { first: string; last: string; prev: string | null; next: string | null }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
}

export type ExpenseFilters = {
  from?: string
  to?: string
  category_id?: number
  family_member_id?: number
  search?: string
  per_page?: number
}
