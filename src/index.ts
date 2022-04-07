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
    localPostion: string
    backupName1: string
    backupName2: string
    backupName3: string
    //backupBucketName: string
    //backupPrefix: string
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
    const rcloneLocalPosition = userConfig.localPostion + "/" + userConfig.remoteBucketName + '/' +userConfig.remotePrefix + '/' + fPath
    const rcloneBackupURL1 = userConfig.backupName1 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
    const rcloneBackupURL2 = userConfig.backupName2 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
    const rcloneBackupURL3 = userConfig.backupName3 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
    if(checkRemoteExist(userConfig.remoteName)){
      console.log(rcloneLocalURI,rcloneRemoteURL)
      console.log(rcloneLocalPosition)

      // ready to try catch
      var up = execFileSyncfunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneRemoteURL])
      console.log(`rclone stdout is remote:\n ${up}\n`)
      if(userConfig.localPostion){
        var localup = execFileSyncfunc("rclone", ["sync", "-P" , rcloneLocalURI, rcloneLocalPosition])
        console.log(rcloneLocalURI,rcloneLocalPosition)
        console.log(`rclone stdout local000:\n ${localup}\n`)
      }
      if(checkRemoteExist(userConfig.backupName1)){
        var up1 = execFileSyncfunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneBackupURL1])
        console.log(`rclone stdout 1111:\n ${up1}\n`)
      }
      if(checkRemoteExist(userConfig.backupName2)){
        var up2 = execFileSyncfunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneBackupURL2])
        console.log(`rclone stdout 2222:\n ${up2}\n`)
      }
      if(checkRemoteExist(userConfig.backupName3)){
        var up3 = execFileSyncfunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneBackupURL3])
        console.log(`rclone stdout 3333:\n ${up3}\n`)
      }
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
    backupName1: '',
    backupName2: '',
    backupName3: '',
    localPostion: '',
    //backupBucketName: '',
    //backupPrefix: 'picgo'
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
      name: 'backupName1',
      type: 'input',
      default: userConfig.backupName1,
      required: false,
      message: '备份远程源名1',
      alias: 'source remote points/远程源名'
    },
    {
      name: 'backupName2',
      type: 'input',
      default: userConfig.backupName2,
      required: false,
      message: '备份远程源名2',
      alias: 'source remote points/远程源名'
    },
    {
      name: 'bucketName3',
      type: 'input',
      default: userConfig.backupName3,
      required: false,
      message: '备份远程源名3',
      alias: 'source remote points/远程源名'
    },
    {
      name: 'localPostion',
      type: 'input',
      default: userConfig.localPostion,
      required: false,
      message: '本地备份文件夹名称',
      alias: '本地备份文件夹名称'
    },
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