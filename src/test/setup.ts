import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

afterEach(() => {
  cleanup()
})

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = ResizeObserverStub as typeof ResizeObserver
}
