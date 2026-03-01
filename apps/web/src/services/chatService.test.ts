import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendToAI, type AIMessage } from './chatService'

function makeMessages(content: string): AIMessage[] {
  return [{ role: 'user', content }]
}

beforeEach(() => {
  vi.restoreAllMocks()
  // Default fetch mock to catch unexpected network calls in unit tests.
  globalThis.fetch = vi.fn(() => {
    throw new Error('Unexpected fetch call in unit test')
  }) as unknown as typeof fetch
})

describe('sendToAI common phrases', () => {
  it('responds to greetings', async () => {
    const response = await sendToAI(makeMessages('Hi'), '')
    expect(response).toContain('HealthDose')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('responds to thanks', async () => {
    const response = await sendToAI(makeMessages('Thanks!'), '')
    expect(response.text.toLowerCase()).toContain('welcome')
  })

  it('responds to capability questions', async () => {
    const response = await sendToAI(makeMessages('What can you do?'), '')
    expect(response.text.toLowerCase()).toContain('medication')
  })
})

describe('sendToAI medication lookup', () => {
  it('answers from the local knowledge base', async () => {
    const response = await sendToAI(makeMessages('What is ibuprofen used for?'), '')
    expect(response).toContain('Used for')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
