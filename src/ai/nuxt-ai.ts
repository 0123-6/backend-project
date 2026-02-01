import app from "../app.js";
import {randomUUID} from "crypto";
import {sessionMap} from "../auth.js";
import {openai} from "./index.js";

interface IChat {
  question: string,
  answer?: string,
}
interface IHistory {
  conversationId: string,
  title: string,
}

// 保存用户历史联调记录
// key为用户account,大部分时候account等于user.phone
const chatHistoryMap = new Map<string, IHistory[]>()

// 会话上下文存储
// key 为 conversationId，value 为消息列表
interface IConversationMessage {
  role: 'user' | 'assistant',
  content: string,
}
const conversationMap = new Map<string, IConversationMessage[]>()

/**
 * 获取用户历史聊天记录,从chatHistoryMap
 * url: /ai/getHistoryByUser
 * method: post
 * request: undefined,// 用户信息从cookie获取
 * 正常response: {
 *   code: 200,
 *   msg: '操作成功',
 *   // 类型为IHistory[]
 *   data: [
 *     {
 *       id: '',一个uuidv4
 *       title: '',用户问的第一个问题
 *     },
 *   ],
 * }
 * 错误response: {
 *   code: 999,
 *   msg: '未登录' | '该用户不存在',
 * }
 */
app.post('/ai/getHistoryByUser', (req, res) => {
  const account = sessionMap.get(req.cookies.session)

  // 未登录
  if (!account) {
    res.json({
      code: 999,
      msg: '未登录',
    })
    return
  }

  // 获取用户历史记录，如果没有则返回空数组
  const historyList = chatHistoryMap.get(account) || []

  res.json({
    code: 200,
    msg: '操作成功',
    data: historyList,
  })
})

// 根据conversationId获取历史记录
app.post('/ai/getHistoryById', (req, res) => {
  const { conversationId } = req.body

  // 如果conversationId为空或不存在，返回无效会话
  if (!conversationId || !conversationMap.has(conversationId)) {
    res.json({
      code: 999,
      msg: '无效的会话',
      data: undefined,
    })
    return
  }

  // 获取对话历史并转换格式
  const messages = conversationMap.get(conversationId)!
  const list: IChat[] = []

  // 将user/assistant消息配对转换为question/answer格式
  for (let i = 0; i < messages.length; i += 2) {
    const userMsg = messages[i]
    const assistantMsg = messages[i + 1]
    if (userMsg && userMsg.role === 'user') {
      list.push({
        question: userMsg.content,
        answer: assistantMsg?.content || '',
      })
    }
  }

  res.json({
    code: 200,
    msg: '操作成功',
    data: {
      conversationId,
      list,
    },
  })
})

