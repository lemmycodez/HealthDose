import React, { useEffect, useMemo, useState } from 'react';
import './style.css';

type Page = 'landing' | 'chat';
type SupportedLanguage = 'english' | 'bemba' | 'nyanja';
type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  citations?: string[];
  isOffTopic?: boolean;
};

type HistoryItem = {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  date: string;
};

const BOT_NAME = 'Mwana';
const DEMO_TEMPERATURE = 0.7;
const CHAT_HISTORY_KEY = 'chatHistory';
const CHAT_MESSAGES_KEY = 'chatMessages';

const pharmacologyKeywords = [
  'ibuprofen',
  'warfarin',
  'amoxicillin',
  'aspirin',
  'metformin',
  'lisinopril',
  'drug',
  'medication',
  'medicine',
  'pill',
  'tablet',
  'capsule',
  'dose',
  'dosage',
  'side effect',
  'interaction',
  'prescription',
  'pharmacy',
  'pharmacist',
  'pain',
  'fever',
  'infection',
  'antibiotic',
  'anticoagulant',
  'nsaid',
  'blood pressure',
  'diabetes',
  'cholesterol',
  'statin',
  'analgesic',
];

const quickQuestions = [
  'What are the side effects of ibuprofen?',
  'Can I take ibuprofen with warfarin?',
  'How does amoxicillin work?',
  'What causes drug interactions?',
];

const demoResponses: Record<string, { answers: string[]; citations: string[] }> = {
  ibuprofen: {
    answers: [
      'Ibuprofen is an NSAID used to reduce pain, fever, and inflammation by reducing prostaglandin production.',
      'Ibuprofen helps with pain and inflammation. It works by blocking COX enzymes involved in inflammatory signaling.',
      'Ibuprofen is commonly used for pain and fever relief. It is a nonsteroidal anti-inflammatory medication.',
    ],
    citations: ['FDA Ibuprofen Label', 'Mayo Clinic Drug Database', 'NIH MedlinePlus'],
  },
  'ibuprofen and warfarin': {
    answers: [
      'Severe interaction risk: ibuprofen can raise bleeding risk when combined with warfarin. Avoid this combination unless your clinician directs otherwise.',
      'This combination is high risk for bleeding. If it must be used, INR and bleeding signs need close monitoring.',
      'Ibuprofen plus warfarin can be dangerous because both increase bleeding risk. Contact your provider before combining them.',
    ],
    citations: ['Drug Interactions Compendium', 'Warfarin FDA Label', 'American Heart Association Guidelines'],
  },
  warfarin: {
    answers: [
      'Warfarin is an anticoagulant that reduces clotting by blocking vitamin K-dependent clotting factors.',
      'Warfarin is a blood thinner used to prevent harmful clots. Routine INR checks are essential.',
      'Warfarin helps prevent clots, but dosing must be individualized and monitored with INR.',
    ],
    citations: ['Warfarin FDA Label', 'Cleveland Clinic Drug Guide', 'Journal of Thrombosis and Haemostasis'],
  },
  amoxicillin: {
    answers: [
      'Amoxicillin is a penicillin-class antibiotic for susceptible bacterial infections. Common side effects include stomach upset and rash.',
      'Amoxicillin works by disrupting bacterial cell wall synthesis, which stops bacterial growth.',
      'This antibiotic treats many bacterial infections and is generally well tolerated, though diarrhea and rash can occur.',
    ],
    citations: ['Amoxicillin FDA Label', 'CDC Antibiotic Guidelines', 'WHO Essential Medicines List'],
  },
  'side effects': {
    answers: [
      'Common medicine side effects include nausea, dizziness, headache, and drowsiness. Severe reactions need urgent medical care.',
      'Many drugs can cause mild stomach upset or fatigue, while breathing trouble or swelling requires immediate attention.',
      'Side effects vary by drug and patient factors; persistent or severe symptoms should be discussed with a clinician.',
    ],
    citations: ['Mayo Clinic Side Effects Guide', 'FDA Adverse Event Database', 'Clinical Pharmacology Handbook'],
  },
  interaction: {
    answers: [
      'Drug interactions can change absorption, metabolism, or total effect. Always share your full medicine list with your provider.',
      'Interactions can be pharmacokinetic or pharmacodynamic and may increase toxicity or reduce effectiveness.',
      'Even over-the-counter medicines and herbs can interact with prescriptions, so cross-check all products together.',
    ],
    citations: ['Drug Interaction Principles', 'Clinical Pharmacology Handbook', 'Medscape Drug Interaction Checker'],
  },
};

const createWelcomeMessage = (): ChatMessage => ({
  id: 'welcome',
  role: 'assistant',
  content:
    `Hello, I am ${BOT_NAME}, your HealthDose assistant. I answer medication and pharmacology questions. ` +
    'Ask a question or use one of the sample prompts.',
  timestamp: new Date().toLocaleTimeString(),
});

const getNow = () => ({
  timestamp: new Date().toLocaleTimeString(),
  date: new Date().toLocaleDateString(),
});

