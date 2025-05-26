import { mkdir, writeFile, access, rm, stat, readFile, copyFile, rename } from "fs/promises";
import { constants } from "fs";

/**
 * 创建文件夹（幂等）
 */
export async function createFolder(folderPath: string): Promise<void> {
	await mkdir(folderPath, { recursive: true });
}

/**
 * 判断文件/目录是否存在
 */
export async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

/**
 * 写入 JSON 文件
 */
export async function writeJSON(path: string, data: unknown): Promise<void> {
	const content = JSON.stringify(data, null, 2);
	await writeFile(path, content, "utf-8");
}

/**
 * 读取 JSON 文件
 */
export async function readJSON<T = unknown>(path: string): Promise<T> {
	const content = await readFile(path, "utf-8");
	return JSON.parse(content) as T;
}

/**
 * 删除路径（递归）
 */
export async function deletePath(path: string): Promise<void> {
	await rm(path, { recursive: true, force: true });
}

/**
 * 获取文件信息
 */
export async function getStats(path: string): Promise<ReturnType<typeof stat>> {
	return await stat(path);
}

/**
 * 复制文件
 */
export async function copy(pathFrom: string, pathTo: string): Promise<void> {
	await copyFile(pathFrom, pathTo);
}

/**
 * 移动/重命名
 */
export async function move(pathFrom: string, pathTo: string): Promise<void> {
	await rename(pathFrom, pathTo);
}
