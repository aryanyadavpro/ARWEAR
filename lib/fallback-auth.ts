// Fallback authentication system for testing without database dependency
// This allows the app to work even if database connection fails

interface FallbackUser {
  id: string
  email: string
  firstName: string
  lastName: string
  password?: string
}

const FALLBACK_USERS: FallbackUser[] = [
  {
    id: 'fallback-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123'
  },
  {
    id: 'fallback-2', 
    email: 'demo@arwear.com',
    firstName: 'Demo',
    lastName: 'User',
    password: 'demo123'
  }
]

export function findFallbackUser(email: string): FallbackUser | null {
  return FALLBACK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase()) || null
}

export function validateFallbackPassword(user: FallbackUser, password: string): boolean {
  return user.password === password
}

export function createFallbackUser(userData: {
  email: string
  firstName: string
  lastName: string
  password: string
}): FallbackUser {
  const newUser: FallbackUser = {
    id: `fallback-${Date.now()}`,
    email: userData.email.toLowerCase(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    password: userData.password
  }
  
  // In a real fallback system, you might store this in localStorage
  // For now, we'll just add it to the in-memory array
  FALLBACK_USERS.push(newUser)
  
  return newUser
}

export function sanitizeFallbackUser(user: FallbackUser) {
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}