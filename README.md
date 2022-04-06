# picgo-plugin-rclone
调用rclone命令实现上传
用户配置：
1.默认先在rclone 进行相关选项配置，完成后
2.1.存储桶名remoteName（默认不带：）只是存储桶
2.2.上传前缀prefix（默认picgo）
2.3.备份存储点

feature：sync 单向复制
将上传的对应文件夹直接sync到Path2 文件夹中
创建新文件夹默认来自上传picgo的图片，如执行rclone sync picgo.png storj:static/picgo/ 命令
