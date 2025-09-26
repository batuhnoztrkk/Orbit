// jest.setup.cjs
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

jest.mock('./src/utils/apiClient', () => ({ apiFetcher: jest.fn() }));
jest.mock('./src/utils/toastProvider', () => ({ toastError: jest.fn() }));