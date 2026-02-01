import {userList} from "./user.js";
import dayjs from "dayjs";
import app from "./app.js";

// 登录信息
export const sessionMap = new Map<string, string>()
// 1h未活跃的账号自动下线
setInterval(() => {
  for (const [session, account] of sessionMap.entries()) {
    const user = userList.find(item => item.account === account)
    if (dayjs().diff(dayjs(user.lastActiveTime), 'minute') > 60) {
      sessionMap.delete(session)
    }
  }
}, 60 * 1000)

// 设置 HttpOnly 的 Cookie 保存身份信息，再通过接口获取全量用户信息
// 后端一定需要知道并维护用户登录信息,后端必须维护 session 的过期时间
app.post('/login', (req, res) => {
  const requestData = req.body
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

  const uuid = crypto.randomUUID()
  sessionMap.set(uuid, user.account)
  res.cookie('session', uuid, {
    httpOnly: true,
    // undefined表示没有这个属性,表示会话级别生命周期,会在浏览器关闭时删除此cookie属性.
    // maxAge: requestData.remember ? 365 * 24 * 60 * 60 * 1000 : undefined,
    // 使用lax而不是strict
    sameSite: 'lax',
  })
  res.json({
    code: 200,
    msg: '登录成功',
  })
})

app.post('/logout', (req, res) => {
  res.clearCookie('session', {
    httpOnly: true,
    sameSite: 'lax',
  })
  sessionMap.delete(req.cookies.session)
  res.json({
    code: 200,
    msg: '操作成功',
  })
})

// 下线其它账号
app.post('/user/logout', (req, res) => {
  const {
    accountList = []
  } = req.body

  // 批量下线
  for (let i = 0; i < accountList.length; i++) {
    for (const [sessionId, onlineAccount] of sessionMap.entries()) {
      if (onlineAccount === accountList[i]) {
        sessionMap.delete(sessionId)
        break
      }
    }
  }

  res.json({
    code: 200,
  })
})

// 获取验证码
app.post('/auth/getCode', (req, res) => {
  res.json({
    code: 200,
  })
})

// 验证手机号是否合法（中国大陆手机号）
const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 手机号登录
app.post('/loginByPhone', (req, res) => {
  const { phone } = req.body

  if (!isValidPhone(phone)) {
    res.json({
      code: 999,
      msg: '手机号格式不正确',
    })
    return
  }

  let user = userList.find(user => user.phone === phone)

  // 用户不存在，自动创建
  if (!user) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    user = {
      account: phone,
      password: '',
      phone,
      status: 'normal',
      lastActiveTime: now,
      roleList: [],
      permissionList: [],
      createTime: now,
      lastChangeTime: now,
    }
    userList.push(user)
  }

  if (user.status === 'disabled') {
    res.json({
      code: 999,
      msg: '该账号已被禁用',
    })
    return
  }

  const uuid = crypto.randomUUID()
  sessionMap.set(uuid, user.account)
  res.cookie('session', uuid, {
    httpOnly: true,
    sameSite: 'lax',
  })
  res.json({
    code: 200,
    msg: '登录成功',
  })
})