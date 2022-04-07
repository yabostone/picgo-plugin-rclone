## 插件简介
rclone 插件是一款基于PicGO调用rclone应用实现上传和备份的插件，支持rclone下各种存储后端的**上传**，**备份**和**图床**。同时rclone可以通过命令行实现图床的全量迁移。
目前测试支持
+ 去中心化存储Storj（免费150GB），Sia（运行均超7年）。
+ Local（本地备份）
+ 自建存储后端（WEBDAV，HTTP,Seafile)
+ 分布式存储后端（SeaweedFS，Minio）
+ COS，OSS，S3兼容性存储，B2等等

## 功能简介
### 上传
在remote 选项中配置相关信息，默认会将图片上传到指定位置。

### 备份
插件设定了三个备份后端槽，可以同时备份到三个存储后端，只要填写remoteName信息就可以。支持备份到本地,详见：


### 图床
图床功能只是拼接了域名前缀和路径地址，可能需要与CDN联动。

像Sia一类的直接生成URL的暂时不可直接用，需要配置CDN才能使用， URL前缀来自各个后端提供商的页面。

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

#### remoteName
对应rclone下remoteName，是使用`rclone config`后自己命名的remoteName，

#### backup
存在三个备份槽，默认不填入，填入后需要确认在rclone config下名称与之一致。

#### LocalPostion
1. 位置建议应该绝对路径
2. 对应路径需要有用户权限，如Linux需要能在对应位置创建文件夹。
3. 参见： `/home/mxuan/`   `D:\mxuan\` 