function pickResponseVariant(candidates: string[], temperature: number): string {
  if (candidates.length === 0) return '';
  if (temperature <= 0.2) return candidates[0];
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

function getLanguagePrefix(language: SupportedLanguage): string {
  if (language === 'bemba') return 'Mulishani. ';
  if (language === 'nyanja') return 'Moni. ';
  return '';
}

function getLanguageNote(language: SupportedLanguage): string {
  if (language === 'english') return '';
  return 'Preview mode: full Zambian language API integration is not connected yet.';
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Segoe UI Variable", "Trebuchet MS", "Lucida Sans Unicode", sans-serif',
        background: 'linear-gradient(135deg, #1f5c96 0%, #1a3552 48%, #4a2b1d 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          animation: 'pulse 15s infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          animation: 'pulse 20s infinite reverse',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '50px 20px',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '52px',
              fontWeight: 700,
              margin: '0 0 8px',
              letterSpacing: '0.5px',
            }}
          >
            HealthDose
          </h1>
          <p style={{ fontSize: '18px', margin: 0, opacity: 0.95 }}>Medication guidance demo assistant</p>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto 30px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 600, marginBottom: '14px' }}>Ask safer medicine questions, faster</h2>
          <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#f7f8fb' }}>
            This demo helps first-time users check medicine facts, side effects, and interactions using a retrieval-augmented
            assistant. Start with sample questions, then ask your own.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '22px',
            marginBottom: '28px',
          }}
        >
          {[
            { title: 'Sample prompts', text: 'Built-in first questions for quick onboarding.' },
            { title: `Named assistant`, text: `${BOT_NAME} gives your chatbot a more human identity.` },
            { title: 'Session memory', text: 'Message thread and history are saved in local storage.' },
            { title: `Temperature ${DEMO_TEMPERATURE}`, text: 'Answers can vary slightly when prompts are repeated.' },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                background: 'rgba(255,255,255,0.13)',
                padding: '24px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.22)',
              }}
            >
              <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#f4f6ff' }}>{feature.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          style={{
            background: '#ffffff',
            color: '#1d4f84',
            border: 'none',
            padding: '14px 36px',
            fontSize: '20px',
            fontWeight: 700,
            borderRadius: '999px',
            cursor: 'pointer',
            boxShadow: '0 10px 26px rgba(0,0,0,0.3)',
            marginBottom: '22px',
          }}
        >
          Start Chat
        </button>

        <div
          style={{
            backgroundColor: '#5c3721',
            color: '#ffffff',
            borderRadius: '14px',
            maxWidth: '900px',
            margin: '0 auto',
            padding: '18px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <strong>Language support:</strong> English is fully available. Bemba and Nyanja are available in preview mode while
          external API integration is pending.
        </div>
      </div>
    </div>
  );
}

