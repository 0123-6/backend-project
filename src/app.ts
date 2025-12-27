import express from "express";
import cookieParser from 'cookie-parser'
import {getRandom, returnRes, timeout} from "./util.js";
import {sessionMap} from "./auth.js";
import dayjs from "dayjs";
import {userList} from "./user.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

// @ts-ignore
app.use((req, res, next) => {
  const noAuthRoutes = [
    '/login',
    '/user/addUser',
    '/forget-password',
    '/chat',
    '/auth/getCode',
    '/logout',
    '/ai/chat',
  ];
  // 不需要权限,直接放行
  if (noAuthRoutes.includes(req.path)) {
    return next()
  }

  const account = sessionMap.get(req.cookies.session)
  // 未登录 & 登录超时
  if (!account) {
    return res.json({
      code: 901,
      msg: '登录超时'
    })
  }

  const user = userList.find(item => item.account === account)
  user.lastActiveTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  next()
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

export default app