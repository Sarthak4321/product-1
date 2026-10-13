const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^jose$": "<rootDir>/node_modules/jose/dist/node/cjs/index.js",
  },
  transformIgnorePatterns: ["/node_modules/(?!(jose)/)"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
};

module.exports = createJestConfig(customJestConfig);
