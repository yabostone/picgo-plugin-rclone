import picgo from 'picgo'
import { formatPath} from './utils'
import {execFile,execFileSync} from "child_process"
import * as fs from 'fs'
import path from  'path'


interface rcloneConfig{
    remoteName: string
    remoteBucketName: string
    remotePrefix: string
    urlPrefix: string   //用来生成URL的前缀，必填，
    uploadPath: string  //上传路径,设定年月日
    backupName: string
    backupBucketName: string
    backupPrefix: string
  }
  //返回false或者stdout
function execFileSyncfunc(command:string, args: string[]):string|boolean{
  try{
    const execProcess = execFileSync(command, args,{ 'encoding': 'utf8' })
    console.log(execProcess)
    return execProcess
  }catch{
    console.log("remoteName is not exist.")
    return false;
  }
}
function checkRemoteExist(remoteName:string) : boolean{
  try{
    const execProcess = execFileSync('rclone', ['ls',remoteName+':'],{ 'encoding': 'utf8' })
    return true;
  }catch{
    return false;
  }
}

/**
 * 备份图片到本地
 * @param {ctx}                     ctx
 * @param {图片备份文件夹}           imagePath 
 * @param {ctx.output数组成员对象}   imgObject 
 */
//返回路径
function backupInLocal(ctx, imagePath, imgObject):string{
  // 读取图片数据
  var ret = `${imagePath}/${imgObject.fileName}`
  var img = imgObject.buffer
  if((!img) && (imgObject.base64Image)){
      img = Buffer.from(imgObject.base64Image, 'base64')
  }
  ret = path.resolve(ret)
  // 备份图片
  fs.writeFileSync(ret, img)
  return ret;
}

const handle = async (ctx: picgo)=>{
  let userConfig: rcloneConfig = ctx.getConfig("picBed.rclone")
  if(!userConfig){
    throw new Error("RCLONE in Picgo config not exist!")
  }
  if(userConfig.uploadPath){
    userConfig.uploadPath = userConfig.uploadPath.replace(/\/?$/, '')
  }
  if(userConfig.urlPrefix){
    userConfig.urlPrefix = userConfig.urlPrefix.replace(/\/$/,'')
  }
  const output = ctx.output
  interface mapResult{
    url : string
    index : number
  }
//item 属于IImgInfo类型
// 顺序 idx
// 定义返回值，url，index
//通常上传成功之后要给这个数组里每一项加入imgUrl以及url项。可以参
  const tasks = output.map((item, index) =>{//这里图片的值需要定义
    var fPath = formatPath(item,userConfig.uploadPath)
    const rcloneLocalURI = backupInLocal(ctx, "./", item)
    const rcloneRemoteURL = userConfig.remoteName + ":" + userConfig.remoteBucketName + '/' +userConfig.remotePrefix + '/' + fPath
    if(checkRemoteExist(userConfig.remoteName)){
      console.log(rcloneLocalURI,rcloneRemoteURL)
      // ready to try catch
      var up = execFileSyncfunc("rclone" , ['sync', rcloneLocalURI ,rcloneRemoteURL])
      console.log(`rclone stdout is:\n ${up}`)
    }else{
      throw new Error("remoteBucketName in config can not be found on remote.")
    }
    return new Promise<mapResult>(async (resolve,reject) => {
      if (!item.buffer && !item.base64Image) {
        reject(new Error('undefined image'))
      }
      let mR = {
        index: index,
        url: fPath,
      } as mapResult;
      resolve(mR)
    })
  })
  try {
    const results = await Promise.all(tasks)//返回值，这里只能用手动生成的值代替
    for (let result of results) {
      const { index, url } = result
      const imgURL = url
      delete output[index].buffer
      delete output[index].base64Image
      output[index].url = url
      output[index].imgUrl = url
      output[index].url = `${userConfig.urlPrefix}/${imgURL}`
      output[index].imgUrl = `${userConfig.urlPrefix}/${imgURL}`
  }
    return ctx
  } catch (err) {
  ctx.log.error('rclone上传发生错误，请检查配置是否正确')
  ctx.log.error(err)
  ctx.emit('notification', {
    title: 'rclone上传错误',
    body: '请检查存储桶、远程源名字是否正确',
    text: ''
  })
  throw err
  }
}

const config = (ctx: picgo) => {
  const defaultConfig: rcloneConfig = {
    remoteName: '',
    remoteBucketName: '',
    remotePrefix: 'picgo',
    urlPrefix: '',   //用来生成URL的前缀，必填，
    uploadPath: '{year}/{month}/{md5}.{extName}',  //上传路径,设定年月日
    backupName: '',
    backupBucketName: '',
    backupPrefix: 'picgo'
  }
  let userConfig = ctx.getConfig<rcloneConfig>('picBed.rclone')
  userConfig = { ...defaultConfig, ...(userConfig || {}) }
  return [
    {
      name: 'remoteName',
      type: 'input',
      default: userConfig.remoteName,
      required: true,
      message: 'remoteSourceName',
      alias: 'source remote points，远程源名'
    },
    {
      name: 'remoteBucketName',
      type: 'input',
      default: userConfig.remoteBucketName,
      required: true,
      message: 'BucketName',
      alias: '远程源的桶名'
    },      
    {
      name: 'remotePrefix',
      type: 'input',
      default: userConfig.remotePrefix,
      required: true,
      message: '桶下前缀文件夹名',
      alias: '桶下前缀文件夹名'
    },
    {
      name: 'urlPrefix',
      type: 'input',
      default: userConfig.urlPrefix,
      message: '根据存储后端设定的域名前缀',
      required: true,
      alias: '分配域名前缀'
    },     
    {
      name: 'uploadPath',
      type: 'input',
      default: userConfig.uploadPath,
      message: '为空则以原始文件名上传到根目录',
      required: false,
      alias: '上传路径'
    },
    {
      name: 'backupName',
      type: 'input',
      default: userConfig.backupName,
      required: false,
      message: 'remoteSourceBackupName',
      alias: 'source remote points/远程源名'
    },
    {
      name: 'backupBucketName',
      type: 'input',
      default: userConfig.backupBucketName,
      required: false,
      message: 'BucketName',
      alias: '远程源的桶名'
    },      
    {
      name: 'backupPrefix',
      type: 'input',
      default: userConfig.backupPrefix,
      required: false,
      message: '桶下前缀文件夹名',
      alias: '桶下前缀文件夹名'
    }
  ]
}

module.exports = (ctx:picgo) => {
  const register = () => {
    ctx.helper.uploader.register('rclone', {
      config,
      handle,
      name: "rclone插件"
    })
  }

  return {
    register
  }
}