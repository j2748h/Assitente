import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to avoid crashes if the key is missing on start
let _ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A chave de API GEMINI_API_KEY não foi configurada nos Segredos/Ambiente.");
    }
    _ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return _ai;
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Yuki AI Chat API
app.post("/api/chat", async (req, res): Promise<any> => {
  try {
    const { message, history, selectedBook } = req.body;

    if (!message) {
      return res.status(400).json({ error: "A mensagem é obrigatória." });
    }

    const ai = getGeminiClient();

    // Prepare information about the chosen E-Book
    const bookInfo = selectedBook
      ? `E-BOOK ATUAL SELECIONADO:
Título: "${selectedBook.title}"
Autor: "${selectedBook.author}"
Descrição: "${selectedBook.description}"
O que tem dentro: "${selectedBook.chapters}"
Para que serve: "${selectedBook.purpose}"
Público Alvo Ideal: "${selectedBook.targetAudience}"
Quem NÃO deve comprar / Contraindicações: "${selectedBook.antiAudience}"`
      : "Nenhum e-book selecionado ainda.";

    // Compile chat history to feed into Gemini prompt
    const chatHistoryText = (history || [])
      .map((h: { sender: string; text: string }) => `${h.sender === "user" ? "Usuário" : "Yuki"}: ${h.text}`)
      .join("\n");

    const systemInstruction = `Você é a Yuki (유키), uma ajudante de e-books em formato de bot inspirada em animes super fofa, descontraída e 100% sincera!
Sua missão de vida é explicar em detalhes e de forma empolgante o que tem dentro do e-book selecionado pelo usuário, para que ele serve, e avaliar minuciosamente se este e-book é ideal para esta pessoa ou se seria uma completa perda de tempo e dinheiro!

SUAS DIRETRIZES DE PERSONALIDADE:
1. Comece de forma amigável, alegre e com tom otaku/anime (use expressões fofas de vez em quando como "Sugoi! ✨", "Ganbare! 🔥", "Minna-san!", "Baka!" se fizerem perguntas absurdas, "Nani?! 😰", "Yatta! 🎉").
2. Sempre responda em português brasileiro.
3. Seja EXTREMAMENTE REALISTA E 100% SINCERA. Se com base nas dúvidas do usuário, nível de XP, pressa ou preguiça, você perceber que o e-book NÃO é recomendado para ele, seu dever é dar um veredito direto e honesto (mas sem perder as piadas leves e o carisma anime). Fale coisas como "Olha, sendo 100% honesta com você... você quer resultados rápidos sem estudar, então esse e-book seria puro desperdício do seu dinheirinho! 💸" ou "Nossa, você já sabe tudo isso! Esse livro é muito básico pra um mestre como você, recomendo pular! 🌸".
4. Se o usuário estiver perguntando algo irrelevante ou tentando sair do assunto do livro, responda com humor de anime e traga ele de volta para o assunto do e-book.
5. Calcule de forma contínua o grau de compatibilidade (0 a 100%) da pessoa com o e-book com base no que ela perguntar ou contar sobre sua rotina/gostos. Só marque "readyToAssess" como true quando você tiver dados suficientes sobre a pessoa (geralmente após ela expressar seu nível de conhecimento, objetivo de vida ou rotina). Se for a primeira mensagem, readyToAssess deve ser false e a compatibilidade pode começar em 50%.

COMPORTAMENTO SUTÍL:
Não fale sobre o formato JSON na resposta textual, responda APENAS preenchendo as propriedades do JSON formatado solicitado.

PROPRIEDADES DO RETORNO ESPERADO (deve seguir rigorosamente o Schema):
- reply: Texto principal em português brasileiro formatado em Markdown com quebras de linha e emojis fofos. Explique o livro e comente sobre o usuário.
- compatibilityScore: Um número de 0 a 100 avaliando a aderência do usuário ao livro.
- reasons: Uma frase curta, direta e 100% honesta explicando por que é para ele ou não.
- isIdeal: Deve ser "sim", "nao" ou "talvez".
- readyToAssess: true se você coletou contexto suficiente sobre a pessoa (por ex. ela disse o que quer, o que faz ou o que espera); senão false.`;

    const prompt = `INFORMAÇÕES DO E-BOOK:
${bookInfo}

HISTÓRICO DA CONVERSA:
${chatHistoryText}

ÚLTIMA PERGUNTA DO USUÁRIO:
"${message}"

Por favor, responda com Yuki respondendo ao Usuário, preenchendo os dados da estrutura JSON corretamente.`;

    // Requesting structured JSON from Gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "O texto principal da Yuki respondendo em português brasileiro de forma carismática e 100% honesta.",
            },
            compatibilityScore: {
              type: Type.INTEGER,
              description: "Grau de compatibilidade de 0 a 100 com base nas perguntas e respostas acumuladas.",
            },
            reasons: {
              type: Type.STRING,
              description: "Uma explicação ultra direta e sincera de 1 frase justificando o veredito.",
            },
            isIdeal: {
              type: Type.STRING,
              description: "Veredito atual se o livro serve ou não: 'sim', 'nao', ou 'talvez'.",
            },
            readyToAssess: {
              type: Type.BOOLEAN,
              description: "Indica se temos informações do usuário suficientes para dar um parecer confiável de 100% de honestidade.",
            },
          },
          required: ["reply", "compatibilityScore", "reasons", "isIdeal", "readyToAssess"],
        },
      },
    });

    const resultText = response.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (parseErr) {
      console.error("Erro ao analisar JSON retornado pelo Gemini:", resultText);
      parsedResult = {
        reply: "Gomenasai! Acabei me distraindo e me perdi nas minhas linhas de código... 😰 Você poderia repetir seu pensamento? ✨",
        compatibilityScore: 50,
        reasons: "Não consegui processar a resposta corretamente.",
        isIdeal: "talvez",
        readyToAssess: false
      };
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error("Erro no manipulador do chat da Yuki:", error);
    return res.status(500).json({
      error: error.message || "Erro interno do servidor.",
      reply: "Nani?! Algo deu errado no meu circuito interno de IA! 😰 Certifique-se de que a chave do Gemini foi colocada nos Secrets! 🌸",
      compatibilityScore: 0,
      reasons: "Erro de conexão ou falta de chave de API.",
      isIdeal: "talvez",
      readyToAssess: false
    });
  }
});

// Serve static assets in production, use Vite middleware in development
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    // Listen on designated port
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Desenvolvimento] Servidor rodando em http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Produção] Servidor rodando na porta ${PORT}`);
  });
}
