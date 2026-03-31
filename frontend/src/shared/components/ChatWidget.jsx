import { useState, useRef, useEffect } from 'react'
import { Bot, User, X, MessageCircle } from 'lucide-react'
import { PromptInputBox } from './PromptInputBox'
import { getToken } from '../lib/auth'
import ChatMessageContent from './ChatMessageContent'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm your ConsultHub assistant. How can I help you today?",
    },
  ])
  const [conversationId, setConversationId] = useState(null)
  const [conversationHistory, setConversationHistory] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { id: Date.now(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    try {
      const token = getToken()
      const body = {
        message: text,
        ...(conversationId ? { conversationId } : {}),
        ...(conversationHistory ? { conversationHistory } : {}),
      }
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.conversationId) setConversationId(data.conversationId)
      if (data.conversationHistory) setConversationHistory(data.conversationHistory)
      const reply = data?.reply ?? 'No response received.'
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again shortly." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {open && (
        <div className="w-[360px] rounded-2xl border border-[#2e303a] bg-[#16171d] shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '500px' }}>
          {/* Header */}
          <div className="border-b border-[#2e303a] px-4 py-3 flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-none">ConsultHub Assistant</p>
              <p className="text-xs text-gray-400 mt-0.5">AI-powered support</p>
            </div>
            <div className="flex items-center gap-1.5 mr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">Online</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#2e303a] text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-[#2e303a]'}`}>
                  {msg.role === 'user'
                    ? <User className="w-3 h-3 text-white" />
                    : <Bot className="w-3 h-3 text-gray-300" />
                  }
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-[#1F2023] text-gray-100 border border-[#333333] rounded-tl-sm'
                }`}>
                  <ChatMessageContent content={msg.content} role={msg.role} />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#2e303a] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-gray-300" />
                </div>
                <div className="bg-[#1F2023] border border-[#333333] rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#2e303a] p-3 flex-shrink-0">
            <PromptInputBox onSend={sendMessage} isLoading={isLoading} placeholder="Ask me anything..." />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  )
}
