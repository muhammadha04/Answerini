export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function generateId(): string {
  return crypto.randomUUID();
}