// 单次对话
app.post('/ai/chat', async (req, res) => {
  // 会话管理：有 conversationId 则复用，无则新建
  let conversationId: string
  if (req.body.conversationId && conversationMap.has(req.body.conversationId)) {
    conversationId = req.body.conversationId
  } else {
    conversationId = randomUUID()
    conversationMap.set(conversationId, [])
  }
  const conversationHistory = conversationMap.get(conversationId)!

  // 用户历史信息管理
  const account = sessionMap.get(req.cookies.session)
  // 已经登录用户
  if (account) {
    let chatHistoryList: IHistory[]
    if (!chatHistoryMap.has(account)) {
      chatHistoryMap.set(account, [])
    }
    chatHistoryList = chatHistoryMap.get(account)
    if (!chatHistoryList.find(item => item.conversationId === conversationId)) {
      chatHistoryList.push({
        conversationId,
        title: req.body.question,
      })
    }
  } else {
    // 未登录用户不用管
  }

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
        }
      })}\n\n`);
    }
  }
  // 4. 流式传输结束：推送最终完整数据
  const finalChatMsg: IChat = {
    question: req.body.question,
    answer: fullAnswer || '暂时无法为你提供有效回答',
  };

  // 保存当前对话到会话历史
  conversationHistory.push({ role: 'user', content: req.body.question })
  conversationHistory.push({ role: 'assistant', content: finalChatMsg.answer! })
  // 保持最多10条消息（5轮对话）
  while (conversationHistory.length > 10) {
    conversationHistory.shift()
  }

  // 5. 结束流式响应
  res.write(`data: [DONE]\n\n`); // 流式结束标识
  res.end();
})

/**
 * 将未登录时产生的会话id绑定到点击登录的用户上面
 * url: /ai/conversationIdToUser
 * method: post
 * request: {
 *   // 合法的情况是后端系统产生的uuidv4
 *   // 但需要考虑用户在url恶意拼接的不存在的uuidv4或其它恶意字符串
 *   conversationId: '',
 * }
 * 正常
 * response: {
 *   code: 200,
 *   msg: '操作成功',
 * },
 * 异常,返回一致,但内部要有容错处理,忽略异常参数
 * response: {
 *   code: 200,
 *   msg: '操作成功',
 * }
 */
app.post('/ai/conversationIdToUser', (req, res) => {
  const { conversationId } = req.body
  const account = sessionMap.get(req.cookies.session)

  // 容错处理：未登录、无conversationId、conversationId不存在，都静默返回成功
  if (account && conversationId && conversationMap.has(conversationId)) {
    // 初始化用户历史记录列表
    if (!chatHistoryMap.has(account)) {
      chatHistoryMap.set(account, [])
    }
    const chatHistoryList = chatHistoryMap.get(account)!

    // 避免重复绑定
    if (!chatHistoryList.find(item => item.conversationId === conversationId)) {
      // 获取会话第一条用户消息作为title
      const messages = conversationMap.get(conversationId)!
      const firstUserMsg = messages.find(msg => msg.role === 'user')
      const title = firstUserMsg?.content || '新对话'

      chatHistoryList.push({
        conversationId,
        title,
      })
    }
  }

  res.json({
    code: 200,
    msg: '操作成功',
  })
})

/**
 * 添加1个删除接口
 * url: /ai/deleteConversationId
 * method: post
 * request: {
 *   conversationId: '',
 * }
 * 正常
 * response: {
 *   code: 200,
 *   msg: '操作成功',
 * }
 * 错误
 * response: {
 *   code: 999,
 *   msg: '无效的会话id',// 此用户没有此id的会话记录
 * }
 */
app.post('/ai/deleteConversationId', (req, res) => {
  const { conversationId } = req.body
  const account = sessionMap.get(req.cookies.session)

  // 未登录或无account
  if (!account) {
    res.json({ code: 999, msg: '无效的会话id' })
    return
  }

  const chatHistoryList = chatHistoryMap.get(account)
  if (!chatHistoryList) {
    res.json({ code: 999, msg: '无效的会话id' })
    return
  }

  const index = chatHistoryList.findIndex(item => item.conversationId === conversationId)
  if (index === -1) {
    res.json({ code: 999, msg: '无效的会话id' })
    return
  }

  // 从用户历史中删除
  chatHistoryList.splice(index, 1)
  // 同时删除会话上下文
  conversationMap.delete(conversationId)

  res.json({ code: 200, msg: '操作成功' })
})

/**
 * 添加1个重命名接口
 * url: '/ai/renameConversationId',
 * method: 'post',
 * request: {
 *   conversationId: '',
 *   newTitle: ''
 * },
 * // 正常
 * response: {
 *   code: 200,
 *   msg: '重命名成功',
 * },
 * 异常
 * response: {
 *   code: 999,
 *   msg: '无效的会话id',// 此用户没有此id的会话记录
 * }
 */
app.post('/ai/renameConversationId', (req, res) => {
  const { conversationId, newTitle } = req.body
  const account = sessionMap.get(req.cookies.session)

  // 未登录或无account
  if (!account) {
    res.json({ code: 999, msg: '无效的会话id' })
    return
  }

  const chatHistoryList = chatHistoryMap.get(account)
  if (!chatHistoryList) {
    res.json({ code: 999, msg: '无效的会话id' })
    return
  }

  const item = chatHistoryList.find(item => item.conversationId === conversationId)
  if (!item) {
    res.json({ code: 999, msg: '无效的会话id' })
    return
  }

  item.title = newTitle
  res.json({ code: 200, msg: '重命名成功' })
})












































