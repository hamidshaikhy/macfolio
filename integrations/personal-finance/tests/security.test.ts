import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDB } from "idb";
import {
  signup,
  login,
  saveLedger,
  seal,
  unseal,
  changePassword,
  exportBackup,
  importBackup,
  demoLogin,
  refreshDemoSession,
} from "../src/db";
import { blankLedger, applyTransaction, today, summary, monthKey, monthRange, shiftMonth } from "../src/model";
import { legacyDemoLedger } from "./fixtures/legacy-demo";
test("signup persists encrypted data, plaintext finance/name/password absent from disk", async () => {
  const s = await signup("alice", "StrongPass123!", "نام خصوصی");
  const db = await openDB("personal-finance-vault-v1");
  const raw = await db.get("users", s.id);
  const disk = JSON.stringify(raw);
  assert.ok(!disk.includes("نام خصوصی"));
  assert.ok(!disk.includes("StrongPass123!"));
  assert.ok(!disk.includes("transactions"));
  assert.ok(raw.sealed.cipher.length > 0);
  assert.equal(
    (await login("ALICE", "StrongPass123!")).ledger.name,
    "نام خصوصی",
  );
});
test("wrong password and nonexistent account cannot unlock data", async () => {
  await assert.rejects(() => login("alice", "wrong"));
  await assert.rejects(() => login("missing", "StrongPass123!"));
});
test("independent users cannot decrypt each others vault, even with identical password", async () => {
  const a = await signup("bob", "same-password", "باب"),
    b = await signup("carol", "same-password", "کارول");
  const raw = await seal(a.ledger, a.key, a.id);
  await assert.rejects(() => unseal(raw, b.key, a.id));
  await assert.rejects(() => unseal(raw, a.key, b.id));
  assert.notEqual(a.id, b.id);
});
test("saving one user never changes another user; reload retrieves only owner data", async () => {
  let a = await login("alice", "StrongPass123!");
  const b = await login("bob", "same-password");
  const next = { ...a.ledger, name: "دادهٔ اختصاصی آلیس" };
  a = await saveLedger(a, next);
  assert.equal(
    (await login("alice", "StrongPass123!")).ledger.name,
    "دادهٔ اختصاصی آلیس",
  );
  assert.equal(
    (await login("bob", "same-password")).ledger.name,
    b.ledger.name,
  );
});
test("stale tab cannot overwrite newer save", async () => {
  const a = await login("alice", "StrongPass123!"),
    stale = await login("alice", "StrongPass123!");
  await saveLedger(a, { ...a.ledger, name: "آخرین نسخه" });
  await assert.rejects(
    () => saveLedger(stale, { ...stale.ledger, name: "قدیمی" }),
    /تب دیگری/,
  );
  assert.equal(
    (await login("alice", "StrongPass123!")).ledger.name,
    "آخرین نسخه",
  );
});
test("encrypted vault detects tampering", async () => {
  const a = await login("alice", "StrongPass123!");
  const raw = await seal(a.ledger, a.key, a.id);
  raw.cipher[3] ^= 1;
  await assert.rejects(() => unseal(raw, a.key, a.id));
});
test("case-insensitive unique usernames and reserved demo", async () => {
  await assert.rejects(() => signup("ALICE", "12345678", "دوم"));
  await assert.rejects(() => signup("demo", "12345678", "دمو"));
  await assert.rejects(() => signup("اب", "12345678", "x"));
  await assert.rejects(() => signup("shortpass", "123", "x"));
});
test("password rotation revokes old password and old sessions, preserves data", async () => {
  const s = await signup("rotate", "old-password", "رمز"),
    stale = await login("rotate", "old-password");
  const next = await changePassword(s, "old-password", "new-password");
  await assert.rejects(() => login("rotate", "old-password"));
  assert.equal((await login("rotate", "new-password")).ledger.name, "رمز");
  await assert.rejects(() => saveLedger(stale, stale.ledger));
  assert.equal(next.revision, 1);
});
test("backup restores to another account with independent backup key, no usernames", async () => {
  const a = await login("alice", "StrongPass123!"),
    backup = await exportBackup(a, "backup-password");
  assert.ok(!JSON.stringify(backup).includes("alice"));
  await assert.rejects(() => importBackup(backup, "wrong-password"));
  const restored = await importBackup(
    JSON.parse(JSON.stringify(backup)),
    "backup-password",
  );
  assert.equal(restored.name, a.ledger.name);
  const b = await login("bob", "same-password");
  await saveLedger(b, restored);
  assert.equal(
    (await login("bob", "same-password")).ledger.name,
    a.ledger.name,
  );
  assert.equal(
    (await login("alice", "StrongPass123!")).ledger.name,
    a.ledger.name,
  );
});
test("backup schema limits and tampering are rejected", async () => {
  await assert.rejects(() => importBackup({ format: "wrong" }, "anything"));
  const a = await login("alice", "StrongPass123!"),
    b = await exportBackup(a, "backup-password");
  b.sealed.iv[0] ^= 1;
  await assert.rejects(() => importBackup(b, "backup-password"));
});
test("demo is prefilled, persists modifications separately and never enters fresh signup", async () => {
  const demo = await demoLogin();
  assert.ok(demo.demo);
  assert.ok(demo.ledger.transactions.length > 0);
  await saveLedger(demo, { ...demo.ledger, name: "دمو تغییرکرده" });
  assert.equal((await demoLogin()).ledger.name, "دمو تغییرکرده");
  const fresh = await signup("fresh", "new-account-password", "جدید");
  assert.equal(fresh.ledger.transactions.length, 0);
  assert.equal(fresh.ledger.accounts.length, 0);
});
test("no unencrypted key or password is saved in account record", async () => {
  const db = await openDB("personal-finance-vault-v1");
  for (const raw of await db.getAll("users"))
    assert.deepEqual(
      Object.keys(raw).sort(),
      raw.demo
        ? ["demo", "demoSeedVersion", "id", "login", "revision", "salt", "sealed"].sort()
        : ["id", "login", "revision", "salt", "sealed"].sort(),
    );
});

