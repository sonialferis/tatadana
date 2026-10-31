import fs from 'fs';
import os from 'os';
import path from 'path';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'admin' | 'customer';
  plan: 'starter' | 'pro';
  status: 'pending' | 'approved' | 'rejected';
  telegram: string;
  telegram_id?: number | null;
  txCount: number;
  created_at: string;
  approved_at?: string | null;
  rejected_reason?: string | null;
}

// On Vercel serverless functions, process.cwd() is read-only (/var/task). Use os.tmpdir() for runtime store.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'tatadana-data')
  : path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Default Seed Users
const defaultUsers: AppUser[] = [
  {
    id: 'usr-admin',
    name: 'Soni Alferis',
    email: 'sonialferis@gmail.com',
    phone: '081234567890',
    password: 'sonial200712',
    role: 'admin',
    plan: 'pro',
    status: 'approved',
    telegram: 'Superadmin Bot',
    telegram_id: null,
    txCount: 0,
    created_at: '2026-09-01T08:00:00+07:00',
    approved_at: '2026-09-01T08:00:00+07:00',
  },
  {
    id: 'usr-1',
    name: 'Budi Santoso',
    email: 'budi@tatadana.id',
    phone: '081288997766',
    password: 'budi12345',
    role: 'customer',
    plan: 'pro',
    status: 'approved',
    telegram: 'Connected (ID: 8831965887)',
    telegram_id: 8831965887,
    txCount: 43,
    created_at: '2026-10-01T08:00:00+07:00',
    approved_at: '2026-10-01T08:30:00+07:00',
  },
  {
    id: 'usr-2',
    name: 'Siti Rahma',
    email: 'siti@gmail.com',
    phone: '081399881122',
    password: 'siti12345',
    role: 'customer',
    plan: 'starter',
    status: 'approved',
    telegram: 'Connected (ID: 987654321)',
    telegram_id: 987654321,
    txCount: 28,
    created_at: '2026-10-03T10:15:00+07:00',
    approved_at: '2026-10-03T10:30:00+07:00',
  },
  {
    id: 'usr-3',
    name: 'Andi Wijaya',
    email: 'andi@gmail.com',
    phone: '085712345678',
    password: 'andi12345',
    role: 'customer',
    plan: 'starter',
    status: 'pending', // Menunggu persetujuan admin contoh
    telegram: 'Not Connected',
    telegram_id: null,
    txCount: 4,
    created_at: '2026-10-16T14:20:00+07:00',
    approved_at: null,
  },
  {
    id: 'usr-4',
    name: 'Dewi Lestari',
    email: 'dewi@gmail.com',
    phone: '081922334455',
    password: 'dewi12345',
    role: 'customer',
    plan: 'starter',
    status: 'approved',
    telegram: 'Connected (ID: 556677889)',
    telegram_id: 556677889,
    txCount: 12,
    created_at: '2026-10-09T09:30:00+07:00',
    approved_at: '2026-10-09T10:00:00+07:00',
  },
  {
    id: 'usr-5',
    name: 'Dimas Aditya',
    email: 'dimas@gmail.com',
    phone: '081299001122',
    password: 'dimas12345',
    role: 'customer',
    plan: 'pro',
    status: 'approved',
    telegram: 'Connected (ID: 123456789)',
    telegram_id: 123456789,
    txCount: 15,
    created_at: '2026-10-10T11:00:00+07:00',
    approved_at: '2026-10-10T11:20:00+07:00',
  },
];

export function loadUsersFromFile(): AppUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[UsersStore] Gagal membaca data/users.json:', err);
  }

  // Jika belum ada file, simpan default
  saveUsersToFile(defaultUsers);
  return defaultUsers;
}

export function saveUsersToFile(users: AppUser[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[UsersStore] Gagal menyimpan data/users.json:', err);
  }
}

export function getAllUsers(): AppUser[] {
  return loadUsersFromFile();
}

export function getUserByEmail(email: string): AppUser | null {
  const users = getAllUsers();
  const clean = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === clean) || null;
}

export function getUserByPhone(phone: string): AppUser | null {
  const users = getAllUsers();
  const clean = phone.replace(/[^0-9]/g, '');
  return users.find((u) => u.phone.replace(/[^0-9]/g, '') === clean) || null;
}

