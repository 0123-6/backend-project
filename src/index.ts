import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { getRandom, returnRes, timeout } from "./util.js";
import './ai/index.js'
import {app} from "./app.js";

app.use(express.json());
app.use(cookieParser());

// @ts-ignore
app.use((req: Request, res: Response, next: NextFunction) => {
	const noAuthRoutes = ['/login', '/register', '/forget-password'];
	if (noAuthRoutes.includes(req.path)) {
		return next()
	}
	const token = req.cookies.token
	if (!token) {
		return res.json({
			code: 901,
			msg: '登录超时'
		})
	}
	next()
})

// 用户增
app.post('/userAdd', (req: Request, res: Response) => {

})
// 用户删
app.post('/userDelete', (req: Request, res: Response) => {

})
// 用户改
app.post('/userEdit', (req: Request, res: Response) => {

})
// 用户查
app.post('/userSearch', (req: Request, res: Response) => {

})



app.post('/login', (req, res) => {
	const fn = () => {
		const requestData = req.body
		const token = '123456'
		if (Math.random() > 0.1) {
			res.cookie('token', token, {
				httpOnly: true,
				// undefined表示没有这个属性,表示会话级别生命周期,会在浏览器关闭时删除此cookie属性.
				maxAge: requestData.remember ? 365 * 24 * 60 * 60 * 1000 : undefined,
				sameSite: 'strict',
			})
			res.json({
				code: 200,
				msg: '登录成功',
				data: {
					username: '韩佩江',
					age: 26,
				},
			})
		} else {
			res.json({
				code: 999,
				msg: '操作失败',
			})
		}
	}
	timeout(fn)
})

app.post('/logout', (req, res) => {
	const fn = () => {
		if (Math.random() > 0.1) {
			res.clearCookie('token', {
				httpOnly: true,
				sameSite: 'strict',
			})
			res.json({
				code: 200,
				msg: '操作成功',
			})
		} else {
			res.json({
				code: 999,
				msg: '操作失败',
			})
		}
	}
	timeout(fn)
})

app.post('/', (req, res) => {
	const fn = () => {
		const requestData = req.body
		// 遍历
		const responseData = Object.create(null)
		for (const [key, value] of Object.entries(requestData?.mockObject ?? {})) {
			if (Array.isArray(value)) {
				responseData[key] = value[getRandom(value.length)]
			} else {
				responseData[key] = value
			}
		}
		res.json(returnRes(responseData))
	}
	timeout(fn)
})

app.listen(8080, (error: Error) => {
	if (error) {
		console.error(error)
		process.exit(1)
	} else {
		console.log('服务启动成功，端口8080')
	}
})