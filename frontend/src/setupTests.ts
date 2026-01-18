// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock URL.createObjectURL and revokeObjectURL globally for all tests
Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn(() => "blob:mock-url"),
})

Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
})