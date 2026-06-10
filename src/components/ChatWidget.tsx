import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, MessageSquare, Send, 
  Compass, HelpCircle, ArrowRight, 
  Sparkles, Shirt, ShoppingBag, Plus
} from 'lucide-react';
import { sendMessageToAgent, generateSessionId, type ClothingItem, mockClothingItems } from '../services/agentService';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  clothingItems?: ClothingItem[];
}

interface ChatWidgetProps {
  openTrigger: boolean;
  setOpenTrigger: (val: boolean) => void;
  prefilledPrompt: string;
  clearPrefilledPrompt: () => void;
}

type TabType = 'home' | 'messages' | 'listings' | 'help';

interface CartItem {
  item: ClothingItem;
  count: number;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  openTrigger,
  setOpenTrigger,
  prefilledPrompt,
  clearPrefilledPrompt
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  
  // Real active cart state for a high-end customer experience!
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Track expanded FAQs
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync open trigger from parent
  useEffect(() => {
    if (openTrigger) {
      setIsOpen(true);
      setActiveTab('messages');
      setOpenTrigger(false);
    }
  }, [openTrigger, setOpenTrigger]);

  // Sync prefilled prompt (e.g. from Hero or Product Grid cards)
  useEffect(() => {
    if (prefilledPrompt) {
      setIsOpen(true);
      setActiveTab('messages');
      
      // If there's no conversation started, start it first
      if (messages.length === 0) {
        startChat(prefilledPrompt);
      } else {
        handleSend(prefilledPrompt);
      }
      clearPrefilledPrompt();
    }
  }, [prefilledPrompt, clearPrefilledPrompt, messages]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  // Cart logic
  const handleAddToCart = (item: ClothingItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, count: c.count + 1 } : c);
      }
      return [...prev, { item, count: 1 }];
    });
  };

  const getCartTotal = () => {
    return cart.reduce((acc, c) => acc + c.item.price * c.count, 0);
  };

  const getCartCount = () => {
    return cart.reduce((acc, c) => acc + c.count, 0);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Clear any active streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    // Append user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    // If user is ordering via a command, intercept locally for cart injection
    const orderMatch = textToSend.toLowerCase().match(/add\s+(pr\d+)/i) || textToSend.toLowerCase().match(/order\s+(pr\d+)/i);
    if (orderMatch) {
      const itemId = orderMatch[1].toUpperCase();
      const matchItem = mockClothingItems.find(f => f.id === itemId);
      if (matchItem) {
        handleAddToCart(matchItem);
      }
    }

    try {
      const response = await sendMessageToAgent(textToSend, sessionId);
      
      // Setup dynamic streaming for a highly premium response feel
      const agentMsgId = Math.random().toString();
      const placeholderMsg: Message = {
        id: agentMsgId,
        sender: 'agent',
        text: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, placeholderMsg]);
      setIsLoading(false); // Hide standard loading dots once streaming starts

      const fullText = response.text;
      const words = fullText.split(/(\s+)/);
      let currentWordIndex = 0;
      let accumulatedText = '';

      streamingIntervalRef.current = setInterval(() => {
        if (currentWordIndex < words.length) {
          accumulatedText += words[currentWordIndex];
          currentWordIndex++;
          
          setMessages(prev => prev.map(msg => 
            msg.id === agentMsgId 
              ? { ...msg, text: accumulatedText }
              : msg
          ));
        } else {
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
          }

          // Streaming complete, append any parsed clothing items to the message
          if (response.clothingItems && response.clothingItems.length > 0) {
            setMessages(prev => prev.map(msg => 
              msg.id === agentMsgId 
                ? { ...msg, clothingItems: response.clothingItems }
                : msg
            ));
          }
        }
      }, 15);

    } catch (err) {
      console.error(err);
      setIsLoading(false);
      
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'agent',
        text: "I experienced a brief server timeout connecting to our atelier advisor. However, our smart inventory simulator is running. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const startChat = (initialInput?: string) => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    const welcomeText = `### Welcome to Thread & Co.! 🧥✨\n\nI am your smart AI Styling Advisor & Closet Assistant. How can I elevate your style today?\n\nI can:\n* **Recommend premium apparel** (e.g. *'Show me hoodies'* or *'Suggest straight-fit jeans'*)\n* **Browse our collections** (e.g. *'Show me the full collection'*)\n* **Examine fit & dimensions** (e.g. *'What size is the Black Hoodie?'*)\n* **Add items to your bag** (e.g. *'Add PR001 to my bag'*)\n\n*What style fits or items would you like to explore today?*`;
    
    const agentMsgId = 'welcome';
    const placeholderMsg: Message = {
      id: agentMsgId,
      sender: 'agent',
      text: '',
      timestamp: new Date()
    };
    setMessages([placeholderMsg]);

    const words = welcomeText.split(/(\s+)/);
    let currentWordIndex = 0;
    let accumulatedText = '';

    streamingIntervalRef.current = setInterval(() => {
      if (currentWordIndex < words.length) {
        accumulatedText += words[currentWordIndex];
        currentWordIndex++;
        
        setMessages(prev => prev.map(msg => 
          msg.id === agentMsgId 
            ? { ...msg, text: accumulatedText }
            : msg
        ));
      } else {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
        }
        
        // Auto-send initial prefilled prompt if any
        if (initialInput) {
          handleSend(initialInput);
        }
      }
    }, 12);
  };

  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content: React.ReactNode = line;

      // Handle Markdown headers
      if (line.startsWith('###')) {
        return <h3 key={idx} style={{ marginTop: '10px', marginBottom: '4px', color: 'var(--accent-orange)', fontWeight: 800, fontSize: '0.92rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{line.replace('###', '').trim()}</h3>;
      }
      if (line.startsWith('##')) {
        return <h3 key={idx} style={{ marginTop: '12px', marginBottom: '4px', color: 'var(--accent-orange)', fontWeight: 800, fontSize: '0.98rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{line.replace('##', '').trim()}</h3>;
      }

      // Handle bold tags
      if (line.includes('**')) {
        const parts = line.split('**');
        content = parts.map((part, index) => {
          if (index % 2 === 1) {
            return <strong key={index} style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>{part}</strong>;
          }
          return part;
        });
      }

      // Handle bullet points
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        return (
          <li key={idx} style={{ marginLeft: '14px', marginBottom: '3px', listStyleType: 'disc', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {typeof content === 'string' ? line.substring(1).trim() : content}
          </li>
        );
      }

      // Handle numbered lists
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={idx} style={{ marginLeft: '14px', marginBottom: '3px', listStyleType: 'decimal', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {numMatch[2]}
          </li>
        );
      }

      return <p key={idx} style={{ marginBottom: '6px', fontSize: '0.82rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>{content}</p>;
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <div 
          className="chat-toggle-container"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999
          }}
        >
          {/* Glowing suggestion badge */}
          <div 
            onClick={() => setIsOpen(true)}
            className="chat-suggestion-pill"
            style={{
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--accent-orange)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--accent-orange)',
              cursor: 'pointer',
              animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards, pulseGlow 3s infinite ease-in-out',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-orange)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Consult AI Stylist</span>
            {getCartCount() > 0 && (
              <span style={{ 
                background: 'var(--accent-orange)', 
                color: '#ffffff', 
                borderRadius: '50%', 
                padding: '2px 6px', 
                fontSize: '0.68rem', 
                fontWeight: 900,
                marginLeft: '4px'
              }}>
                {getCartCount()}
              </span>
            )}
            <span style={{ 
              display: 'inline-block',
              animation: 'bounceLeftRight 1.2s infinite ease-in-out',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: 'var(--accent-gold)'
            }}>
              ➔
            </span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="pulse-active"
            style={{
              background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-gold))',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(79, 70, 229, 0.2)',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MessageSquare size={26} color="#ffffff" />
          </button>
        </div>
      )}

      {/* Primary Chat Box Widget Panel */}
      {isOpen && (
        <div
          className="glass-panel chat-widget-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            animation: 'scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)'
          }}
        >
          {/* Header Panel */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--bg-tertiary)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <Shirt size={18} color="var(--accent-orange)" />
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                margin: 0
              }}>
                HMS Stylist
              </h3>
            </div>

            {/* Simulated Active Cart summary */}
            {getCartCount() > 0 && (
              <div style={{ 
                background: 'rgba(79,70,229,0.06)', 
                border: '1px solid rgba(79,70,229,0.15)',
                borderRadius: '8px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginRight: '12px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--accent-orange)'
              }}>
                <ShoppingBag size={12} color="var(--accent-orange)" />
                <span>₹{getCartTotal()} ({getCartCount()})</span>
              </div>
            )}

            {/* Collapse Arrow */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--accent-orange)',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--bg-primary)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>

            {/* TAB: MESSAGES */}
            {activeTab === 'messages' && (
              <div className="animate-fade-slide-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {messages.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '16px',
                  padding: '20px'
                }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <Shirt size={32} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>HMS AI Stylist</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ask for premium hoodies, straight-fit selvedge jeans, or breathable tees</p>
                  </div>
                  <button 
                    onClick={() => startChat()}
                    className="btn-primary" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '260px', 
                      justifyContent: 'center',
                      background: 'var(--text-primary)',
                      color: '#ffffff',
                      border: 'none',
                      marginTop: '20px',
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '700'
                    }}
                  >
                    Consult AI Stylist
                    <ArrowRight size={16} color="#ffffff" style={{ marginLeft: '6px' }} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '90%',
                        animation: 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                      }}
                    >
                      {/* Message Bubble */}
                      <div style={{
                        background: msg.sender === 'user' 
                          ? 'var(--bg-tertiary)'
                          : 'var(--bg-secondary)',
                        border: msg.sender === 'user'
                          ? '1px solid rgba(79, 70, 229, 0.2)'
                          : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: msg.sender === 'user' 
                          ? '16px 16px 2px 16px' 
                          : '16px 16px 16px 2px',
                        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                        lineHeight: 1.4
                      }}>
                        <div className="message-markdown">
                          {formatText(msg.text)}
                        </div>
                      </div>

                      {/* HMS CLOTHING HORIZONTAL SLIDER REPRESENTATION */}
                      {msg.sender === 'agent' && msg.clothingItems && msg.clothingItems.length > 0 && (
                        <div className="horizontal-scroll">
                          {msg.clothingItems.map((item) => {
                            const isAdded = cart.some(c => c.item.id === item.id);
                            let badgeBg = 'rgba(79, 70, 229, 0.05)';
                            let badgeColor = 'var(--accent-orange)';
                            if (item.status === 'Limited Stock') {
                              badgeBg = 'rgba(244, 63, 94, 0.05)';
                              badgeColor = 'var(--accent-rose)';
                            } else if (item.status === 'In Demand') {
                              badgeBg = 'rgba(16, 185, 129, 0.05)';
                              badgeColor = 'var(--accent-emerald)';
                            }

                            return (
                              <div 
                                key={item.id}
                                style={{
                                  background: 'var(--bg-secondary)',
                                  border: '1.5px solid var(--glass-border)',
                                  borderRadius: '12px',
                                  padding: '12px',
                                  minWidth: '240px',
                                  maxWidth: '240px',
                                  flexShrink: 0,
                                  boxShadow: '0 6px 20px rgba(15,23,42,0.03)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                {/* SKU & Status */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent-orange)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                                    SKU: {item.id}
                                  </span>
                                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: badgeColor, background: badgeBg, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                    {item.status}
                                  </span>
                                </div>

                                {/* Title & Category */}
                                <div>
                                  <h4 style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                                    <Shirt size={12} color="var(--accent-orange)" />
                                    {item.name}
                                  </h4>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    🛍️ {item.category} • Thread & Co.
                                  </span>
                                </div>

                                {/* Sizing / Color */}
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'repeat(2, 1fr)', 
                                  gap: '4px',
                                  background: 'var(--bg-primary)',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  textAlign: 'center',
                                  fontWeight: 700
                                }}>
                                  <div>
                                    <span style={{ display: 'block', fontSize: '0.55rem', color: 'var(--text-muted)' }}>Size</span>
                                    <span style={{ color: 'var(--accent-orange)' }}>{item.size}</span>
                                  </div>
                                  <div>
                                    <span style={{ display: 'block', fontSize: '0.55rem', color: 'var(--text-muted)' }}>Color</span>
                                    <span>{item.color}</span>
                                  </div>
                                </div>

                                {/* Price */}
                                <div style={{ borderTop: '1px dashed rgba(15, 23, 42, 0.1)', paddingTop: '6px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 855, color: 'var(--accent-orange)' }}>
                                    ₹{item.price}
                                  </span>
                                </div>

                                {/* Add to Bag */}
                                <div style={{ marginTop: 'auto' }}>
                                  <button 
                                    onClick={() => {
                                      handleAddToCart(item);
                                      handleSend(`Add ${item.id} to my bag`);
                                    }}
                                    style={{
                                      width: '100%',
                                      background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-gold))',
                                      border: 'none',
                                      color: '#ffffff',
                                      fontWeight: 800,
                                      fontSize: '0.72rem',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px',
                                      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.15)'
                                    }}
                                  >
                                    <Plus size={12} color="#ffffff" />
                                    {isAdded ? 'Add Another' : 'Select & Add to Bag'}
                                  </button>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Time badge */}
                      <span style={{
                        display: 'block',
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                        textAlign: msg.sender === 'user' ? 'right' : 'left'
                      }}>
                        {msg.sender === 'user' ? 'You' : 'Advisor'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                      <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        padding: '10px 14px',
                        borderRadius: '16px 16px 16px 2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-orange)', animation: 'typing 1.4s infinite ease-in-out', animationDelay: '0s' }} />
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-gold)', animation: 'typing 1.4s infinite ease-in-out', animationDelay: '0.2s' }} />
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-emerald)', animation: 'typing 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
              </div>
            )}

            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <div className="animate-fade-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--accent-gold-glow)',
                    color: 'var(--accent-orange)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <Sparkles size={28} />
                  </div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Thread & Co. AI Stylist</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Consult our sizing grids, ask fits recommendations, and compile your secure bag checkout.
                  </p>
                </div>

                {/* Simulated Order Cart Panel if items added */}
                {cart.length > 0 && (
                  <div className="glass-panel" style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.02)' }}>
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShoppingBag size={13} />
                      Current Shopping Bag
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto', marginBottom: '10px' }}>
                      {cart.map(c => (
                        <div key={c.item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span>{c.item.name} (x{c.count})</span>
                          <span style={{ fontWeight: 700 }}>₹{c.item.price * c.count}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px dashed rgba(15, 23, 42, 0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Bag Subtotal:</span>
                      <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--accent-orange)' }}>₹{getCartTotal()}</span>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('messages'); handleSend("checkout"); }}
                      className="btn-primary"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.75rem', justifyContent: 'center', marginTop: '10px' }}
                    >
                      Checkout Securely via AI
                    </button>
                  </div>
                )}

                <div className="glass-panel" style={{ padding: '14px', background: 'var(--bg-secondary)' }}>
                  <h5 style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Quick Styling Inquiries
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => { setActiveTab('messages'); handleSend("Show me the latest hoodies"); }}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', textAlign: 'left', fontWeight: 700 }}
                    >
                      <span>🧥 Premium Combed Hoodies</span>
                      <ArrowRight size={12} color="var(--accent-orange)" />
                    </button>
                    <button 
                      onClick={() => { setActiveTab('messages'); handleSend("Do you have Straight-Fit Jeans?"); }}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', textAlign: 'left', fontWeight: 700 }}
                    >
                      <span>👖 Selvedge Straight-Fit Jeans</span>
                      <ArrowRight size={12} color="var(--accent-orange)" />
                    </button>
                    <button 
                      onClick={() => { setActiveTab('messages'); handleSend("Check sizing details for t-shirts"); }}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', textAlign: 'left', fontWeight: 700 }}
                    >
                      <span>👕 Lightweight Bamboo Crewneck Tees</span>
                      <ArrowRight size={12} color="var(--accent-orange)" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LISTINGS (Compact Catalog Browse) */}
            {activeTab === 'listings' && (
              <div className="animate-fade-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '8px' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                    <Shirt size={14} color="var(--accent-orange)" />
                    Thread & Co. Catalog
                  </h4>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Quick reference specifications of our classic apparel fits
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mockClothingItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="glass-panel" 
                      onClick={() => { setActiveTab('messages'); handleSend(`Tell me more about ${item.name}`); }}
                      style={{ 
                        padding: '12px', 
                        background: 'var(--bg-secondary)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        boxShadow: '0 2px 10px rgba(15,23,42,0.02)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                    >
                      <div>
                        <span style={{ fontWeight: 800, display: 'block', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                          {item.name} ({item.id})
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {item.category} • Size {item.size} • {item.color} • ⭐ {item.rating}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 850, color: 'var(--accent-orange)', display: 'block' }}>
                          ₹{item.price}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--accent-gold)' }}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: HELP (FAQs) */}
            {activeTab === 'help' && (
              <div className="animate-fade-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                  Atelier Sizing & Support Desk
                </h4>
                
                {[
                  {
                    q: "What is Thread & Co. AI Stylist?",
                    a: "It is our advanced boutique conversational advisor mapped to our active inventory system. It can recommend apparel outfits, answer fit and sizing details, and audit organic material lists in real time."
                  },
                  {
                    q: "How do I add clothing to my bag?",
                    a: "Type 'Add PR001' or 'order jeans' into the chatbot, or click 'Select & Add to Bag' directly on any horizontal card or catalog list. Your shopping bag total will instantly update at the top of the chat panel!"
                  },
                  {
                    q: "What items are currently in stock?",
                    a: "All three of our capsule catalog items are fully active: Black Organic Cotton Hoodie (₹1,499), Selvedge straight-fit Blue Jeans (₹1,999), and Soft Bamboo Crewneck White T-Shirt (₹799)."
                  },
                  {
                    q: "Are the fabrics organic and sustainable?",
                    a: "Absolutely! We strictly source combed organic cotton, vintage selvedge indigo denim, and breathable bamboo jersey to guarantee high durability, heat regulation, circularity, and cloud-like comfort."
                  }
                ].map((faqItem, index) => (
                  <div key={index} style={{ borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '8px' }}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: expandedFaq === index ? 'var(--accent-orange)' : 'var(--text-primary)',
                        width: '100%',
                        textAlign: 'left',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{faqItem.q}</span>
                      <span>{expandedFaq === index ? '−' : '+'}</span>
                    </button>
                    {expandedFaq === index && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '6px', paddingLeft: '4px', lineHeight: 1.45 }}>
                        {faqItem.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Chat Input Bar */}
          {activeTab === 'messages' && messages.length > 0 && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--bg-tertiary)',
              padding: '12px 16px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Ask AI Stylist details, or order an item..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  outline: 'none',
                  transition: 'var(--transition-smooth)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              />
              <button
                onClick={() => handleSend(inputVal)}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-gold))',
                  border: 'none',
                  borderRadius: '8px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                }}
              >
                <Send size={16} color="#ffffff" />
              </button>
            </div>
          )}

          {/* Footer Navigation Tab Bar */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--bg-tertiary)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0',
            fontSize: '0.72rem'
          }}>
            {/* Tab: HOME */}
            <button
              onClick={() => setActiveTab('home')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'home' ? 'var(--accent-orange)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
                fontWeight: activeTab === 'home' ? 800 : 500,
                transition: 'var(--transition-smooth)'
              }}
            >
              <Shirt size={16} style={{ transform: activeTab === 'home' ? 'translateY(-1px)' : 'none', transition: 'var(--transition-smooth)' }} />
              <span>Stylist</span>
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeTab === 'home' ? 'var(--accent-orange)' : 'transparent',
                marginTop: '1px',
                transition: 'var(--transition-smooth)'
              }} />
            </button>

            {/* Tab: MESSAGES */}
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'messages' ? 'var(--accent-orange)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
                fontWeight: activeTab === 'messages' ? 800 : 500,
                transition: 'var(--transition-smooth)'
              }}
            >
              <MessageSquare size={16} style={{ transform: activeTab === 'messages' ? 'translateY(-1px)' : 'none', transition: 'var(--transition-smooth)' }} />
              <span>Chat</span>
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeTab === 'messages' ? 'var(--accent-orange)' : 'transparent',
                marginTop: '1px',
                transition: 'var(--transition-smooth)'
              }} />
            </button>

            {/* Tab: LISTINGS */}
            <button
              onClick={() => setActiveTab('listings')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'listings' ? 'var(--accent-orange)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
                fontWeight: activeTab === 'listings' ? 800 : 500,
                transition: 'var(--transition-smooth)'
              }}
            >
              <Compass size={16} style={{ transform: activeTab === 'listings' ? 'translateY(-1px)' : 'none', transition: 'var(--transition-smooth)' }} />
              <span>Catalog</span>
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeTab === 'listings' ? 'var(--accent-orange)' : 'transparent',
                marginTop: '1px',
                transition: 'var(--transition-smooth)'
              }} />
            </button>

            {/* Tab: HELP */}
            <button
              onClick={() => setActiveTab('help')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'help' ? 'var(--accent-orange)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
                fontWeight: activeTab === 'help' ? 800 : 500,
                transition: 'var(--transition-smooth)'
              }}
            >
              <HelpCircle size={16} style={{ transform: activeTab === 'help' ? 'translateY(-1px)' : 'none', transition: 'var(--transition-smooth)' }} />
              <span>Help</span>
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeTab === 'help' ? 'var(--accent-orange)' : 'transparent',
                marginTop: '1px',
                transition: 'var(--transition-smooth)'
              }} />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
