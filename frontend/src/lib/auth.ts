import { apiFetch } from './api'

export interface ChangePasswordInput {
  current_password: string
  password: string
  password_confirmation: string
}

export function changePassword(input: ChangePasswordInput) {
  return apiFetch<void>('/api/auth/password', { method: 'PATCH', json: input })
}
