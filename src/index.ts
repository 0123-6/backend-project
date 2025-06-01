import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { getRandom, returnRes, timeout } from "./util.js";
import './ai/index.js'
import {app} from "./app.js";
import {userList} from "./database.js";
import {dateToYYYYMMDDHHMMSS} from "./date.js";
import dayjs from "dayjs";

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
	const user = userList.find(user => user.account === account && user.password === password)
	if (!user) {
		res.json({
			code: 999,
			msg: '账号或密码错误',
		})
		return
	}
	if (user.status === 'disabled') {
		res.json({
			code: 999,
			msg: '该账号已被禁用',
		})
		return
	}

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
		account = '',
		nickname = '',
		sex = [],
		phone = '',
		status = [],
		description = '',
		createTimeBegin = dayjs('1970-01-01 00:00:00').format('YYYY-MM-DD HH:mm:ss'),
		createTimeEnd = dayjs().format('YYYY-MM-DD HH:mm:ss'),

		pageNum,
		pageSize,
		orderFiled = 'createTime',
		orderStatus = 'desc',
	} = req.body

	// 1. 通过筛选条件进行筛选
	const filteredUserList = userList
		.map(item => ({
			...item,
			password: undefined,
		}))
		.filter(item =>
		item.account.includes(account)
		&& (nickname ? item.nickname?.includes(nickname) : true)
		&& (sex.length ? sex.includes(item.sex) : true)
		&& (phone ? item.phone?.includes(phone) : true)
		&& (status.length ? status.includes(item.status) : true)
		&& (description ? item.description?.includes(description) : true)
		&& dayjs(item.createTime).isAfter(dayjs(createTimeBegin))
		&& dayjs(item.createTime).isBefore(dayjs(createTimeEnd))
	)
	// 2. 排序,先不管

	// 3. 分页
	const pageUserList = filteredUserList.slice((pageNum-1) * pageSize, pageNum * pageSize)

	res.json({
		code: 200,
		msg: '操作成功',
		data: {
			total: filteredUserList.length,
			list: pageUserList,
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
		status = 'normal',
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
		status,
		description,
		createTime: dateToYYYYMMDDHHMMSS(new Date()),
	})
	res.json({
		code: 200,
		msg: '注册成功~'
	})
})

app.post('/user/addUserList', (req, res) => {
	const {
		list = [],
	} = req.body

	// 遍历,只要存在1样的account,直接全部失败
	for (let i = 0; i < list.length; i++) {
		if (userList.some(user => user.account === list[i]['账号'])) {
			res.json({
				code: 999,
				msg: '文件中存在已存在账号,批量导入失败',
			})
			return
		}
	}

	// 校验数据
	for (let i = 0; i < list.length; i++) {
		if (!(list[i]['账号'] && list[i]['密码'] && list[i]['状态'])) {
			res.json({
				code: 999,
				msg: '存在不完整的数据,批量导入失败',
			})
			return
		}
	}

	userList.push(...list.map(item => ({
		account: item['账号'],
		password: item['密码'],
		nickname: item['昵称'] ?? '',
		sex: item['性别'] ?? '',
		phone: item['手机号'] ?? '',
		status: item['状态'],
		description: item['简介'] ?? '',
		createTime: dateToYYYYMMDDHHMMSS(new Date()),
	})))
	res.json({
		code: 200,
		msg: '批量导入用户成功',
	})
})

app.post('/user/editUser', (req, res) => {
	const {
		account,
		nickname,
		sex,
		phone,
		status,
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
		status,
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