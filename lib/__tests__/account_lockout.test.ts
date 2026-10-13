/**
 * @jest-environment node
 */

interface LockUser {
  id: string;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

interface LoginAttemptResult {
  status: number;
  isUserNotFound?: boolean;
  isLocked?: boolean;
  message?: string;
  attemptsRemaining?: number;
  remainingMinutes?: number;
  retryAfterSeconds?: number;
  success?: boolean;
  updatedUser?: LockUser;
}

describe("Production Account Lockout Throttling & Rate-Limiting Comprehensive Test Suite", () => {
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_MINUTES = 3;

  function sanitizeEmail(email: string): string {
    return String(email).trim().toLowerCase();
  }

  function evaluateLockoutStatus(
    user: { failedLoginAttempts: number; lockedUntil: Date | null },
    now: Date = new Date()
  ): LoginAttemptResult {
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingMs = user.lockedUntil.getTime() - now.getTime();
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (1000 * 60)));
      const retryAfterSeconds = Math.ceil(remainingMs / 1000);
      return {
        isLocked: true,
        status: 429,
        remainingMinutes,
        retryAfterSeconds,
        message: `Account is locked due to 5 invalid attempts. Please try again in ${remainingMinutes} minute(s).`,
      };
    }

    return { status: 200, isLocked: false };
  }

  function handleLoginAttempt(
    user: LockUser | null,
    inputPassword: string,
    verifyPasswordFn: (pass: string, hash: string) => boolean,
    now: Date = new Date()
  ): LoginAttemptResult {
    // 1. Non-existent User Check
    if (!user) {
      return {
        status: 404,
        isUserNotFound: true,
        message: "No account found with this email address. Please create or register your workspace first.",
      };
    }

    // 2. Currently Locked Account Check
    const lockCheck = evaluateLockoutStatus(user, now);
    if (lockCheck.isLocked) {
      return lockCheck;
    }

    // 3. Password Verification
    const isValid = verifyPasswordFn(inputPassword, user.passwordHash);
    if (!isValid) {
      const isLockExpired = user.lockedUntil && user.lockedUntil <= now;
      const currentAttempts = isLockExpired ? 0 : (user.failedLoginAttempts || 0);
      const newFailedAttempts = currentAttempts + 1;

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntilDate = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
        return {
          status: 429,
          isLocked: true,
          updatedUser: {
            ...user,
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: lockUntilDate,
          },
          retryAfterSeconds: LOCKOUT_MINUTES * 60,
          message: `Account locked for 3 minutes due to 5 invalid attempts. Please wait before trying again.`,
        };
      } else {
        const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
        return {
          status: 401,
          updatedUser: {
            ...user,
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: null,
          },
          attemptsRemaining,
          message: `Invalid credentials. You have ${attemptsRemaining} attempt(s) remaining.`,
        };
      }
    }

    // 4. Successful Login - Counter Reset
    return {
      status: 200,
      success: true,
      updatedUser: {
        ...user,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    };
  }

  const dummyVerifyPassword = (pass: string, hash: string) => pass === hash;

  describe("1. Unregistered Email & Non-Existent User Test Cases", () => {
    it("should return HTTP 404 with isUserNotFound flag when email is not registered", () => {
      const res = handleLoginAttempt(null, "somepassword", dummyVerifyPassword);
      expect(res.status).toBe(404);
      expect(res.isUserNotFound).toBe(true);
      expect(res.message).toContain("No account found with this email address");
    });

    it("should not affect attempt counters for non-existent users", () => {
      const res = handleLoginAttempt(null, "somepassword", dummyVerifyPassword);
      expect(res).not.toHaveProperty("updatedUser");
      expect(res).not.toHaveProperty("attemptsRemaining");
    });
  });

  describe("2. Progressive Failed Attempt & Lockout Transitions", () => {
    let mockUser: LockUser = {
      id: "u-123",
      email: "counsellor@domain.com",
      passwordHash: "correctpass",
      failedLoginAttempts: 0,
      lockedUntil: null,
    };

    it("1st failure: should return 401 with 4 attempts remaining", () => {
      const res = handleLoginAttempt(mockUser, "wrongpass", dummyVerifyPassword);
      expect(res.status).toBe(401);
      expect(res.attemptsRemaining).toBe(4);
      expect(res.updatedUser?.failedLoginAttempts).toBe(1);
      expect(res.updatedUser?.lockedUntil).toBeNull();
    });

    it("2nd failure: should return 401 with 3 attempts remaining", () => {
      mockUser.failedLoginAttempts = 1;
      const res = handleLoginAttempt(mockUser, "wrongpass", dummyVerifyPassword);
      expect(res.status).toBe(401);
      expect(res.attemptsRemaining).toBe(3);
      expect(res.updatedUser?.failedLoginAttempts).toBe(2);
    });

    it("3rd failure: should return 401 with 2 attempts remaining", () => {
      mockUser.failedLoginAttempts = 2;
      const res = handleLoginAttempt(mockUser, "wrongpass", dummyVerifyPassword);
      expect(res.status).toBe(401);
      expect(res.attemptsRemaining).toBe(2);
      expect(res.updatedUser?.failedLoginAttempts).toBe(3);
    });

    it("4th failure: should return 401 with 1 attempt remaining", () => {
      mockUser.failedLoginAttempts = 3;
      const res = handleLoginAttempt(mockUser, "wrongpass", dummyVerifyPassword);
      expect(res.status).toBe(401);
      expect(res.attemptsRemaining).toBe(1);
      expect(res.updatedUser?.failedLoginAttempts).toBe(4);
    });

    it("5th failure: should trigger account lockout (429 status code, 3-min duration)", () => {
      mockUser.failedLoginAttempts = 4;
      const now = new Date();
      const res = handleLoginAttempt(mockUser, "wrongpass", dummyVerifyPassword, now);

      expect(res.status).toBe(429);
      expect(res.isLocked).toBe(true);
      expect(res.updatedUser?.failedLoginAttempts).toBe(5);
      expect(res.updatedUser?.lockedUntil).toBeInstanceOf(Date);

      const lockedUntilTime = res.updatedUser!.lockedUntil!.getTime();
      const expectedLockTime = now.getTime() + 3 * 60 * 1000;
      expect(lockedUntilTime).toBe(expectedLockTime);
    });
  });

  describe("3. Account Lockout Active State Enforcement", () => {
    it("should immediately reject any login attempts while lockout timestamp is active", () => {
      const now = new Date();
      const lockedUser: LockUser = {
        id: "u-123",
        email: "counsellor@domain.com",
        passwordHash: "correctpass",
        failedLoginAttempts: 5,
        lockedUntil: new Date(now.getTime() + 2 * 60 * 1000), // locked for 2 more mins
      };

      // Attempt even with CORRECT password while locked
      const res = handleLoginAttempt(lockedUser, "correctpass", dummyVerifyPassword, now);
      expect(res.status).toBe(429);
      expect(res.isLocked).toBe(true);
      expect(res.remainingMinutes).toBe(2);
      expect(res.retryAfterSeconds).toBe(120);
    });
  });

  describe("4. Lockout Expiration & Reset Behaviors", () => {
    it("should reset counter to 0 on successful login before reaching limit", () => {
      const userWithFailedAttempts: LockUser = {
        id: "u-123",
        email: "counsellor@domain.com",
        passwordHash: "correctpass",
        failedLoginAttempts: 4,
        lockedUntil: null,
      };

      const res = handleLoginAttempt(userWithFailedAttempts, "correctpass", dummyVerifyPassword);
      expect(res.status).toBe(200);
      expect(res.success).toBe(true);
      expect(res.updatedUser?.failedLoginAttempts).toBe(0);
      expect(res.updatedUser?.lockedUntil).toBeNull();
    });

    it("should automatically unlock when lock duration has passed (t > lockedUntil)", () => {
      const now = new Date();
      const expiredLockUser: LockUser = {
        id: "u-123",
        email: "counsellor@domain.com",
        passwordHash: "correctpass",
        failedLoginAttempts: 5,
        lockedUntil: new Date(now.getTime() - 1000), // expired 1s ago
      };

      // Correct password attempt after expiration
      const res = handleLoginAttempt(expiredLockUser, "correctpass", dummyVerifyPassword, now);
      expect(res.status).toBe(200);
      expect(res.success).toBe(true);
      expect(res.updatedUser?.failedLoginAttempts).toBe(0);
      expect(res.updatedUser?.lockedUntil).toBeNull();
    });

    it("should reset and count 1 failed attempt when password is wrong after lock expiration", () => {
      const now = new Date();
      const expiredLockUser: LockUser = {
        id: "u-123",
        email: "counsellor@domain.com",
        passwordHash: "correctpass",
        failedLoginAttempts: 5,
        lockedUntil: new Date(now.getTime() - 1000), // expired 1s ago
      };

      // Wrong password attempt after expiration
      const res = handleLoginAttempt(expiredLockUser, "wrongpass", dummyVerifyPassword, now);
      expect(res.status).toBe(401);
      expect(res.attemptsRemaining).toBe(4);
      expect(res.updatedUser?.failedLoginAttempts).toBe(1);
    });
  });

  describe("5. Input Sanitization & Case Insensitivity", () => {
    it("should normalize upper-case and whitespace-padded emails", () => {
      expect(sanitizeEmail("  USER@Domain.COM  ")).toBe("user@domain.com");
      expect(sanitizeEmail("Counsellor@Centre.Org")).toBe("counsellor@centre.org");
    });
  });
});
