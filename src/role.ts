import {IEntity} from "./interfaceCommon.js";
import dayjs from "dayjs";
import app from "./app.js";
import {userList} from "./user.js";

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
const deleteRole = (props: IRole)
  : boolean | string => {
  const {
    name,
  } = props
  const index = roleList.findIndex(item => item.name === name)
  if (index === -1) {
    return '要删除的角色不存在,请检查'
  }
  // 有用户在使用,不能删除
  if (userList.some(user => user.roleList.includes(name))) {
    return '存在配置该角色的用户,无法删除'
  }

  roleList.splice(index, 1)
  return true
}
app.post('/role/delete', (req, res) => {
  const result = deleteRole(req.body)
  res.json({
    code: result === true ? 200 : 999,
    msg: result,
  })
})

// 修改角色

// 查询角色

// 初始化