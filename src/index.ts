import picgo from 'picgo'
import { formatPath,execFileSyncfunc,checkRemoteExist,execFilefunc,backupInLocalSync} from './utils'
import {execFile,execFileSync} from "child_process"
import * as fs from 'fs'
import path from  'path'
import * as os from 'os'
import { emit } from 'process'

interface rcloneConfig{
    remoteName: string
    remoteBucketName: string
    remotePrefix: string
    urlPrefix: string   //用来生成URL的前缀，必填，
    uploadPath: string  //上传路径,设定年月日
    localPostion: string //必填
    backupName1: string
    backupName2: string
    backupName3: string

  }
  //返回false或者stdout

function precheck(ctx:picgo){
  var userConfig0: rcloneConfig = ctx.getConfig("picBed.rclone")
  var lloc = os.homedir() + "/.picgo-rclone-local.json"

  var lJson = {
    'remoteName': userConfig0.remoteName,
    'remoteBucketName': userConfig0.remoteBucketName,
    'remotePrefix': userConfig0.remotePrefix,
    'urlPrefix':    userConfig0.urlPrefix,//用来生成URL的前缀，必填，
    'uploadPath':  userConfig0.uploadPath, //上传路径,设定年月日
    'localPostion':  userConfig0.localPostion,//必填
    'backupName1': userConfig0.backupName1,
    'backupName2': userConfig0.backupName2,
    'backupName3': userConfig0.backupName3
  }
  try{
    //var fjson = JSON.parse(fs.readFileSync(lloc,'utf-8'))
    var fjson = fs.readFileSync(lloc,'utf-8')
    if(JSON.stringify(lJson) == fjson){
      console.log("配置没有变更，跳过存储桶检查")
    }
  }catch{
    console.log("配置变更，重新判断存储桶信息")
    fs.writeFileSync(lloc,JSON.stringify(lJson))

    let checkTasks = []
    if(userConfig0.remoteName){
      const promiseRemote = checkRemoteExist(userConfig0.remoteName,userConfig0.remoteBucketName)
      checkTasks.push(promiseRemote)
    }
    if(userConfig0.backupName1){
      const promise1 = checkRemoteExist(userConfig0.backupName1,userConfig0.remoteBucketName)
      checkTasks.push(promise1)
    }
    if(userConfig0.backupName2){
      const promise2 = checkRemoteExist(userConfig0.backupName2,userConfig0.remoteBucketName)
      checkTasks.push(promise2)
    }
    if(userConfig0.backupName3){
      const promise3 = checkRemoteExist(userConfig0.backupName3,userConfig0.remoteBucketName)
      checkTasks.push(promise3)
    }    
    console.log(checkTasks)
    Promise.all(checkTasks).catch((err)=>{ctx.log.error("检查存储名称失败");
    ctx.log.error(err)
    ctx.emit('notification', {
      title: 'rclone上传错误',
      body: '请检查存储桶、远程源名字是否正确',
      text: ''
    })
    throw err
  })
  }
  
}

