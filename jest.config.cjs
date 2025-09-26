module.exports = {
  testEnvironment: 'jsdom',

  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  setupFiles: ['<rootDir>/jest.setup.cjs'],

  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/index.{js,jsx}',
  ],

  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      lines: 70,
      functions: 70,
    },
  },

  moduleNameMapper: {
    '^@ctrlcan/filly-shared(.*)$': '<rootDir>/src$1',
  },
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "reports", outputName: "junit.xml" }],
  ],
};