export function registerCustomer(params: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  plan?: 'starter' | 'pro';
}): { ok: boolean; user?: AppUser; error?: string } {
  const users = getAllUsers();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPhone = params.phone.replace(/[^0-9]/g, '');

  if (cleanEmail === 'sonialferis@gmail.com') {
    return {
      ok: false,
      error: 'Email sonialferis@gmail.com adalah akun Administrator resmi TataDana. Akun sudah aktif dan tidak perlu didaftarkan. Silakan langsung masuk di halaman Login.',
    };
  }

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return {
      ok: false,
      error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk dengan akun yang sudah ada.',
    };
  }

  const newUser: AppUser = {
    id: `usr-${Date.now()}`,
    name: params.name.trim(),
    email: cleanEmail,
    phone: cleanPhone || params.phone.trim(),
    password: params.password || 'tatadana123',
    role: 'customer',
    plan: params.plan || 'starter',
    status: 'pending', // WAJIB diapprove admin dulu
    telegram: 'Not Connected',
    telegram_id: null,
    txCount: 0,
    created_at: new Date().toISOString(),
    approved_at: null,
  };

  users.unshift(newUser);
  saveUsersToFile(users);
  return { ok: true, user: newUser };
}

export function approveCustomer(userId: string): { ok: boolean; user?: AppUser; error?: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: 'Pengguna tidak ditemukan.' };
  }

  user.status = 'approved';
  user.approved_at = new Date().toISOString();
  user.rejected_reason = null;
  saveUsersToFile(users);
  return { ok: true, user };
}

export function rejectCustomer(userId: string, reason?: string): { ok: boolean; user?: AppUser; error?: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: 'Pengguna tidak ditemukan.' };
  }

  user.status = 'rejected';
  user.rejected_reason = reason || 'Pendaftaran ditolak oleh Administrator.';
  saveUsersToFile(users);
  return { ok: true, user };
}

export function authenticateUser(identifier: string, password?: string): {
  ok: boolean;
  role?: 'admin' | 'customer';
  user?: Partial<AppUser>;
  status?: 'pending' | 'approved' | 'rejected';
  error?: string;
  redirectTo?: string;
} {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // 1. CEK ADMIN: sonialferis@gmail.com
  if (cleanId === 'sonialferis@gmail.com') {
    if (cleanPass === 'sonial200712') {
      return {
        ok: true,
        role: 'admin',
        user: {
          name: 'Soni Alferis',
          email: 'sonialferis@gmail.com',
          role: 'admin',
          status: 'approved',
        },
        redirectTo: '/admin',
      };
    } else {
      return {
        ok: false,
        error: 'Kata sandi Administrator salah. Pastikan memasukkan kata sandi admin yang benar.',
      };
    }
  }

  // 2. CEK PELANGGAN: Cari user berdasarkan email atau nomor WhatsApp
  const users = getAllUsers();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')
  );

  if (!user) {
    return {
      ok: false,
      error: 'Akun belum terdaftar. Silakan registrasi terlebih dahulu.',
    };
  }

  // Cek kata sandi jika user login dengan kata sandi
  if (cleanPass && user.password && user.password !== cleanPass) {
    return {
      ok: false,
      error: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.',
    };
  }

  // CEK STATUS APPROVAL ADMIN
  if (user.status === 'pending') {
    return {
      ok: false,
      status: 'pending',
      error:
        'Akun Anda sedang menunggu persetujuan (approval) dari Administrator Soni Alferis. Harap tunggu hingga Admin menyetujui akun Anda sebelum dapat masuk ke dashboard.',
    };
  }

  if (user.status === 'rejected') {
    return {
      ok: false,
      status: 'rejected',
      error: `Pendaftaran akun Anda ditolak oleh Administrator.${
        user.rejected_reason ? ` Alasan: ${user.rejected_reason}` : ''
      }`,
    };
  }

  // Status APPROVED: Boleh masuk
  return {
    ok: true,
    role: 'customer',
    status: 'approved',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      plan: user.plan,
      role: 'customer',
    },
    redirectTo: '/dashboard',
  };
}
