export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface SafeUser {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface SessionPayload {
  sub: string;
  username: string;
  role: "admin" | "user";
}

export interface UsersStore {
  users: User[];
}
