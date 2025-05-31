// utils/randomDate.ts

import dayjs, {Dayjs} from "dayjs";

/**
 * 生成 2010-01-01 到今天之间的随机日期（格式：yyyy-MM-dd）
 */
export function getRandomDate(): string {
	const start = new Date('2010-01-01').getTime();
	const end = new Date().getTime();
	const randomTime = new Date(start + Math.random() * (end - start));
	return randomTime.toISOString().split('T')[0]; // yyyy-MM-dd
}

/**
 * 生成 00:00:00 ~ 23:59:59 之间的随机时间（格式：HH:mm:ss）
 */
export function getRandomTime(): string {
	const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
	const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
	const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}

export const dateToYYYYMMDDHHMMSS = (date: (string | Date | Dayjs) = new Date()) => {
	return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}