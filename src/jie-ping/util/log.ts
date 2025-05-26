import { appendFile } from "fs/promises";
import path from "path";
import os from "os";

const LOG_FILE_PATH = path.resolve(process.cwd(), "日志.txt"); // 当前目录绝对路径

export async function logToFile(message: unknown, logFilePath: string = LOG_FILE_PATH): Promise<void> {
	const timestamp = new Date().toISOString();

	let formattedMessage: string;
	if (typeof message === "object" && message !== null) {
		try {
			formattedMessage = JSON.stringify(message, null, 2);
		} catch (err) {
			formattedMessage = "[无法序列化日志对象]";
		}
	} else {
		formattedMessage = String(message);
	}

	const logMessage = `[${timestamp}] ${formattedMessage}${os.EOL}`;

	try {
		// 先写文件
		await appendFile(logFilePath, logMessage, { encoding: "utf8" });
		// 再打印
		console.log(logMessage.trim());
	} catch (err) {
		console.error("写入日志失败:", err);
	}
}
