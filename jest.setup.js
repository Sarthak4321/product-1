process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-for-jest-unit-tests-2026";

const { TextEncoder, TextDecoder } = require("util");

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}
