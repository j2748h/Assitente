import React, { useState, useEffect, useRef } from "react";
import { PREDEFINED_BOOKS } from "./data/books";
import { Book, ChatMessage } from "./types";
import {
  BookOpen,
  Send,
  Sparkles,
  Layers,
  Award,
  AlertTriangle,
  User,
  RotateCcw,
  Plus,
  Compass,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Smile,
  Flame,
  ShieldCheck,
  Bookmark
} from "lucide-react";

// Image generated via generative tools
const YUKI_AVATAR = "/src/assets/images/yuki_avatar_1781904907939.jpg";

export default function App() {
  const [books, setBooks] = useState<Book[]>(PREDEFINED_BOOKS);
  const [selectedBook, setSelectedBook] = useState<Book>(PREDEFINED_BOOKS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Yuki's dynamic diagnostic status
  const [compatibilityScore, setCompatibilityScore] = useState(50);
  const [reasons, setReasons] = useState("Diga 'Oi' ou faça uma pergunta sobre o livro para eu analisar seu perfil! ✨");
  const [isIdeal, setIsIdeal] = useState<"sim" | "nao" | "talvez">("talvez");
  const [readyToAssess, setReadyToAssess] = useState(false);

  // Custom Book creation state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customChapters, setCustomChapters] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [customAntiTarget, setCustomAntiTarget] = useState("");

  // Yuki's mood modifier to make the app incredibly fun!
  const [yukiMood, setYukiMood] = useState<"fofa" | "sarcastica" | "conselheira">("fofa");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // On book change or mood change, wipe chat history or greet the user
  useEffect(() => {
    resetChat();
  }, [selectedBook, yukiMood]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetChat = () => {
    const greetingText = getGreetingText(selectedBook, yukiMood);
    setMessages([
      {
        id: "greet",
        sender: "yuki",
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        compatibilityScore: 50,
        reasons: "Ainda analisando sua energia inicial...",
        isIdeal: "talvez",
        readyToAssess: false
      }
    ]);
    setCompatibilityScore(50);
    setReasons("Vamos conversar para eu dar um veredito real! Pergunte o que quiser.");
    setIsIdeal("talvez");
    setReadyToAssess(false);
  };

  const getGreetingText = (book: Book, mood: string) => {
    let prefix = "Olá, Senpai!";
    if (mood === "sarcastica") prefix = "Ora, ora... olha quem apareceu.";
    if (mood === "conselheira") prefix = "Saudações, pesquisador de conhecimento.";

    return `${prefix} Eu sou a **Yuki**! ✨ 

Estou super empolgada para te guiar pelas páginas de **"${book.title}"** do autor *${book.author}*! 📖

Vou te contar todos os segredos desse e-book e, o mais importante: vou analisar o seu perfil com **100% de sinceridade espiritual** para dizer se ele é mesmo para você ou se você vai estar jogando seu dinheiro fora! 😰💸

Diga para mim: **qual é o seu nível atual de conhecimento sobre o assunto ou qual é o seu maior objetivo de vida no momento?** Ganbare! 🔥`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    // Add user message to UI
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Build mood modifier instructions
      let moodText = "";
      if (yukiMood === "sarcastica") {
        moodText = "Adote um tom levemente sarcástico, brincalhão, ironizando levemente preguiça ou excesso de facilidade, mas ainda sendo uma ajudante legal estilo Tsundere.";
      } else if (yukiMood === "conselheira") {
        moodText = "Adote um tom de mentora experiente, sábia, pragmática, analítica de negócios e focada em resultados reais, estilo mestre de anime.";
      } else {
        moodText = "Adote um tom clássico Genki Girl: extremamente alegre, energética, cheia de exclamações, carismática e fofa.";
      }

      // API request to server-side Gemini Proxy with selected book, user message and history
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${userText} (Nota sobre a Yuki: ${moodText})`,
          history: updatedMessages.slice(-8).map(m => ({ sender: m.sender, text: m.text })),
          selectedBook: selectedBook
        })
      });

      if (!response.ok) {
        throw new Error("Erro na comunicação com a Yuki.");
      }

      const data = await response.json();

      // Add Yuki response
      const yukiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "yuki",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        compatibilityScore: data.compatibilityScore,
        reasons: data.reasons,
        isIdeal: data.isIdeal,
        readyToAssess: data.readyToAssess
      };

      setMessages(prev => [...prev, yukiMsg]);

      // Update Yuki's diagnosis states
      if (data.compatibilityScore !== undefined) setCompatibilityScore(data.compatibilityScore);
      if (data.reasons) setReasons(data.reasons);
      if (data.isIdeal) setIsIdeal(data.isIdeal);
      if (data.readyToAssess !== undefined) setReadyToAssess(data.readyToAssess);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "yuki",
          text: "Nani?! Algo bloqueou minha transmissão mental! 😰 Por favor, pergunte novamente, senpai! (Lembre-se de verificar se sua chave de API do Gemini nos Secrets está válida!) 🌸",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customDescription) {
      alert("Por favor, preencha pelo menos o título e uma breve descrição do e-book.");
      return;
    }

    const newBook: Book = {
      id: "custom-" + Date.now(),
      title: customTitle,
      author: customAuthor || "Autor Independente",
      description: customDescription,
      chapters: customChapters || "Sem capítulos detalhados fornecidos.",
      purpose: customPurpose || "Sem objetivo principal detalhado fornecido.",
      targetAudience: customTarget || "Qualquer interessado no assunto.",
      antiAudience: customAntiTarget || "Pessoas sem interesse em aprender ou aplicar o tema.",
      vibeColor: "rose",
      vibeBadge: "Autoral ✨",
      coverEmoji: "💖"
    };

    setBooks([newBook, ...books]);
    setSelectedBook(newBook);
    setIsCreatingCustom(false);

    // Clear form
    setCustomTitle("");
    setCustomAuthor("");
    setCustomDescription("");
    setCustomChapters("");
    setCustomPurpose("");
    setCustomTarget("");
    setCustomAntiTarget("");
  };

  // Safe markdown text formatter helper for custom dialogue bubbles
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Splits paragraphs by newlines
    const paragraphs = text.split("\n");

    return paragraphs.map((para, i) => {
      if (para.trim() === "") return <div key={i} className="h-2" />;

      let formattedLine = para;
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;

      // regex for **bold**
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = boldRegex.exec(para)) !== null) {
        // Push text preceding the match
        if (match.index > lastIndex) {
          elements.push(para.substring(lastIndex, match.index));
        }
        // Push bold element
        elements.push(
          <strong key={match.index} className="font-extrabold text-blue-300 drop-shadow-sm">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < para.length) {
        elements.push(para.substring(lastIndex));
      }

      const isBullet = para.trim().startsWith("-") || para.trim().startsWith("*");
      if (isBullet) {
        const cleanText = para.replace(/^[-*]\s*/, "");
        return (
          <li key={i} className="ml-4 list-disc text-slate-200 mt-1 pl-1 leading-relaxed">
            {elements.length > 0 ? elements : cleanText}
          </li>
        );
      }

      return (
        <p key={i} className="text-slate-100 leading-relaxed text-[15px] mb-2">
          {elements.length > 0 ? elements : para}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f111a] text-slate-100 overflow-hidden" id="app_root">
      {/* Dynamic Background Effect */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1b1c30]/40 to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-[#252a46] bg-[#0c0d16]/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40" id="main_header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-purple-300 via-pink-300 to-blue-200 bg-clip-text text-transparent">
              Yuki - Ajudante de E-Books & Bot 100% Sincero
            </h1>
            <p className="text-xs text-slate-400">Analista virtual e conselheira brutalmente sincera para leitores</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mood Switches */}
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Modo Yuki:</span>
          <div className="bg-[#151726] border border-[#2d3356] rounded-xl p-0.5 flex gap-1 text-xs">
            <button
              onClick={() => setYukiMood("fofa")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                yukiMood === "fofa"
                  ? "bg-gradient-to-r from-pink-500/80 to-purple-500/80 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Super alegre, fofa e cheia de emotes sugoi!"
            >
              Fofa 🌸
            </button>
            <button
              onClick={() => setYukiMood("sarcastica")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                yukiMood === "sarcastica"
                  ? "bg-gradient-to-r from-amber-600/80 to-pink-600/80 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Irônica, Tsundere e muito divertida!"
            >
              Sarcástica 😏
            </button>
            <button
              onClick={() => setYukiMood("conselheira")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                yukiMood === "conselheira"
                  ? "bg-gradient-to-r from-emerald-600/80 to-blue-600/80 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Sábia, direta, executiva e altamente cirúrgica."
            >
              Conselheira 🧠
            </button>
          </div>

          <button
            onClick={() => setIsCreatingCustom(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg hover:shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar E-book
          </button>

          <button
            onClick={resetChat}
            className="p-2 text-slate-400 hover:text-white bg-[#151726] border border-[#2d3356] rounded-xl hover:bg-[#1a1c30] transition-colors"
            title="Resetar papo do zero"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main App Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden max-h-[calc(100vh-80px)]">

        {/* Create Custom E-book Modal/Overlay overlaying the left column */}
        {isCreatingCustom && (
          <div className="fixed inset-0 bg-[#07080f]/90 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#141624] border border-[#2e345b] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
              <button
                onClick={() => setIsCreatingCustom(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-lg font-bold font-display mb-2 text-purple-300 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" /> Cadastrar Seu E-Book Customizado
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Digite os dados do seu e-book para que Yuki se adapte e comece a explicá-lo cientificamente para os leitores simulados ou reais.
              </p>

              <form onSubmit={handleCreateCustomBook} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Título do E-book *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Do Medo ao Palco: Oratória de Elite"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-[#0a0b12] border border-[#2b2f4c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Autor do E-book</label>
                    <input
                      type="text"
                      placeholder="Ex: Yuki Palcos"
                      value={customAuthor}
                      onChange={(e) => setCustomAuthor(e.target.value)}
                      className="w-full bg-[#0a0b12] border border-[#2b2f4c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição Curta (Promessa Principal) *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ex: Como vencer a fobia de falar em público e dar palestras inesquecíveis mesmo sendo introvertido."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full bg-[#0a0b12] border border-[#2b2f4c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">O que tem Dentro (Capítulos importantes)</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Capítulo 1: O segredo da respiração de diafragma; Capítulo 2: Roteirizando palestras magnéticas; Capítulo 3: Como dominar o medo do julgamento alheio."
                    value={customChapters}
                    onChange={(e) => setCustomChapters(e.target.value)}
                    className="w-full bg-[#0a0b12] border border-[#2b2f4c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Para que serve ? (Benefício prático principal)</label>
                  <input
                    type="text"
                    placeholder="Ex: Perder a timidez, conseguir aprovação em bancas de mestrado e falar com segurança em reuniões de negócios."
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    className="w-full bg-[#0a0b12] border border-[#2b2f4c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Público Alvo Perfeito</label>
                    <input
                      type="text"
                      placeholder="Ex: Tímidos, gerentes, palestrantes novatos"
                      value={customTarget}
                      onChange={(e) => setCustomTarget(e.target.value)}
                      className="w-full bg-[#0a0b12] border border-[#2b2f4c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Para quem NÃO serve (Humor Sincero)</label>
                    <input
                      type="text"
                      placeholder="Ex: Gente com preguiça de subir no palco ou extrovertidos absolutos."
                      value={customAntiTarget}
                      onChange={(e) => setCustomAntiTarget(e.target.value)}
                      className="w-full bg-[#0a0b12] border border-[#2b2f4c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="bg-transparent hover:bg-slate-800 text-slate-300 text-xs px-4 py-2 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
                  >
                    Salvar & Usar com Yuki ⭐
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LEFT COLUMN: Book Picker & Yuki's Real-time Honest Assessment Board (lg:col-span-5) */}
        <section className="lg:col-span-5 flex flex-col gap-5 overflow-y-auto pr-1" id="left_panel">
          
          {/* Section: Selected Book Card */}
          <div className="bg-[#121422] border border-[#232948] rounded-2xl p-5 shadow-xl relative overflow-hidden" id="book_card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-3">
              <span className="bg-[#1c223d] text-purple-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-purple-400" /> {selectedBook.vibeBadge}
              </span>
              <span className="text-3xl filter drop-shadow">{selectedBook.coverEmoji}</span>
            </div>

            <h2 className="text-lg font-bold font-display text-white line-clamp-1 mb-1">
              {selectedBook.title}
            </h2>
            <p className="text-xs text-slate-400 mb-3">Escrito por: <span className="text-slate-300 font-semibold">{selectedBook.author}</span></p>
            
            <div className="bg-[#0b0c14]/60 rounded-xl p-3 border border-[#1e223a] text-xs space-y-2 mb-4">
              <p className="text-slate-300 leading-relaxed italic">
                "{selectedBook.description}"
              </p>
            </div>

            {/* Quick expandable specification tabs */}
            <div className="space-y-3 text-xs border-t border-[#1e2441] pt-4">
              <div>
                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> O que tem dentro:
                </span>
                <p className="text-slate-300 bg-[#16192d]/40 p-2.5 rounded-xl border border-[#202544] leading-relaxed">
                  {selectedBook.chapters}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Para que serve?
                </span>
                <p className="text-slate-300 bg-[#16192d]/40 p-2.5 rounded-xl border border-[#202544] leading-relaxed border-l-2 border-l-emerald-500">
                  {selectedBook.purpose}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="bg-[#122320]/60 p-2.5 rounded-xl border border-emerald-500/20 text-slate-300">
                  <span className="text-emerald-400 font-bold block text-[10px] uppercase mb-0.5">Público Recomendado:</span>
                  <p className="text-[11px] leading-snug line-clamp-2">{selectedBook.targetAudience}</p>
                </div>
                <div className="bg-[#241315]/60 p-2.5 rounded-xl border border-rose-500/20 text-slate-300">
                  <span className="text-rose-400 font-bold block text-[10px] uppercase mb-0.5">Não Compre Se:</span>
                  <p className="text-[11px] leading-snug line-clamp-2">{selectedBook.antiAudience}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Sincerity Diagnosis Meter & Assessment Board */}
          <div className="bg-[#121422] border border-[#232948] rounded-2xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden" id="sincerity_board">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-pink-400" /> Diagnóstico de Sinceridade Yuki
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Yuki Brain v3</span>
            </div>

            {/* Gauge */}
            <div className="bg-[#0b0c14] border border-[#1d2138] rounded-xl p-4 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-400 font-medium">Compatibilidade Real:</span>
                <span className="text-lg font-bold font-mono text-purple-300">{compatibilityScore}%</span>
              </div>

              {/* Progress bar background */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden relative border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${compatibilityScore}%` }}
                />
              </div>

              {/* Status Labels underneath bar */}
              <div className="w-full flex justify-between text-[10px] text-slate-500 font-bold mt-1.5 uppercase">
                <span>0% Furada de Dinheiro</span>
                <span>50% Talvez</span>
                <span>100% Casamento Perfeito</span>
              </div>
            </div>

            {/* Verdict Box */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Veredito da Yuki:</span>
                {isIdeal === "sim" && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                    <CheckCircle className="w-3.5 h-3.5" /> TOTALMENTE PARA VOCÊ! 🎉
                  </span>
                )}
                {isIdeal === "nao" && (
                  <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> NÃO COMPRE! DESPERDÍCIO 🚫
                  </span>
                )}
                {isIdeal === "talvez" && (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> ANALISANDO AINDA... 🤔
                  </span>
                )}
              </div>

              {/* Sincere Reasons Text */}
              <div className="bg-[#1a1c2d]/70 rounded-xl p-3.5 border border-[#2c3358] text-xs">
                <span className="text-[10px] font-extrabold text-pink-400 block mb-1 uppercase tracking-wider">Yuki fala 100% com o coração:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{reasons}</p>
              </div>
            </div>

            {/* Diagnostics checklist */}
            <div className="border-t border-[#1e2441] pt-3.5 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Grau de Maturidade do Veredito:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${readyToAssess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "border-slate-600 text-slate-600"}`}>
                    ✓
                  </div>
                  <span>Yuki conhece seus objetivos</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${messages.length > 2 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "border-slate-600 text-slate-600"}`}>
                    ✓
                  </div>
                  <span>Diálogo substancial (&gt;2 mensagens)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal italic mt-1">
                *Quanto mais você conversar com Yuki contando o que você espera, no que trabalha e suas dificuldades, mais assertivo e honesto será o veredito dela!
              </p>
            </div>
          </div>

          {/* Book Library switching station */}
          <div className="bg-[#121422] border border-[#232948] rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider mb-3">Escolha Outro E-Book para Investigar:</h4>
            <div className="grid grid-cols-1 gap-2">
              {books.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBook(b)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                    selectedBook.id === b.id
                      ? "bg-[#1f233f] border-purple-500/60 shadow"
                      : "bg-[#0c0d16]/75 border-slate-800 hover:border-slate-700 hover:bg-[#111322]"
                  }`}
                >
                  <span className="text-2xl filter drop-shadow group-hover:scale-110 transition">{b.coverEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-400 block tracking-wide">{b.vibeBadge}</span>
                    <h5 className="text-xs font-bold text-slate-200 line-clamp-1">{b.title}</h5>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Interactive Chat Console with Yuki (lg:col-span-7) */}
        <section className="lg:col-span-7 bg-[#121422] border border-[#232948] rounded-2xl flex flex-col overflow-hidden shadow-xl" id="chat_panel">
          
          {/* Chat Header inside console with Yuki avatar */}
          <div className="bg-[#0c0d16]/90 p-4 border-b border-[#212643] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={YUKI_AVATAR}
                  alt="Yuki Avatar"
                  onError={(e) => {
                    // Fallback reference if rendering fails
                    e.currentTarget.src = "https://picsum.photos/seed/yuki_anime/150/150";
                  }}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400/80 shadow-md pulsate-avatar"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0c0d16] flex items-center justify-center animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base font-display">Yuki-chan</h3>
                  <span className="bg-pink-500/10 text-pink-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">BOT DE ELITE ✨</span>
                </div>
                <p className="text-xs text-emerald-400 animate-pulse flex items-center gap-1.5 font-mono">
                  {loading ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Analisando seu perfil de Senpai... 🌸
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online e 100% Sincera
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick stats on top right of chat */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">LIVRO EM DISCUSSÃO</span>
              <p className="text-xs font-semibold text-truncate max-w-[200px] text-purple-300 truncate">
                {selectedBook.title}
              </p>
            </div>
          </div>

          {/* Message Thread container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0b12]" style={{ minHeight: "250px" }} id="messages_scroller">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar indicator */}
                {msg.sender === "yuki" ? (
                  <img
                    src={YUKI_AVATAR}
                    alt="Yuki"
                    onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/seed/yuki_anime/150/150";
                    }}
                    className="w-8 h-8 rounded-full object-cover border border-purple-400/30 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}

                {/* Speech Bubble body */}
                <div className="flex flex-col">
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none px-4 py-2.5 font-sans"
                        : "bg-[#151726] border border-[#2b304f] rounded-tl-none font-sans"
                    }`}
                  >
                    {/* Display sender and timestamp */}
                    <div className="flex items-center gap-1.5 mb-1 justify-between">
                      <span className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-widest">
                        {msg.sender === "user" ? "Você (Senpai)" : "Yuki"}
                      </span>
                      <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                    </div>

                    {/* Formatted body text supporting regex bold replacements */}
                    <div className="text-sm font-sans whitespace-pre-wrap break-words">
                      {msg.sender === "user" ? msg.text : renderFormattedText(msg.text)}
                    </div>
                  </div>

                  {/* Sincerity badge indicator only for Yuki answers featuring them */}
                  {msg.sender === "yuki" && msg.compatibilityScore !== undefined && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-slate-400 font-medium">Compatibilidade parcial:</span>
                      <strong className="text-[10px] text-purple-300 font-mono">{msg.compatibilityScore}%</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Anime style loading loader while yuki thinking */}
            {loading && (
              <div className="flex gap-3 justify-start max-w-[85%] animate-pulse">
                <img
                  src={YUKI_AVATAR}
                  alt="Yuki Thinking"
                  className="w-8 h-8 rounded-full object-cover border border-[#44265a] self-end"
                />
                <div className="flex flex-col">
                  <div className="bg-[#151726] border border-[#2d314f] rounded-2xl p-4 rounded-tl-none flex items-center gap-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-slate-400 font-semibold font-mono">Yuki está escrevendo seu diagnóstico sincero... 🌸</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Footer console keyboard inputs */}
          <form onSubmit={handleSendMessage} className="p-3.5 bg-[#0c0d16] border-t border-[#212543] flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              placeholder={`Escreva sua pergunta ou descreva sua rotina/gostos para Yuki...`}
              className="flex-1 bg-[#121422] border border-[#292f56] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl px-5 flex items-center justify-center transition-all shadow shadow-indigo-500/10 disabled:opacity-50"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </section>

      </main>

      {/* Outer subtle system details footer to maintain cleanliness without clutter */}
      <footer className="py-3 px-6 border-t border-[#131526] bg-[#07080f] text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2" id="credit_footer">
        <div>
          <span>Yuki - Ajudante de E-Books &copy; 2026. Feito com amor de Anime e Inteligência Real.</span>
        </div>
        <div className="flex gap-4">
          <span>*Responda as perguntas com honestidade para obter 100% de precisão.</span>
        </div>
      </footer>
    </div>
  );
}
