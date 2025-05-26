import puppeteer from 'puppeteer'
import cron from 'node-cron'
import FormData from 'form-data'
import fetch from 'node-fetch'
import {logToFile} from "./util/log.js";
import {createFolder} from "./util/file.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// session可能过期,需要配置一个最新session
const sessionValue = 'ZGVhMDFiMDQtZDEyNy00MTMzLTk5ZTEtMWIwZDQ1NDAxNWZm'
const hostname = 'owstest.clic'
const origin = 'https://' + hostname

async function captureScreenshot() {
	try {
		// 打印日志
		logToFile('\r\n')
		// 启动无头浏览器
		const browser = await puppeteer.launch({
			executablePath: './chrome-win/chrome.exe',
			headless: 'new',
		});

		// 创建一个新的页面
		const page = await browser.newPage();
		await page.setCookie({
			name: 'SESSION',
			value: sessionValue,
			domain: hostname,
			path: '/',
		})
		// 设置视口大小，避免页面内容被截断
		await page.setViewport({
			width: 1920,
			height: 1080,
			deviceScaleFactor: 2,
		});

		// 访问目标网站
		await page.goto(
			origin + '/OWS/ows-portal/screen/alloperatescreen/irfsi7',
			{
				waitUntil: 'networkidle2',
			}
		);
		// 等待页面加载完成
		await page.waitForSelector('p');  // 等待页面加载完成，选择一个页面中的元素作为标志

		// 截图并保存到本地，设置 fullPage 为 true 截取整个页面
		const imgName = `IFRS17-${new Date().getTime()}.jpg`
		createFolder('截屏文件')
		const buffer = await page.screenshot({
			path: `./截屏文件/${imgName}`,
			fullPage: true,
			type: 'jpeg',
			quality: 92,
		});

		logToFile('IFRS17年报截图保存成功, ', imgName);
		const formData = new FormData()
		formData.append('file', buffer, imgName)
		const response = await fetch(origin + '/OWS/obs-asview/ows_obs_asview_image/upload', {
			method: 'post',
			headers: {
				'Cookie': `SESSION=${sessionValue}`, // 手动设置 Cookie
			},
			body: formData,
		})
		if (!response.ok) {
			logToFile(response)
			logToFile('发生失败,网络错误')
			return
		}
		logToFile('上传成功')
		const responseData = await response.json()
		logToFile(responseData)

		// 关闭浏览器
		await browser.close();
	} catch (error) {
		logToFile('上传图片失败')
		logToFile(error)
	} finally {

	}
}

const getData = async () => {
	try {
		const response = await fetch(origin + '/OWS/obs-taskview/owsI17HalfYearReport/showBigView', {
			method: 'post',
			headers: {
				'Cookie': `SESSION=${sessionValue}`, // 手动设置 Cookie
			},
		})
		if (response.ok) {
			logToFile('请求数据成功')
		} else {
			const responseData = await response.json()
			logToFile(responseData)
		}
	} catch (error) {
		logToFile('获取数据失败')
		logToFile(JSON.stringify(error, null, 2))
	} finally {

	}
}

// 执行截图操作
captureScreenshot();
getData()

// 每天9点和21点执行截图任务
cron.schedule('0 9 * * *', () => {  // 每天9点执行
	captureScreenshot();
});

cron.schedule('0 21 * * *', () => {  // 每天21点执行
	captureScreenshot();
});

setInterval(() => {
	captureScreenshot()
	// 请求接口防止过期
	getData()
}, 10 * 60 * 1000)