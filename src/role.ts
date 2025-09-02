import {IEntity} from "./interfaceCommon.js";
import dayjs from "dayjs";
import app from "./app.js";

// 角色信息
export interface IRole extends IEntity {
  // 名称,唯一标识
  name: string,
  // 权限信息
  permissionList: string[],
}

// 角色信息表
export const roleList: IRole[] = []

// 添加角色
const addRole = (props: IRole)
  : (boolean | string) => {
  const {
    name,
  } = props
  // 名字不能重复
  if (roleList.some(item => item.name === name)) {
    return '该名称已存在,换个名字吧~'
  }

  // 通过了所有检验
  roleList.push({
    ...props,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    lastChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  })
  return true
}
app.post('/role/add', (req, res) => {
  const result = addRole(req.body)
  res.json({
    code: result === true ? 200 : 999,
    msg: result,
  })
})

// 删除角色

// 修改角色

// 查询角色

// 初始化