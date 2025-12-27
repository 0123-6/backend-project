import OpenAI from "openai";
import fs from 'fs'
import crypto from 'crypto';
import { xml2js } from 'xml-js';
import bodyParser from 'body-parser';
import app from "../app.js";

// 你的 Token，要和微信后台设置的一致
const WECHAT_TOKEN = 'hanpeijiang';
// 微信开发者ID: wx956e6a8ee19a5e21
// 微信开发者AppSecret: e88bd9d18c748244ce020730e735b5f1

// const openai = new OpenAI({
// 	baseURL: 'https://api.deepseek.com',
// 	apiKey: 'sk-5f236b7a4ca34a26b32be510b563ef81',
// });
export const openai = new OpenAI({
	baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
	apiKey: 'sk-51ab39c0773e4be093a2da33be6365cf',
});

const systemContent = '你是微信公众号「会说话AI」的语言润色助手。' +
	'用户发来的一句话，通常是想表达给他人听的内容，希望你帮他优化成更温柔、更体面、更有分寸、更自然的人类表达。' +
	'请你不要分析或安慰用户，不需要与用户对话，也不需要解释原因，只需直接输出优化后的表达版本。' +
	'不要接话，不要进行对话，只返回优化后的版本。' +
	'要尽量像普通人一样说话，不要出现“亲爱的”“我理解你”等 AI 语气。' +
	'如果用户说“换一种说法”，那就基于你刚才的优化结果，再换一种风格说法，' +
	'依然要符合“自然、温和、有分寸”的要求。请同时输出以下三种风格的表达，每种不超过100字：' +
	'1. 温柔版：语气柔和、克制，适合表达关心或请求；' +
	'2. 幽默版：轻松带趣，语气自然不过分夸张；' +
	'3. 正式版：表达得体、语义清晰，适合职场或正式场合；' +
	'如果用户明确提出希望使用某种风格（如温柔、幽默、正式等），请按要求生成对应版本.'

// 微信服务器验证 (GET)
app.get('/chat', (req, res) => {
	const { signature, timestamp, nonce, echostr } = req.query;

	const str = [WECHAT_TOKEN, timestamp, nonce].sort().join('');
	const sha1 = crypto.createHash('sha1').update(str).digest('hex');

	if (sha1 === signature) {
		res.send(echostr); // 验证成功
	} else {
		console.log('sss')
		res.status(401).send('验证失败');
	}
});

// 解析微信 XML 数据
app.use('/chat', bodyParser.text({ type: 'text/xml' }));

interface IUserContext {
	role: 'system' | 'user' | 'assistant',
	content: string,
	// 时间戳,用于过时操作
	timestamp: number,
}

// 保存用户记录
const userContextMap = new Map<string, Array<IUserContext>>()
// 最大保存上下文长度
const maxHistroyLength = 5
// 用户记录最长生命周期
const maxSaveTime = 1000 * 60 * 10

// 定时任务,清除过期用户记录,防止内存溢出
// setInterval(() => {
// 	for (let [user, userContextList] of userContextMap) {
//
// 	}
// }, 1000 * 60)

// 接收用户消息 (POST)
// @ts-ignore
app.post('/chat', async (req, res) => {
	try {
		const xml = req.body;
		const json = xml2js(xml, { compact: true }) as { xml: any };

		// 用户ID
		const fromUser = json.xml.FromUserName._cdata;
		const toUser = json.xml.ToUserName._cdata;
		const msgType = json.xml.MsgType._cdata;

		// 处理关注事件
		if (msgType === 'event') {
			const event = json.xml.Event._cdata;
			if (event === 'subscribe') {
				const reply = "欢迎关注「会说话AI」🎤\n发我任何一句你想说的话，我帮你变得更高情商、更温柔或更有说服力！";
				const replyXml = `
<xml>
  <ToUserName><![CDATA[${fromUser}]]></ToUserName>
  <FromUserName><![CDATA[${toUser}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${reply}]]></Content>
</xml>`;
				return res.type('application/xml').send(replyXml);
			}
			// 其他事件
			return res.send('success');
		}

		// 普通文本消息处理
		const content = (json.xml.Content?._cdata || '').slice(0, 100); // 限制字数
		console.log(`📥 收到用户消息：${content}`);

		// 设置超时时间
		const TIMEOUT_MS = 4500;

		let reply = "有点忙不过来了，请稍后再试试~"; // 兜底回复

		try {
			const stream = await openai.chat.completions.create({
				// model: "deepseek-chat",
				model: "qwen-turbo-latest",
				messages: [
					{ role: "system", content: systemContent, },
					{ role: "user", content },
				],
				stream: true,
				temperature: 0.7,
				max_completion_tokens: 150, // 输出少一点更快
			});

			let collected = "";
			const start = Date.now();

			const streamPromise = (async () => {
				for await (const part of stream) {
					const chunk = part.choices[0].delta?.content || "";
					console.log("🔹 chunk:", chunk.length, JSON.stringify(chunk));
					collected += chunk;
					if (Date.now() - start > TIMEOUT_MS) {
						console.log('⏰ 超时退出流式读取');
						break;

					}
				}
			})();

			const timeoutPromise = new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));

			await Promise.race([streamPromise, timeoutPromise]);

			// reply = collected.trim() + "\n\n【内容较多，回复已截断】";
			reply = collected.trim();

		} catch (e) {
			console.error("❌ 请求失败或超时：", e.message || e);
		}
		// 构造 XML 回复
		const replyXml = `
<xml>
  <ToUserName><![CDATA[${fromUser}]]></ToUserName>
  <FromUserName><![CDATA[${toUser}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${reply}]]></Content>
</xml>`;

		res.type('application/xml').send(replyXml);
	} catch (error) {
		console.error('❌ 微信接口错误：', error);
		fs.appendFileSync('error.log', `[${new Date().toISOString()}] 错误：${error.message || error}\n`);
		res.send('success'); // 避免重试
	}
});