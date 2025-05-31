import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { getRandom, returnRes, timeout } from "./util.js";
import './ai/index.js'
import {app} from "./app.js";
import {userList} from "./database.js";
import {dateToYYYYMMDDHHMMSS} from "./date.js";

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

app.post('/login', (req, res) => {
	const requestData = req.body
	const token = '123456'
	const {
		account,
		password,
	} = requestData
	console.log(account)
	console.log(password)
	const user = userList.find(user => user.account === account && user.password === password)
	if (user) {
		res.cookie('token', token, {
			httpOnly: true,
			// undefined表示没有这个属性,表示会话级别生命周期,会在浏览器关闭时删除此cookie属性.
			maxAge: requestData.remember ? 365 * 24 * 60 * 60 * 1000 : undefined,
			sameSite: 'strict',
		})
		res.json({
			code: 200,
			msg: '登录成功',
			data: user,
		})
	} else {
		res.json({
			code: 999,
			msg: '账号或密码错误',
		})
	}
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

app.post('/user/getUserList', (req, res) => {
	const {
		pageNum,
		pageSize,
		orderFiled,
		orderStatus
	} = req.body

	res.json({
		code: 200,
		msg: '操作成功',
		data: {
			total: userList.length,
			list: userList,
		},
	})
})

app.post('/user/addUser', (req, res) => {
	const {
		account,
		password,
		nickname,
		sex,
		phone,
		description,
	} = req.body
	if (userList.some(user => user.account === account)) {
		res.json({
			code: 999,
			msg: '该账号已存在,换个名字试试呢~',
		})
		return
	}

	userList.push({
		account,
		password,
		nickname,
		sex,
		phone,
		description,
		createTime: dateToYYYYMMDDHHMMSS(new Date()),
	})
	res.json({
		code: 200,
		msg: '注册成功~'
	})
})

app.post('/user/editUser', (req, res) => {
	const {
		account,
		nickname,
		sex,
		phone,
		description,
	} = req.body
	// account不存在
	const accountIndex = userList.findIndex(item => item.account === account)
	if (accountIndex === -1) {
		res.json({
			code: 999,
			msg: '该账号不存在'
		})
		return
	}
	userList[accountIndex] = {
		...userList[accountIndex],
		nickname,
		sex,
		phone,
		description,
	}
	res.json({
		code: 200,
		msg: '编辑成功',
	})
})

app.post('/user/deleteUser', (req, res) => {
	const {
		accountList = []
	} = req.body
	const newList = userList.filter(item => !accountList.includes(item.account))
	userList.splice(0, userList.length, ...newList)
	res.json({
		code: 200,
		msg: '删除用户成功'
	})
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