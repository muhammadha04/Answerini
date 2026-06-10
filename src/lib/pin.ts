export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateId(): string {
  return crypto.randomUUID();
}
