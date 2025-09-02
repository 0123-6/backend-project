import {getRandomDate, getRandomTime} from "./date.js";
import {IEntity} from "./interfaceCommon.js";
import dayjs from "dayjs";
import {sessionMap} from "./auth.js";
import app from "./app.js";

export interface IUserInfo extends IEntity{
	// 账号,唯一标识
	account: string,
	// 密码
	password: string,
	// 昵称
	nickname?: string,
	// 性别
	sex?: 'man' | 'woman',
	// 手机号,唯一
	phone?: string,
	// 状态
	status: 'normal' | 'disabled',
	// 最新活跃时间
	lastActiveTime: string,
	// 权限信息
	permissionList: string[],
	// 在线状态,动态设置,非用户自身信息
	isOnline?: boolean,
}

// 用户信息表
export const userList: IUserInfo[] = []

// 添加
const addUser = (props: (IUserInfo | IUserInfo[]))
  : (boolean | string) => {
  // 批量添加
  if (Array.isArray(props)) {
    for (let i = 0; i < props.length; i++) {
      if (userList.some(item => item.account === props[i].account)) {
        return '文件中存在已存在账号,批量导入失败'
      }
    }
    for (let i = 0; i < props.length; i++) {
      userList.push({
        status: 'normal',
        permissionList: [],
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        lastChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        ...props[i],
      })
    }
    return true
  } else {
    // 单个添加
    // account不呢重复
    if (userList.some(item => item.account === props.account)) {
      return '该账号已存在,换个名字试试呢~'
    }

    // 通过了所有检验,是合法值,插入
    userList.push({
      status: 'normal',
      permissionList: [],
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      lastChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      ...props,
    })
    return true
  }
}

app.post('/user/addUser', (req, res) => {
  const result = addUser(req.body as IUserInfo)
  res.json({
    code: result === true ? 200 : 999,
    msg: result,
  })
})

app.post('/user/addUserList', (req, res) => {
  const result = addUser(req.body.list as IUserInfo[])
  res.json({
    code: result === true ? 200 : 999,
    msg: result,
  })
})

// 删除
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

// 更新
app.post('/user/editUser', (req, res) => {
  const {
    account,
    nickname,
    sex,
    phone,
    status,
    description,
    permissionList = [],
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
    permissionList,
    lastChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }
  res.json({
    code: 200,
    msg: '编辑成功',
  })
})

// 查询
app.post('/user/getAccountList', (req, res) => {
  res.json({
    code: 200,
    msg: '操作成功',
    data: userList.map(user => user.account),
  })
})

app.post('/user/getUserInfo', (req, res) => {
  const account = sessionMap.get(req.cookies.session)
  const user = userList.find(item => item.account === account)
  res.json({
    code: 200,
    data: {
      ...user,
      password: undefined,
    },
  })
})

app.post('/user/getUserList', (req, res) => {
  const {
    account = [],
    nickname = '',
    sex = [],
    phone = '',
    status = [],
    isOnline = [],
    description = '',
    createTimeBegin,
    createTimeEnd,

    pageNum,
    pageSize,
    orderFiled = 'createTime',
    orderStatus = 'desc',
  } = req.body

  if (!(createTimeBegin && createTimeEnd)) {
    res.json({
      code: 999,
      msg: '创建时间需要填写'
    })
    return
  }

  const onlineSet = new Set(sessionMap.values())

  // 1. 通过筛选条件进行筛选
  const filteredUserList = userList
  .map(item => ({
    ...item,
    password: undefined,
    isOnline: onlineSet.has(item.account),
  }))
  .filter(
    item =>
      (account.length ? account.includes(item.account) : true)
      && (nickname ? item.nickname?.includes(nickname) : true)
      && (sex.length ? sex.includes(item.sex) : true)
      && (phone ? item.phone?.includes(phone) : true)
      && (status.length ? status.includes(item.status) : true)
      && (isOnline.length ? isOnline.includes(item.isOnline) : true)
      && (description ? item.description?.includes(description) : true)
      && dayjs(item.createTime).isSameOrAfter(dayjs(createTimeBegin))
      && dayjs(item.createTime).isSameOrBefore(dayjs(createTimeEnd))
  )
  // 2. 排序,先不管

  // 3. 分页
  const pageUserList = filteredUserList.slice((pageNum - 1) * pageSize, pageNum * pageSize)

  res.json({
    code: 200,
    msg: '操作成功',
    data: {
      total: filteredUserList.length,
      list: pageUserList,
    },
  })
})

// 添加用户信息
const createTime = getRandomDate() + ' ' + getRandomTime()
addUser({
  account: 'admin',
  password: 'password',
  nickname: '演示账号',
  sex: 'man',
  phone: '17796723651',
  status: 'normal',
  description: '这是演示账号',
  permissionList: [
    '首页',
    '系统管理',
    '用户管理',
    '角色管理',
    '权限管理',
    '新增和批量导入用户',
    '修改用户',
    '查询和批量导出用户',
  ],
  createTime,
  lastChangeTime: createTime,
  lastActiveTime: createTime,
})

const list1 = [
	'业务目录一',
	'业务菜单1-1',
]
const list2 = [
	'业务目录二',
	'业务菜单2-2',
]
const list3 = [
	'业务目录一',
	'业务目录二',
	'业务菜单1-1',
	'业务菜单1-2',
	'业务菜单1-3',
	'业务菜单2-1',
	'业务菜单2-2',
]
for (let i = 1; i <= 40; i++) {
	const random = Math.random()
	const createTime = getRandomDate() + ' ' + getRandomTime()
  addUser({
    account: `user${i}`,
    password: 'password',
    nickname: Math.random() > 0.5 ? `用户${i}` : undefined,
    sex: random > 0.7 ? undefined : random > 0.4 ? 'man' : 'woman',
    phone: Math.random() > 0.5 ? `177967236${i < 10 ? '0'+i : i}` : undefined,
    status: Math.random() > 0.25 ? 'normal' : 'disabled',
    description: Math.random() > 0.5 ? `用户${i}的简介` : undefined,
    createTime,
    lastChangeTime: createTime,
    lastActiveTime: createTime,
    permissionList: i === 1
      ? []
      : i < 10
        ? list1
        : i < 20
          ? list2
          : list3,
  })
}