const handle = async (ctx: picgo)=>{
  let ListExec = []

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
  if(userConfig.localPostion){
    try{fs.mkdirSync(userConfig.localPostion)}
    catch(error){console.log("创建文件夹失败，检查位置是否正确")}
  }

//item 属于IImgInfo类型
// 顺序 idx
// 定义返回值，url，index
//通常上传成功之后要给这个数组里每一项加入imgUrl以及url项。可以参

  let rcloneLocalURI = ""//  路径 返回，同时存储到文件
  for(let index in ctx.output){
    let item = ctx.output[index]
    console.log(item)
    var fPath = formatPath(item,userConfig.uploadPath)
    // 修改成loc路径
    rcloneLocalURI = backupInLocalSync(ctx, os.homedir(), item)
    if(userConfig.remotePrefix){
      var rcloneRemoteDir = userConfig.remoteName + ":" + userConfig.remoteBucketName + '/' +userConfig.remotePrefix + '/' + fPath
      var rcloneLocalPosition = userConfig.localPostion + "/" + userConfig.remoteBucketName + '/' +userConfig.remotePrefix + '/' + fPath
      var rcloneBackupDir1 = userConfig.backupName1 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
      var rcloneBackupDir2 = userConfig.backupName2 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
      var rcloneBackupDir3 = userConfig.backupName3 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
    }else{
    var rcloneRemoteDir = userConfig.remoteName + ":" + userConfig.remoteBucketName +   '/' + fPath
    var rcloneLocalPosition = userConfig.localPostion + "/" + userConfig.remoteBucketName +  '/' + fPath
    var rcloneBackupDir1 = userConfig.backupName1 + ":" + userConfig.remoteBucketName +   "/" + fPath
    var rcloneBackupDir2 = userConfig.backupName2 + ":" + userConfig.remoteBucketName +   "/" + fPath
    var rcloneBackupDir3 = userConfig.backupName3 + ":" + userConfig.remoteBucketName +   "/" + fPath
    }
    console.log(userConfig.localPostion)
    console.log(rcloneLocalURI)
    await precheck(ctx)

      // 带URL的远程
    var up = execFilefunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneRemoteDir])
    ListExec.push(up)

    if(userConfig.localPostion){
      var lo = execFilefunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneLocalPosition])
      ListExec.push(lo)
    }
    if(userConfig.backupName1){
        var up1 = execFilefunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneBackupDir1])
        ListExec.push(up1)
    }
    if(userConfig.backupName2){
        var up2 = execFilefunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneBackupDir2])
        ListExec.push(up2)
      }
    if(userConfig.backupName3){
        var up3 = execFilefunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneBackupDir3])
        ListExec.push(up3)
      }
 
    await Promise.all(ListExec).then(()=>{
      console.log(item)
    //if (!ctx.output[index].buffer && !ctx.output[index].base64Image) {
    //  ctx.log.error(new Error('undefined image'))
    //}
    if(userConfig.remotePrefix){
      var imgURL= userConfig.remotePrefix + "/" + fPath + "/" + path.basename(rcloneLocalURI)
    }else{
      var imgURL=  fPath + "/" + path.basename(rcloneLocalURI)
    }
      delete item.buffer
      delete item.base64Image
      item.url = `${userConfig.urlPrefix}/${imgURL}`
      item.imgUrl = `${userConfig.urlPrefix}/${imgURL}`
      ctx.output[index]=item
      return ctx
  }).catch((err)=>{
    ctx.log.error('rclone上传发生错误，请检查配置是否正确')
    ctx.log.error(err)
    ctx.emit('notification', {
      title: 'rclone上传错误',
      body: '请检查存储桶、远程源名字是否正确',
      text: ''
    })
    throw err
  }).then(()=>{  fs.unlinkSync(rcloneLocalURI);ctx.log.info(`rcloneLocalURI:${rcloneLocalURI}`);ctx.log.info("已经删除临时文件")}).catch(()=>{console.log("执行rclone 命令失败");ctx.log.info("执行rclone 命令失败")})

}//for

}//handle



const config = (ctx: picgo) => {
  const defaultConfig: rcloneConfig = {
    remoteName: '',
    remoteBucketName: '',
    remotePrefix: '',
    urlPrefix: '',   //用来生成URL的前缀，必填，
    uploadPath: '{year}/{month}/',  //上传路径,设定年月日
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
      message: '您设定的远程存储的名称',
      alias: '远端存储名'
    },
    {
      name: 'remoteBucketName',
      type: 'input',
      default: userConfig.remoteBucketName,
      required: true,
      message: 'BucketName',
      alias: '桶名'
    },      
    {
      name: 'remotePrefix',
      type: 'input',
      default: userConfig.remotePrefix,
      required: false,
      message: '桶下前缀文件夹名',
      alias: '桶下前缀Prefix'
    },
    {
      name: 'urlPrefix',
      type: 'input',
      default: userConfig.urlPrefix,
      message: '根据存储后端设定的域名前缀',
      required: true,
      alias: '域名前缀'
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
      message: '您设定的远程存储的名称(备份位1)',
      alias: '备份存储名1'
    },
    {
      name: 'backupName2',
      type: 'input',
      default: userConfig.backupName2,
      required: false,
      message: '您设定的远程存储的名称(备份位2)',
      alias: '备份存储名2'
    },
    {
      name: 'bucketName3',
      type: 'input',
      default: userConfig.backupName3,
      required: false,
      message: '您设定的远程存储的名称(备份位2)',
      alias: '备份存储名3'
    },
    {
      name: 'localPostion',
      type: 'input',
      default: userConfig.localPostion,
      required: false,
      message: '/home/picgo-rclone or D:\\picgo-rclone',
      alias: '本地备份绝对路径'
    }
  ]
}

module.exports = (ctx:picgo) => {
  const register = () => {
    ctx.helper.uploader.register('rclone', {
      config,
      handle,
      name: "RCLONE"
    })
  }

  return {
    register,
    uploader: 'RCLONE' 
  }
}