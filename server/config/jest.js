// Mocking the "bull" module, since Queues are detected as
// open handles by Jest when running tests
jest.mock("bull");
