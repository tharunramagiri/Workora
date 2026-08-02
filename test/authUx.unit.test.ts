// Unit regressions for human-auth error UX and account-creation gating.
// Run: npx tsx --test --test-force-exit test/authUx.unit.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routeSrc = fs.readFileSync(new URL("../src/server/routes-api/auth.ts", import.meta.url), "utf8");
const authSrc = fs.readFileSync(new URL("../web/src/views/Auth.tsx", import.meta.url), "utf8");
const en = JSON.parse(fs.readFileSync(new URL("../web/src/locales/en.json", import.meta.url), "utf8"));

test("login returns one generic error for both unknown email and wrong password (no enumeration)", () => {
  // Regression guard: login must NOT expose whether an email is registered. A single shared code/message
  // for "no such user" and "wrong password" prevents attackers from enumerating valid accounts.
  assert.doesNotMatch(routeSrc, /auth_login_email_not_found/, "must not reintroduce an email-specific login error code");
  assert.doesNotMatch(routeSrc, /auth_login_password_wrong/, "must not reintroduce a password-specific login error code");
  assert.match(routeSrc, /auth_login_invalid/);
  assert.match(routeSrc, /!b\.email\.trim\(\)/);
  assert.match(routeSrc, /!b\.password\.trim\(\)/);
  const invalidCount = (routeSrc.match(/code:\s*"auth_login_invalid"/g) ?? []).length;
  assert.equal(invalidCount, 1, "exactly one shared invalid-credentials code path");
});

test("registration is gated after the first account: requires a valid, non-expired, non-exhausted invite", () => {
  assert.match(routeSrc, /auth_register_invite_required/);
  assert.match(routeSrc, /userCount > 0/, "registration must check whether any user already exists");
  assert.match(routeSrc, /inviteToken/, "gated registration must accept an invite token from the request body");
  assert.match(routeSrc, /expired/);
  assert.match(routeSrc, /exhausted/);
});

test("registration conflicts expose stable codes for email and username collisions", () => {
  assert.match(routeSrc, /auth_register_email_taken/);
  assert.match(routeSrc, /auth_register_username_taken/);
  assert.match(routeSrc, /code:\s*dup\.email === b\.email \? "auth_register_email_taken" : "auth_register_username_taken"/);
});

test("Auth page maps backend error codes to localized actionable copy", () => {
  assert.match(authSrc, /authErrorMessage/);
  assert.match(authSrc, /data\?\.code/);
  assert.match(authSrc, /auth\.errors\./);

  assert.equal(en.auth.errors.auth_login_invalid, "Invalid email or password.");
  assert.equal(en.auth.errors.auth_register_email_taken, "That email already has an account. Sign in instead.");
  assert.equal(en.auth.errors.auth_register_username_taken, "That username is taken. Choose another @mention name.");
  assert.equal(en.auth.errors.auth_register_invite_required, "This workspace requires an invite to join. Ask an admin for an invite link.");
});

test("Auth form errors are announced and tied to fields", () => {
  assert.match(authSrc, /role="alert"/);
  assert.match(authSrc, /aria-live="polite"/);
  assert.match(authSrc, /const describedBy = err \? "auth-error" : undefined/);
  assert.match(authSrc, /aria-describedby=\{describedBy\}/);
  assert.match(authSrc, /<label[^>]*htmlFor="auth-email"/);
  assert.match(authSrc, /<label[^>]*htmlFor="auth-password"/);
  assert.match(authSrc, /id="auth-email"[\s\S]*?required/);
  assert.match(authSrc, /id="auth-password"[\s\S]*?required/);
  assert.match(authSrc, /<form[^>]*className="auth-form"/);
  assert.match(authSrc, /onSubmit=\{submit/);
  assert.match(authSrc, /type="submit"/);
  assert.match(authSrc, /nativeEvent\.isComposing/);
  assert.doesNotMatch(authSrc, /onSubmit\(\)/, "password Enter handling must not bypass native form validation");
});
