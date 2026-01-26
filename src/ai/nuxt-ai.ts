import app from "../app.js";
import {randomUUID} from "crypto";
import {sessionMap} from "../auth.js";
import {openai} from "./index.js";

interface IChat {
  question: string,
  answer?: string,
}
interface IHistory {
  id: string,
  name: string,
  list: IChat[],
}

// 保存用户历史联调记录
// key为用户key或单次uuid
const chatHistoryMap = new Map<string, IHistory[]>()

// 会话上下文存储
// key 为 conversationId，value 为消息列表
interface IConversationMessage {
  role: 'user' | 'assistant',
  content: string,
}
const conversationMap = new Map<string, IConversationMessage[]>()

// 获取用户历史聊天记录
app.post('/ai/history', (req, res) => {

})

// 单次对话
app.post('/ai/chat', async (req, res) => {
  const account = sessionMap.get(req.cookies.session)
  // 已经登录用户
  if (account) {

  } else {
    // 未登录用户
  }

  // 会话管理：有 conversationId 则复用，无则新建
  let conversationId: string
  if (req.body.conversationId && conversationMap.has(req.body.conversationId)) {
    conversationId = req.body.conversationId
  } else {
    conversationId = randomUUID()
    conversationMap.set(conversationId, [])
  }
  const conversationHistory = conversationMap.get(conversationId)!

  // 1. 配置流式响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // 立即发送响应头
  // 2. 调用通义千问 API（流式）
  let fullAnswer = ''; // 存储完整回答，用于后续保存历史
  const stream = await openai.chat.completions.create({
    model: "qwen-plus-2025-12-01", // 通义千问模型
    messages: [
      ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: req.body.question }
    ],
    stream: true,
    temperature: 0.7,
  });
  // 3. 处理流式数据
  for await (const chunk of stream) {
    // 提取通义千问的流式内容（不同 SDK 可能返回格式略有差异，此处适配官方 OpenAI 兼容 SDK）
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      const content = delta.content;
      fullAnswer += content;

      // 向客户端推送流式数据（SSE 格式）
      res.write(`data: ${JSON.stringify({
        code: 200,
        msg: 'streaming',
        data: {
          conversationId,
          partialAnswer: content, // 分片回答
          fullAnswer: '' // 流式过程中不返回完整回答，结束后返回
        }
      })}\n\n`);
    }
  }
  // 4. 流式传输结束：推送最终完整数据
  const finalChatMsg: IChat = {
    question: req.body.question,
    answer: fullAnswer || '暂时无法为你提供有效回答',
    // createTime: Date.now()
  };

  // 保存聊天历史（无论登录/未登录，均关联用户唯一标识）
  // updateChatHistory(userKey, currentSessionId, finalChatMsg);

  // 保存当前对话到会话历史
  conversationHistory.push({ role: 'user', content: req.body.question })
  conversationHistory.push({ role: 'assistant', content: finalChatMsg.answer! })
  // 保持最多10条消息（5轮对话）
  while (conversationHistory.length > 10) {
    conversationHistory.shift()
  }

  // 推送最终响应
  res.write(`data: ${JSON.stringify({
    code: 200,
    msg: 'success',
    data: {
      conversationId,
      answer: finalChatMsg.answer,
    }
  })}\n\n`);

  // 5. 结束流式响应
  res.write(`data: [DONE]\n\n`); // 流式结束标识
  res.end();
})