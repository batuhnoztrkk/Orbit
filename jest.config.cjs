module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    // CSS Modules / global CSS
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.css$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }]
  }
};
