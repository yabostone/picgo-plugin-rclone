import picgo from 'picgo'
import { formatPath} from './utils'
import {execFile,execFileSync} from "child_process"
import * as fs from 'fs'
import path from  'path'
import * as os from 'os'

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
function execFilefunc(command:string, args: string[]){
  return new Promise(function(resolve, reject) {
    execFile(command, args, (error, stdout, stderr) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(stdout.trim());
    });
});}


function checkRemoteExistSync(remoteName:string) : boolean{
  try{
    const execProcess = execFileSync('rclone', ['ls',remoteName+':'],{ 'encoding': 'utf8' })
    return true;
  }catch{
    return false;
  }
}

function checkRemoteExist(remoteName:string):Promise<boolean>{
  return new Promise(function(resolve, reject) {
    execFile("rclone", ["ls",remoteName+":"], (error, stdout, stderr) => {
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
function backupInLocal(ctx, imagePath, imgObject):Promise<string>{
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
function backupInLocalSync(ctx, imagePath, imgObject){
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
  if(userConfig.localPostion){
    try{fs.mkdirSync(userConfig.localPostion)}
    catch(error){console.log("创建文件夹失败，检查位置是否正确")}
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

let rcloneLocalURI = ""//  路径 返回，同时存储到文件
  const tasks = output.map((item, index) =>{//这里图片的值需要定义
    var fPath = formatPath(item,userConfig.uploadPath)
    // 修改成loc路径

  //backupInLocal(ctx, os.homedir(), item).then((ret0)=>{
  //  rcloneLocalURI=ret0;
    rcloneLocalURI = backupInLocalSync(ctx, os.homedir(), item)
    const rcloneRemoteDir = userConfig.remoteName + ":" + userConfig.remoteBucketName + '/' +userConfig.remotePrefix + '/' + fPath
    const rcloneLocalPosition = userConfig.localPostion + "/" + userConfig.remoteBucketName + '/' +userConfig.remotePrefix + '/' + fPath
    const rcloneBackupDir1 = userConfig.backupName1 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
    const rcloneBackupDir2 = userConfig.backupName2 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
    const rcloneBackupDir3 = userConfig.backupName3 + ":" + userConfig.remoteBucketName + "/" + userConfig.remotePrefix + "/" + fPath
    console.log(userConfig.localPostion)
    console.log(rcloneLocalURI)
    var checkTasks = []
    if(userConfig.remoteName){
      const promiseRemote = checkRemoteExist(userConfig.remoteName)
      checkTasks.push(promiseRemote)
    }
    if(userConfig.backupName1){
      const promise1 = checkRemoteExist(userConfig.backupName1)
      checkTasks.push(promise1)
    }
    if(userConfig.backupName2){
      const promise2 = checkRemoteExist(userConfig.backupName2)
      checkTasks.push(promise2)
    }
    if(userConfig.backupName3){
      const promise3 = checkRemoteExist(userConfig.backupName3)
      checkTasks.push(promise3)
    }    

    Promise.all(checkTasks).then(()=>{
      // 带URL的远程
      let ListExec = []

      var up = execFilefunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneRemoteDir])

      if(userConfig.localPostion){
        var lo = execFilefunc("rclone" , ['sync', '-P' ,rcloneLocalURI ,rcloneLocalPosition])
        ListExec.push(lo)
      }
      ListExec.push(up)
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
       Promise.all(ListExec).then(()=>{  fs.unlinkSync(rcloneLocalURI)}).catch(()=>{console.log("执行rclone 命令失败")})
  }).catch(()=>{console.log("检查相关remoteName，backupName是否存在，是否正确")})

//})

    return new Promise<mapResult>(async (resolve,reject) => {
      if (!item.buffer && !item.base64Image) {
        reject(new Error('undefined image'))
      }
      let mR = {
        index: index,
        url: userConfig.remotePrefix + "/" + fPath + "/" + path.basename(rcloneLocalURI),
      } as mapResult;
      resolve(mR)
    })
  })//上面是tasks内容，承接后面的tasks


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
  // 完成result后删除buffer，删除文件
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
    remotePrefix: 'rclone',
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
      required: true,
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