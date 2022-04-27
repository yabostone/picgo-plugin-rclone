## 插件简介
rclone 插件是一款基于PicGO调用rclone应用实现上传和备份的插件，支持rclone下各种存储后端的**上传**，**备份**和**图床**。同时rclone可以通过命令行实现图床的全量迁移。
目前测试支持
+ 去中心化存储Storj（免费150GB）。（经过计算，Storj在存储小文件时并不划算，15KB的小文件1万个会每月交0.6元，远高于其他存储，说明Storj仅适用于打包的大文件的备份存储，如视频，压缩包等等。）
+ Local（本地备份）
+ 自建存储后端（WEBDAV，HTTP,Seafile)
+ 分布式存储后端（SeaweedFS，Minio）
+ COS，OSS，S3兼容性存储，B2等等


## 功能简介
### 上传
在remote 选项中配置相关信息，默认会将图片上传到指定位置。
**上传功能区（必填）**：
![](https://link.ap1.storjshare.io/raw/jxl7tkgemjfqomuhhv3epaakfcqq/picgo/picgo/2022/04/ed1aa3373bce454f00fc39abee423a8e.png)

### 备份
插件设定了三个备份后端槽，可以同时备份到三个存储后端，只要填写 远端存储名 信息就可以。支持备份到本地,详见：
+ 有三个后端槽，最多支持三处备份，需要rclone配置好远端存储名，测试好并且正常连接。

![](https://link.ap1.storjshare.io/raw/jxl7tkgemjfqomuhhv3epaakfcqq/picgo/picgo/2022/04/d9cb347e859b567f7d608b4cf9b4e1f9.png)

#### 可以构建图床后端的快速迁移，
如网站被D时，切换后端，或者cloudflare使用。

### 图床
图床功能只是拼接了域名前缀和路径地址，可能需要与CDN联动。填写域名前缀，后面和桶名和文件上传路径进行拼接。
+ 如果想确保图床后端更新，不用更新文件URL的话，需要配置CDN域名指向合适的后端。


## 配置方法

### 前置准备
#### 下载rclone
需要下载rclone，安装并且在默认路径下可用。
#### 配置rclone
需要配置rclone的远程源，并确认配置正确:
在系统命令行下输入：
```Bash
rclone version
```
有相关rclone输出信息认为安装成功。

### 配置项解释

#### 远端存储名
对应rclone下remoteName，是使用`rclone config`后自己命名的remoteName，例如这里有三个存储后端，remoteName 分别是 `blog.fengidea.com`,`local`,`storj`。
所以在remoteName/远程源名 处填写`storj`。
![](https://link.ap1.storjshare.io/raw/jxl7tkgemjfqomuhhv3epaakfcqq/picgo/picgo/2022/04/bb515414181ea08841aaf07d48745a59.png)
#### backup
存在三个备份槽，默认不填入，填入后需要确认在rclone config下名称与之一致。
需要填写remoteName、远程源名。

#### LocalPostion
这里填写需要注意：
1. 位置建议应该填写绝对路径
2. 对应路径需要有用户权限，如Linux需要能在对应位置创建文件夹。
3. 参见： `/home/mxuan/`   `D:\mxuan\` 

### rclone config配置
这里给出了几个配置rclone的config项的示例。

网上查找rclone的配置教程，测试成功后再使用插件。。

