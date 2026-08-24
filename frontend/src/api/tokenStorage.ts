const TOKEN_KEY = 'library_admin_token'

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  },

  set(token: string, remember: boolean): void {
    this.clear()
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, token)
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },
}