test("stored legacy demo upgrades once, survives concurrent logins, and preserves user edits", async () => {
  const stale = await demoLogin(), l = legacyDemoLedger();
  l.name = "نام اختصاصی دمو";
  const edited = l.transactions.find((t) => t.kind === "expense" && t.categoryId !== "home")!;
  edited.amount = 321000;
  const deleted = l.transactions.find((t) => t.kind === "expense" && t.id !== edited.id)!;
  l.transactions = l.transactions.filter((t) => t.id !== deleted.id);
  const added = {
    id: "custom-demo-expense", kind: "expense" as const, amount: 250000,
    date: today(), accountId: "bank", categoryId: "food", note: "هزینهٔ اضافه‌شده توسط کاربر",
  };
  l.transactions.push(added);
  const d = await openDB("personal-finance-vault-v1");
  const raw = await d.get("users", stale.id);
  delete raw.demoSeedVersion;
  raw.revision++;
  raw.sealed = await seal(l, stale.key, stale.id);
  await d.put("users", raw);

  const [a, b] = await Promise.all([demoLogin(), login("DEMO", "Demo2026!")]);
  assert.equal(a.revision, raw.revision + 1);
  assert.equal(b.revision, a.revision);
  assert.deepEqual(a.ledger, b.ledger);
  assert.equal(a.ledger.name, l.name);
  assert.deepEqual(a.ledger.accounts, l.accounts);
  assert.deepEqual(a.ledger.budgets, l.budgets);
  assert.deepEqual(a.ledger.goals, l.goals);
  assert.deepEqual(a.ledger.scheduled, l.scheduled);
  assert.deepEqual(a.ledger.transactions.map((t) => t.id), l.transactions.map((t) => t.id));
  assert.deepEqual(a.ledger.transactions.find((t) => t.id === edited.id), edited);
  assert.deepEqual(a.ledger.transactions.find((t) => t.id === added.id), added);
  assert.ok(!a.ledger.transactions.some((t) => t.id === deleted.id));
  assert.deepEqual(a.ledger.transactions.filter((t) => t.kind === "transfer"), l.transactions.filter((t) => t.kind === "transfer"));
  const history = Array.from({ length: 6 }, (_, i) => summary(a.ledger, monthRange(shiftMonth(monthKey(today()), i - 5))));
  assert.equal(new Set(history.map((s) => s.income)).size, 6);
  assert.equal(new Set(history.map((s) => s.expense)).size, 6);
  const completed = history.slice(0, 5).map((s) => s.expense);
  assert.ok(Math.max(...completed) / Math.min(...completed) > 1.5);
  const persisted = await demoLogin();
  assert.equal(persisted.revision, a.revision);
  assert.deepEqual(persisted.ledger, a.ledger);
  assert.equal((await d.get("users", stale.id)).demoSeedVersion, 2);
  assert.deepEqual((await refreshDemoSession(stale)).ledger, a.ledger);
  await assert.rejects(() => saveLedger(stale, stale.ledger));
});

test("legacy-looking transactions in a real account are never migrated", async () => {
  const s = await signup("real-legacy", "real-account-password", "حساب واقعی");
  const l = legacyDemoLedger();
  await saveLedger(s, l);
  const reloaded = await login("real-legacy", "real-account-password");
  assert.deepEqual(reloaded.ledger, l);
  assert.equal(reloaded.revision, 1);
  assert.equal(await refreshDemoSession(reloaded), reloaded);
});
