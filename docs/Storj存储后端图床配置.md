### Storj简介
Storj是一款去中心化的云存储服务，并有150GB免费存储和150G免费流量提供（分成三个存储桶）。
超出免费额度的价格按照月1T/4$,流量1T/7$的方式付费。
(Pay as you go)按量付费。

### 作为存储后端配置
#### 注册Project
![cc4adaebe70e14d22f40ac137cc9070b.png](../../_resources/cc4adaebe70e14d22f40ac137cc9070b.png)
现在只允许注册一个Project，150GB存储
#### 生成助记词
在创建新的账号时候，会要求生成一组12个单词或更多的助记词，这是访问账号的最大权限，等价于私钥。
需要存储记下来
#### 生成APIkey和satellite address
后面的操作需要用uplink cli 注册生成，需要下载安装
在Access 和Access Grant 下。
在第二步，会有 `Continue in CLI` 标识，点击生成
APIKey 和satellite address。
![cfdbf511dadbafb85fb0539adf62811e.png](../../_resources/cfdbf511dadbafb85fb0539adf62811e.png)
![32d7c3a6b142b74f40ab88044fb1ba3f.png](../../_resources/32d7c3a6b142b74f40ab88044fb1ba3f.png)
参见红色图标，上面有三个要填的值，分别是APIKey，satellite address，和passParse，前两个来自上图，而第三个来自初次创建账号生成的助记词。
![f354446de946b5c667b79b7f52ef8538.png](../../_resources/f354446de946b5c667b79b7f52ef8538.png)
#### 生成LinkShare
需要到官网上下载uplink，这是必须的用来获取URL的公开访问链接。

`uplink.exe share sj://picgo/ --readonly=true --url --not-after=none --base-url=https://link.ap1.storjshare.io --auth-service=https://auth.ap1.storjshare.io/`
这里可以配置整个存储桶都是share。
注意服务点需要填写对。
生成有URL值
```
=========== BROWSER URL ==================================================================
REMINDER  : Object key must end in '/' when trying to share recursively
URL       : https://link.ap1.storjshare.io/s/jxl7tkgemjfqomuhhv3epaakfcqq/picgo/
```
将`s` 改为`raw`，域名前缀就可以获取了。
例如 这里的域名前缀是`https://link.ap1.storjshare.io/raw/jxl7tkgemjfqomuhhv3epaakfcqq/picgo/`


