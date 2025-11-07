import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Test wrapper with BrowserRouter for components that use navigation
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
export { default as userEvent } from '@testing-library/user-event'

// Mock data generators
export const createMockTab = (overrides = {}) => ({
  id: 'tab-1',
  url: 'https://example.com',
  title: 'Example',
  isLoading: false,
  isSecure: true,
  history: ['https://example.com'],
  historyIndex: 0,
  ...overrides,
})

export const createMockTabGroup = (overrides = {}) => ({
  id: 'group-1',
  name: 'Test Group',
  color: '#3b82f6',
  isCollapsed: false,
  ...overrides,
})