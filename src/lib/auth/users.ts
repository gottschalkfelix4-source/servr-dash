import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import bcrypt from "bcryptjs";
import type { User, SafeUser, UsersStore } from "@/types/auth";

const USERS_PATH = join(process.cwd(), "config", "users.json");

const DEFAULT_STORE: UsersStore = { users: [] };

let cachedStore: UsersStore | null = null;
let cachedMtime = 0;

function loadStore(): UsersStore {
  if (!existsSync(USERS_PATH)) return DEFAULT_STORE;
  try {
    const { statSync } = require("fs");
    const mtime = statSync(USERS_PATH).mtimeMs;
    if (cachedStore && mtime === cachedMtime) return cachedStore;
    const raw = readFileSync(USERS_PATH, "utf-8");
    cachedStore = JSON.parse(raw) as UsersStore;
    cachedMtime = mtime;
    return cachedStore;
  } catch {
    return DEFAULT_STORE;
  }
}

function saveStore(store: UsersStore): void {
  const dir = dirname(USERS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(USERS_PATH, JSON.stringify(store, null, 2), "utf-8");
  cachedStore = store;
  if (existsSync(USERS_PATH)) {
    const { statSync } = require("fs");
    cachedMtime = statSync(USERS_PATH).mtimeMs;
  }
}

export function getUsers(): User[] {
  return loadStore().users;
}

export function getSafeUsers(): SafeUser[] {
  return getUsers().map(toSafeUser);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

export function hasUsers(): boolean {
  return getUsers().length > 0;
}

export async function createUser(
  username: string,
  password: string,
  role: "admin" | "user" = "user"
): Promise<SafeUser> {
  const store = loadStore();

  if (getUserByUsername(username)) {
    throw new Error("Username already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  saveStore(store);
  return toSafeUser(user);
}

export async function verifyPassword(
  user: User,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function updateUserPassword(
  id: string,
  newPassword: string
): Promise<void> {
  const store = loadStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  saveStore(store);
}

export function updateUserRole(id: string, role: "admin" | "user"): void {
  const store = loadStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  user.role = role;
  saveStore(store);
}

export function deleteUser(id: string): void {
  const store = loadStore();
  store.users = store.users.filter((u) => u.id !== id);
  saveStore(store);
}

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}
