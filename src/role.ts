import {IEntity} from "./interfaceCommon.js";
import dayjs from "dayjs";
import app from "./app.js";
import {userList} from "./user.js";
import {permissionList} from "./permission.js";

// 角色信息
export interface IRole extends IEntity {
  // 名称,唯一标识
  name: string,
  // 权限信息
  permissionList: string[],
}

// 角色信息表
export let roleList: IRole[] = []

// 添加角色
const addRole = (props: IRole)
  : (boolean | string) => {
  const {
    name,
    permissionList: _permissionList,
  } = props
  // 名字不能重复
  if (roleList.some(item => item.name === name)) {
    return '该名称已存在,换个名字吧~'
  }
  if (_permissionList) {
    // 如果存在权限列表,那么该列表的每1项都需要已经存在
    if (_permissionList.some(newPermission => permissionList.every(permission => permission.name !== newPermission))) {
      return '要添加的权限部分不存在,请检查'
    }
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

interface IDeleteRoleParams {
  roleList: string[],
}

// 删除角色
const deleteRole = (props: IDeleteRoleParams)
  : boolean | string => {
  const {
    roleList: _roleList = [],
  } = props
  for (let i = 0; i < _roleList.length; i++) {
    const name = _roleList[i]
    const index = roleList.findIndex(item => item.name === name)
    if (index === -1) {
      return '要删除的角色不存在,请检查'
    }
    // 有用户在使用,不能删除
    if (userList.some(user => user.roleList.includes(name))) {
      return '存在配置该角色的用户,无法删除'
    }
  }

  // 校验通过,删除
  for (let i = 0; i < roleList.length; i++) {
    if (_roleList.includes(roleList[i].name)) {
      roleList[i] = undefined
    }
  }
  roleList = roleList.filter(Boolean)
  return true
}
app.post('/role/delete', (req, res) => {
  const result = deleteRole(req.body)
  res.json({
    code: result === true ? 200 : 999,
    msg: result,
  })
})

// 修改角色,修改permissionList, 描述
const updateRole = (props: IRole)
  : boolean | string => {
  const {
    name,
    permissionList: _permissionList,
    description,
  } = props
  const index = roleList.findIndex(item => item.name === name)
  if (index === -1) {
    return '要更新的角色不存在,请检查'
  }
  if (_permissionList) {
    // 如果存在权限列表,那么该列表的每1项都需要已经存在
    if (_permissionList.some(newPermission => permissionList.every(permission => permission.name !== newPermission))) {
      return '要更新的权限部分不存在,请检查'
    }
  }

  roleList[index] = {
    ...roleList[index],
    name,
    permissionList: _permissionList,
    description,
    lastChangeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  }
  return true
}
app.post('/role/update', (req, res) => {
  const result = updateRole(req.body)
  res.json({
    code: result === true ? 200 : 999,
    msg: result,
  })
})

// 查询角色
app.post('/role/query', (req, res) => {
  const {
    name,
    permissionList: _permissionList,
    description,

    pageNum,
    pageSize,
    orderFiled = 'createTime',
    orderStatus = 'desc',
  } = req.body

  // 1. 通过筛选条件进行筛选
  const filterRoleList = roleList.filter(
    role =>
      (name ? role.name?.includes(name) : true)
      && (_permissionList ? role.permissionList?.some(rolePermission => _permissionList.includes(rolePermission)) : true)
      && (description ? role.description?.includes(description) : true)
  )
  // 2. 排序,先不管
  // 3. 分页
  const pageList = filterRoleList.slice((pageNum - 1) * pageSize, pageNum * pageSize)

  res.json({
    code: 200,
    msg: '操作成功',
    data: {
      total: filterRoleList.length,
      list: pageList,
    },
  })
})

// 获取全量角色
app.post('/role/getAllRoleList', (req, res) => {
  res.json({
    code: 200,
    data: roleList,
  })
})

// 初始化
const init = () => {
  // 添加开发角色
  addRole({
    name: '开发人员',
    description: '仅供开发人员使用',
    permissionList: permissionList.map(permission => permission.name),
  })
// 添加管理员角色(非开发)
  addRole({
    name: '管理员',
    description: '管理员角色,拥有全部目录,菜单,按钮权限(除权限管理菜单)',
    permissionList: permissionList.filter(permission => permission.name !== '权限管理').map(permission => permission.name),
  })
// 添加业务角色1
  addRole({
    name: '业务角色1',
    description: '业务角色1',
    permissionList: [
      '业务目录一',
      '业务菜单1-1',
    ],
  })

// 添加业务角色2
  addRole({
    name: '业务角色2',
    description: '业务角色2',
    permissionList: [
      '业务目录二',
      '业务菜单2-2',
    ],
  })

// 添加业务角色3
  addRole({
    name: '业务角色3',
    description: '业务角色3',
    permissionList: [
      '业务目录一',
      '业务目录二',
      '业务菜单1-1',
      '业务菜单1-2',
      '业务菜单1-3',
      '业务菜单2-1',
      '业务菜单2-2',
    ],
  })
}

queueMicrotask(init)
