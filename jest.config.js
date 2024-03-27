module.exports = {
  // setupFilesAfterEnv: ["./src/shared/jest.ts"],
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 50 * 1000
};
