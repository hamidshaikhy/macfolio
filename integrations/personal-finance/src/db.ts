import { openDB } from "idb";
import { blankLedger, demoLedger, upgradeDemoLedger, validateLedger } from "./model";
import type { Ledger } from "./model";
export type Sealed = { iv: number[]; cipher: number[] };
type RecordUser = {
  id: string;
  login: string;
  salt: number[];
  sealed: Sealed;
  revision: number;
  demo?: boolean;
  demoSeedVersion?: number;
};
export type Session = {
  id: string;
  login: string;
  key: CryptoKey;
  ledger: Ledger;
  revision: number;
  demo: boolean;
};
const enc = new TextEncoder(),
  dec = new TextDecoder();
const db = () =>
  openDB("personal-finance-vault-v1", 1, {
    upgrade(d) {
      const s = d.createObjectStore("users", { keyPath: "id" });
      s.createIndex("login", "login", { unique: true });
    },
  });
const loginKey = (s: string) => s.trim().toLowerCase();
export async function deriveKey(password: string, salt: number[]) {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(salt),
      iterations: 310000,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function seal(
  ledger: Ledger,
  key: CryptoKey,
  aad: string,
): Promise<Sealed> {
  validateLedger(ledger);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: enc.encode(aad) },
    key,
    enc.encode(JSON.stringify(ledger)),
  );
  return { iv: Array.from(iv), cipher: Array.from(new Uint8Array(cipher)) };
}
export async function unseal(
  s: Sealed,
  key: CryptoKey,
  aad: string,
): Promise<Ledger> {
  const bytes = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(s.iv),
      additionalData: enc.encode(aad),
    },
    key,
    new Uint8Array(s.cipher),
  );
  const data = JSON.parse(dec.decode(bytes));
  validateLedger(data);
  return data;
}
export async function signup(login: string, password: string, name: string) {
  const normalized = loginKey(login);
  if (!/^[a-z0-9][a-z0-9._@+-]{2,79}$/i.test(normalized))
    throw Error(
      "نام کاربری را با حداقل ۳ حرف انگلیسی وارد کنید؛ ایمیل هم قابل استفاده است.",
    );
  if (password.length < 8 || password.length > 128)
    throw Error("رمز باید بین ۸ تا ۱۲۸ کاراکتر باشد.");
  if (!name.trim() || name.trim().length > 80)
    throw Error("نام را وارد کنید (حداکثر ۸۰ حرف).");
  if (normalized === "demo")
    throw Error("نام demo برای حساب نمایشی رزرو شده است.");
  const d = await db();
  if (await d.getFromIndex("users", "login", normalized))
    throw Error("این نام کاربری قبلاً ثبت شده است.");
  const id = crypto.randomUUID(),
    salt = Array.from(crypto.getRandomValues(new Uint8Array(16))),
    key = await deriveKey(password, salt),
    ledger = blankLedger(name.trim());
  const record: RecordUser = {
    id,
    login: normalized,
    salt,
    sealed: await seal(ledger, key, id),
    revision: 0,
  };
  try {
    await d.add("users", record);
  } catch (e) {
    if ((e as DOMException).name === "ConstraintError")
      throw Error("این نام کاربری قبلاً ثبت شده است.");
    throw e;
  }
  return {
    id,
    login: normalized,
    key,
    ledger,
    revision: 0,
    demo: false,
  } as Session;
}
export async function login(login: string, password: string): Promise<Session> {
  const d = await db();
  const user = (await d.getFromIndex("users", "login", loginKey(login))) as
    RecordUser | undefined;
  if (!user) throw Error("نام کاربری یا رمز عبور اشتباه است.");
  const key = await deriveKey(password, user.salt);
  try {
    const session = {
      id: user.id,
      login: user.login,
      key,
      ledger: await unseal(user.sealed, key, user.id),
      revision: user.revision,
      demo: !!user.demo,
    };
    return user.demo ? await refreshDemoSession(session) : session;
  } catch {
    throw Error(
      "نام کاربری یا رمز عبور اشتباه است، یا دادهٔ حساب آسیب دیده است.",
    );
  }
}
export async function demoLogin(): Promise<Session> {
  const d = await db();
  let user = (await d.getFromIndex("users", "login", "demo")) as
    RecordUser | undefined;
  if (!user) {
    const id = crypto.randomUUID(),
      salt = Array.from(crypto.getRandomValues(new Uint8Array(16))),
      key = await deriveKey("Demo2026!", salt);
    user = {
      id,
      login: "demo",
      salt,
      sealed: await seal(demoLedger(), key, id),
      revision: 0,
      demo: true,
      demoSeedVersion: 2,
    };
    try {
      await d.add("users", user);
    } catch (e) {
      if ((e as DOMException).name !== "ConstraintError") throw e;
    }
  }
  return login("demo", "Demo2026!");
}
export async function refreshDemoSession(session: Session): Promise<Session> {
  if (!session.demo) return session;
  const d = await db();
  const current = (await d.get("users", session.id)) as RecordUser | undefined;
  if (!current?.demo) return session;
  if (current.demoSeedVersion === 2 && current.revision === session.revision)
    return session;
  const ledger = current.revision === session.revision
    ? session.ledger
    : await unseal(current.sealed, session.key, session.id);
  if (current.demoSeedVersion === 2)
    return { ...session, ledger, revision: current.revision };
  const next = upgradeDemoLedger(ledger);
  const sealed = next === ledger ? current.sealed : await seal(next, session.key, session.id);
  const tx = d.transaction("users", "readwrite");
  const latest = (await tx.store.get(session.id)) as RecordUser | undefined;
  if (!latest || latest.revision !== current.revision || latest.demoSeedVersion === 2) {
    tx.abort();
    await tx.done.catch(() => {});
    // Another login or save won the race; read it before considering a write.
    return refreshDemoSession(session);
  }
  const revision = current.revision + 1;
  await tx.store.put({ ...latest, sealed, revision, demoSeedVersion: 2 });
  await tx.done;
  return { ...session, ledger: next, revision };
}
export async function saveLedger(
  session: Session,
  ledger: Ledger,
): Promise<Session> {
  const sealed = await seal(ledger, session.key, session.id);
  const d = await db(),
    tx = d.transaction("users", "readwrite");
  const current = (await tx.store.get(session.id)) as RecordUser | undefined;
  if (!current || current.revision !== session.revision) {
    tx.abort();
    await tx.done.catch(() => {});
    throw Error(
      "این حساب در تب دیگری تغییر کرده است. خارج شوید و دوباره وارد شوید تا آخرین اطلاعات بارگذاری شود.",
    );
  }
  const revision = current.revision + 1;
  await tx.store.put({ ...current, sealed, revision });
  await tx.done;
  return { ...session, ledger, revision };
}
export async function changePassword(
  session: Session,
  oldPassword: string,
  newPassword: string,
): Promise<Session> {
  await login(session.login, oldPassword);
  if (session.demo) throw Error("رمز حساب دمو قابل تغییر نیست.");
  if (newPassword.length < 8 || newPassword.length > 128)
    throw Error("رمز جدید باید بین ۸ تا ۱۲۸ کاراکتر باشد.");
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16))),
    key = await deriveKey(newPassword, salt),
    sealed = await seal(session.ledger, key, session.id);
  const d = await db(),
    tx = d.transaction("users", "readwrite"),
    current = (await tx.store.get(session.id)) as RecordUser | undefined;
  if (!current || current.revision !== session.revision) {
    tx.abort();
    await tx.done.catch(() => {});
    throw Error("اطلاعات حساب تغییر کرده است؛ دوباره وارد شوید.");
  }
  await tx.store.put({
    ...current,
    salt,
    sealed,
    revision: current.revision + 1,
  });
  await tx.done;
  return { ...session, key, revision: current.revision + 1 };
}
export async function exportBackup(session: Session, password: string) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
  if (password.length < 8 || password.length > 128)
    throw Error(
      "برای فایل پشتیبان رمزی با حداقل ۸ و حداکثر ۱۲۸ کاراکتر انتخاب کنید.",
    );
  const key = await deriveKey(password, salt);
  return {
    format: "personal-finance-backup",
    version: 1,
    salt,
    sealed: await seal(session.ledger, key, "backup-v1"),
  };
}
export async function importBackup(value: unknown, password: string) {
  const b = value as {
    format: string;
    version: number;
    salt: number[];
    sealed: Sealed;
  };
  const bytes = (v: unknown, max: number) =>
    Array.isArray(v) &&
    v.length <= max &&
    v.every((x) => Number.isInteger(x) && x >= 0 && x <= 255);
  if (
    !b ||
    b.format !== "personal-finance-backup" ||
    b.version !== 1 ||
    !bytes(b.salt, 16) ||
    b.salt.length !== 16 ||
    !b.sealed ||
    !bytes(b.sealed.iv, 12) ||
    b.sealed.iv.length !== 12 ||
    !bytes(b.sealed.cipher, 20000000)
  )
    throw Error("فایل پشتیبان معتبر نیست.");
  try {
    return await unseal(
      b.sealed,
      await deriveKey(password, b.salt),
      "backup-v1",
    );
  } catch {
    throw Error("رمز فایل اشتباه است یا فایل پشتیبان آسیب دیده است.");
  }
}
