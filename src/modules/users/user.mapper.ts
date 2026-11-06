export type UserRow = {
  id: string;
  name: string;
  email: string;
  default_currency: string;
  created_at: Date;
  deactivated_at: Date | null;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  defaultCurrency: string;
  createdAt: string;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    defaultCurrency: row.default_currency,
    createdAt: row.created_at.toISOString(),
  };
}
