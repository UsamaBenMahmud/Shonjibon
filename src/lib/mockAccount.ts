import { getDb } from "@/lib/mockDb";
import { genId } from "@/lib/utils";

const ACCOUNTS_KEY = "shonjibon.accounts.v1";
const SESSION_KEY = "shonjibon.account.session";

export interface MockAddress {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  district: string;
  is_default: boolean;
}

export interface MockAccount {
  id: string;
  email: string;
  full_name: string;
  salt: string;
  password_hash: string;
  addresses: MockAddress[];
  wishlist: string[];
}

function readAccounts(): MockAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error("Local account data is invalid. Clear site data and try again.");
  return value as MockAccount[];
}

function writeAccounts(accounts: MockAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function hashPassword(password: string, salt: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createMockAccount(email: string, fullName: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error("এই ইমেইলে অ্যাকাউন্ট আছে / An account already exists for this email");
  }
  const salt = crypto.randomUUID();
  const account: MockAccount = {
    id: genId(),
    email: normalizedEmail,
    full_name: fullName.trim(),
    salt,
    password_hash: await hashPassword(password, salt),
    addresses: [],
    wishlist: [],
  };
  writeAccounts([...accounts, account]);
  sessionStorage.setItem(SESSION_KEY, account.id);
  return account;
}

export async function signInMockAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find((entry) => entry.email === normalizedEmail);
  if (!account || await hashPassword(password, account.salt) !== account.password_hash) {
    throw new Error("ইমেইল বা পাসওয়ার্ড ভুল / Incorrect email or password");
  }
  sessionStorage.setItem(SESSION_KEY, account.id);
  return account;
}

export function getMockAccount(): MockAccount | null {
  const id = sessionStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return readAccounts().find((account) => account.id === id) ?? null;
}

export function signOutMockAccount() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function updateMockAccount(changes: Partial<Pick<MockAccount, "full_name" | "addresses" | "wishlist">>) {
  const current = getMockAccount();
  if (!current) throw new Error("Please sign in first");
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.id === current.id);
  if (index < 0) throw new Error("Account not found");
  accounts[index] = { ...accounts[index], ...changes };
  writeAccounts(accounts);
  return accounts[index];
}

export function listMockAccountOrders() {
  const account = getMockAccount();
  if (!account) return [];
  return getDb().orders
    .filter((order) => order.email.trim().toLowerCase() === account.email)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
