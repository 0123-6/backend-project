export const timeout = (fn) => {
	// 随机0s - 5s的延迟
	const delay = Math.random() * 5 * 1000
	setTimeout(fn, delay)
}

export const getRandom = (num) => Math.floor(Math.random() * num)

export const getRandomSuccessOrFail = () => {
	return Math.random() < 0.9
}

export const commonRes = {
	code: 200,
	msg: '操作成功',
	data: {},
}

export const commonErrorRes = {
	code: '999',
	msg: '操作失败',
}

export const returnRes = (data) => {
	const isSuccess = getRandomSuccessOrFail()
	if (!isSuccess) {
		return commonErrorRes
	}
	return {
		...commonRes,
		data,
	}
}