function HistorySidebar({
  history,
  sidebarOpen,
  onClear,
  onDelete,
  onLoad,
}: {
  history: HistoryItem[];
  sidebarOpen: boolean;
  onClear: () => void;
  onDelete: (id: string) => void;
  onLoad: (item: HistoryItem) => void;
}) {
  return (
    <div
      style={{
        backgroundColor: '#1e3045',
        color: 'white',
        transition: 'width 0.3s, padding 0.3s',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: sidebarOpen ? '310px' : '0',
        padding: sidebarOpen ? '20px' : '0',
      }}
    >
      {sidebarOpen && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Chat History</h3>
            <button
              onClick={onClear}
              style={{
                padding: '5px 10px',
                backgroundColor: '#d64545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Clear All
            </button>
          </div>

          {history.length === 0 ? (
            <p style={{ color: '#a9b5bf', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>No chat history yet</p>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#2f4258',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1 }} onClick={() => onLoad(item)}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '3px', color: '#f1f3f5' }}>Q: {item.question}</div>
                    <div style={{ fontSize: '11px', color: '#d9e0e6', marginBottom: '3px' }}>A: {item.answer}</div>
                    <div style={{ fontSize: '10px', color: '#9fb0bf' }}>
                      {item.date} {item.timestamp}
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f2f5f7',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '5px',
                    }}
                    aria-label="Delete history item"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: '76%',
          padding: '12px 16px',
          borderRadius: '15px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          lineHeight: '1.5',
          backgroundColor: message.role === 'user' ? '#1f68c1' : '#f0f4f8',
          color: message.role === 'user' ? 'white' : '#1e2937',
        }}
      >
        {message.content}

        {message.citations && message.citations.length > 0 && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '5px' }}>Sources:</div>
            {message.citations.map((citation, idx) => (
              <div key={idx} style={{ marginLeft: '10px', fontSize: '11px', color: '#344054' }}>
                - {citation}
              </div>
            ))}
          </div>
        )}

        {message.isOffTopic && (
          <div
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: '#ffe7ad',
              color: '#513505',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            This answer is off-topic for pharmacology.
          </div>
        )}

        <div style={{ fontSize: '10px', marginTop: '5px', textAlign: 'right', opacity: 0.65 }}>{message.timestamp}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [language, setLanguage] = useState<SupportedLanguage>('english');

  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    const savedMessages = localStorage.getItem(CHAT_MESSAGES_KEY);

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory) as HistoryItem[]);
    }
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages) as ChatMessage[];
      setMessages(parsed.length > 0 ? parsed : [createWelcomeMessage()]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.2); opacity: 0.5; }
        100% { transform: scale(1); opacity: 0.3; }
      }
      button:hover { opacity: 0.9; }
      button:active { transform: scale(0.98); }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const languageNotice = useMemo(() => getLanguageNote(language), [language]);

  const handleSend = async (overrideInput?: string) => {
    const prompt = (overrideInput ?? input).trim();
    if (!prompt) return;

    const lowerMsg = prompt.toLowerCase();
    const isPharmacologyRelated = pharmacologyKeywords.some((keyword) => lowerMsg.includes(keyword.toLowerCase()));

    const { timestamp, date } = getNow();

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      let response: Omit<ChatMessage, 'id'>;

      if (!isPharmacologyRelated) {
        response = {
          role: 'assistant',
          content: `${getLanguagePrefix(language)}I can only answer pharmacology and medication questions in this demo.`,
          citations: [],
          isOffTopic: true,
          timestamp: getNow().timestamp,
        };
      } else {
        let matchedResponse: { answers: string[]; citations: string[] } | null = null;
        for (const [key, value] of Object.entries(demoResponses)) {
          if (lowerMsg.includes(key)) {
            matchedResponse = value;
            break;
          }
        }

        if (matchedResponse) {
          response = {
            role: 'assistant',
            content: `${getLanguagePrefix(language)}${pickResponseVariant(matchedResponse.answers, DEMO_TEMPERATURE)}`,
            citations: matchedResponse.citations,
            timestamp: getNow().timestamp,
          };
        } else {
          response = {
            role: 'assistant',
            content:
              `${getLanguagePrefix(language)}I do not have enough indexed information for that medicine yet. ` +
              'Please confirm with a pharmacist or clinician.',
            citations: ['General Pharmacology Reference'],
            timestamp: getNow().timestamp,
          };
        }
      }

      const responseWithId: ChatMessage = { ...response, id: (Date.now() + 1).toString() };
      setMessages((prev) => [...prev, responseWithId]);

      const historyEntry: HistoryItem = {
        id: Date.now().toString(),
        question: prompt,
        answer: `${response.content.substring(0, 95)}...`,
        timestamp: getNow().timestamp,
        date,
      };
      setHistory((prev) => [historyEntry, ...prev].slice(0, 30));
      setLoading(false);
    }, 900);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    void handleSend(question);
  };

  const deleteHistoryItem = (id: string) => setHistory((prev) => prev.filter((item) => item.id !== id));

  const clearAllHistory = () => {
    if (window.confirm('Clear all chat history and saved conversation?')) {
      setHistory([]);
      setMessages([createWelcomeMessage()]);
      localStorage.removeItem(CHAT_HISTORY_KEY);
      localStorage.removeItem(CHAT_MESSAGES_KEY);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => setInput(item.question);

  if (currentPage === 'landing') {
    return <LandingPage onStart={() => setCurrentPage('chat')} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: '"Segoe UI Variable", "Trebuchet MS", "Lucida Sans Unicode", sans-serif',
      }}
    >
      <HistorySidebar
        history={history}
        sidebarOpen={sidebarOpen}
        onClear={clearAllHistory}
        onDelete={deleteHistoryItem}
        onLoad={loadHistoryItem}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#eef2f7' }}>
        <div
          style={{
            backgroundColor: '#1f68c1',
            padding: '18px 24px',
            color: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '5px',
            }}
            aria-label="Toggle history"
          >
            {sidebarOpen ? '<' : '>'}
          </button>
          <button
            onClick={() => setCurrentPage('landing')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '5px',
            }}
          >
            Home
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '23px', fontWeight: 700, margin: 0 }}>{BOT_NAME} - HealthDose Assistant</h1>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: '4px 0 0' }}>
              Temperature {DEMO_TEMPERATURE} enabled: repeated questions may return different wording.
            </p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #c9d2de' }}
            aria-label="Language mode"
          >
            <option value="english">English</option>
            <option value="bemba">Bemba (Preview)</option>
            <option value="nyanja">Nyanja (Preview)</option>
          </select>
        </div>

        {languageNotice && (
          <div
            style={{
              background: '#fff7db',
              borderBottom: '1px solid #f0e1a6',
              color: '#5e4811',
              padding: '8px 24px',
              fontSize: '13px',
            }}
          >
            {languageNotice}
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {loading && (
            <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f0f4f8',
                  color: '#4b5563',
                  borderRadius: '15px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            padding: '14px 20px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #dde3ec',
            justifyContent: 'center',
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => handleQuickQuestion(question)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#eef2f7',
                border: '1px solid #d8e0ea',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#1f2d3d',
                cursor: 'pointer',
              }}
            >
              {question}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #dde3ec',
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
            placeholder="Ask about medications, interactions, or side effects..."
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '16px',
              border: '2px solid #d7dfe8',
              borderRadius: '10px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={loading}
            style={{
              padding: '15px 30px',
              backgroundColor: '#1f68c1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
