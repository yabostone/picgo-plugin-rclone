import crypto from 'crypto'
import FileType from 'file-type'
import mime from 'mime'
import { IImgInfo } from 'picgo/dist/src/types'
import {execFile,execFileSync} from "child_process"
import * as fs from 'fs'
import path from  'path'
import * as os from 'os'

class FileNameGenerator {
    date: Date
    info: IImgInfo
    static fields = [
      'year',
      'month',
      'day',
      'fullName',
      'fileName',
      'extName',
      'md5',
      'sha1',
      'sha256'
    ]

constructor (info: IImgInfo) {
    this.date = new Date()
    this.info = info
    }

    public year (): string {
    return `${this.date.getFullYear()}`
    }

    public month (): string {
    return this.date.getMonth() < 9
        ? `0${this.date.getMonth() + 1}`
        : `${this.date.getMonth() + 1}`
    }

    public day (): string {
    return this.date.getDate() < 9
        ? `0${this.date.getDate()}`
        : `${this.date.getDate()}`
    }

    public fullName (): string {
    return this.info.fileName
    }

    public fileName (): string {
    return this.info.fileName.replace(this.info.extname, '')
    }

    public extName (): string {
    return this.info.extname.replace('.', '')
    }

    public md5 (): string {
    return crypto.createHash('md5').update(this.imgBuffer()).digest('hex')
    }

    public sha1 (): string {
    return crypto.createHash('sha1').update(this.imgBuffer()).digest('hex')
    }

    public sha256 (): string {
    return crypto.createHash('sha256').update(this.imgBuffer()).digest('hex')
    }

    private imgBuffer (): string | Buffer {
    return this.info.base64Image
        ? this.info.base64Image
        : this.info.buffer
    }
}

export function formatPath (info: IImgInfo, format?: string): string {
    if (!format) {
    return info.fileName
    }
    const fileNameGenerator = new FileNameGenerator(info)

    let formatPath: string = format

    for (let key of FileNameGenerator.fields) {
    const re = new RegExp(`{${key}}`, 'g')
    formatPath = formatPath.replace(re, fileNameGenerator[key]())
    }

    return formatPath
}

export async function extractInfo(info: IImgInfo): Promise<{
    body?: Buffer
    contentType?: string
    contentEncoding?: string
}> {
    let result: {
    body?: Buffer
    contentType?: string
    contentEncoding?: string
    } = {}

    if (info.base64Image) {
    const body = info.base64Image.replace(/^data:[/\w]+;base64,/, '')
    result.contentType = info.base64Image.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0]
    result.body = Buffer.from(body, 'base64')
    result.contentEncoding = 'base64'
    } else {
    if (info.extname) {
        result.contentType = mime.getType(info.extname)
    }
    result.body = info.buffer
    }

    // fallback to detect from buffer
    if (!result.contentType) {
    const fileType = await FileType.fromBuffer(result.body)
    result.contentType = fileType?.mime
    }

    return result
}

export function execFileSyncfunc(command:string, args: string[]):string|boolean{
    try{
      const execProcess = execFileSync(command, args,{ 'encoding': 'utf8' })
      console.log(execProcess)
      return execProcess
    }catch{
      console.log("remoteName is not exist.")
      return false;
    }
  }
export  function execFilefunc(command:string, args: string[]){
    return new Promise(function(resolve, reject) {
      execFile(command, args, (error, stdout, stderr) => {
          if (error) {
              reject(error);
              return;
          }
          resolve(stdout.trim());
      });
  });}
  
  
export function checkRemoteExistSync(remoteName:string) : boolean{
    try{
      const execProcess = execFileSync('rclone', ['ls',remoteName+':'],{ 'encoding': 'utf8' })
      return true;
    }catch{
      return false;
    }
  }
  
export  function checkRemoteExist(remoteName:string,remoteBucketName:string):Promise<boolean>{
    return new Promise(function(resolve, reject) {
      execFile("rclone", ["mkdir", remoteName+":"+ remoteBucketName], (error, stdout, stderr) => {
          if (error) {
              reject(false);
              return false;
          }
          resolve(true);
          return true;
      });
  });}
  
  /**
   * 备份图片到本地
   * @param {ctx}                     ctx
   * @param {图片备份文件夹}           imagePath 
   * @param {ctx.output数组成员对象}   imgObject 
   */
  
  //返回路径
export function backupInLocal(ctx, imagePath, imgObject):Promise<string>{
    // 读取图片数据
    return new Promise<string>(function(resolve,reject){
      var hashfName = formatPath(imgObject,"{md5}.{extName}")
      var ret = `${imagePath}/${hashfName}`
      var img = imgObject.buffer
      if((!img) && (imgObject.base64Image)){
          img = Buffer.from(imgObject.base64Image, 'base64')
      }
      //ret = path.resolve(ret)
      // 备份图片
      console.log("filepath in Local:" + ret)
      fs.writeFileSync(ret, img)
      resolve(ret)
    })
  }
  
  //返回路径
export  function backupInLocalSync(ctx, imagePath, imgObject){
    // 读取图片数据
      var hashfName = formatPath(imgObject,"{md5}.{extName}")
      var ret = `${imagePath}/${hashfName}`
      var img = imgObject.buffer
      if((!img) && (imgObject.base64Image)){
          img = Buffer.from(imgObject.base64Image, 'base64')
      }
      //ret = path.resolve(ret)
      // 备份图片
      console.log("filepath in Local:" + ret)
      fs.writeFileSync(ret, img)
      return(ret)
    }

