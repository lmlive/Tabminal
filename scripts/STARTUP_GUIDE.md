# Tabminal Linux x86 启动脚本

## 快速开始

### 方式1: 使用启动脚本（推荐）

```bash
# 启动服务
./scripts/start.sh start

# 查看状态
./scripts/start.sh status

# 查看日志
./scripts/start.sh logs

# 停止服务
./scripts/start.sh stop

# 重启服务
./scripts/start.sh restart
```

### 方式2: 使用 systemd 服务（系统服务）

#### 安装服务

```bash
# 复制服务文件
sudo cp scripts/tabminal.service /etc/systemd/system/

# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start tabminal

# 设置开机自启
sudo systemctl enable tabminal
```

#### 管理服务

```bash
# 查看状态
sudo systemctl status tabminal

# 查看日志
sudo journalctl -u tabminal -f

# 停止服务
sudo systemctl stop tabminal

# 重启服务
sudo systemctl restart tabminal
```

### 方式3: 直接运行

```bash
# 后台运行
nohup ./dist/tabminal-linux-x64 -h 0.0.0.0 -p 5566 -a 123456 -y > tabminal.log 2>&1 &

# 查看进程
ps aux | grep tabminal

# 停止进程
kill $(cat tabminal.pid)
```

## 默认配置

- **主机**: 0.0.0.0（所有网络接口）
- **端口**: 5566
- **密码**: 123456

## 访问地址

启动后，在浏览器中访问:

```
http://localhost:5566
```

或通过局域网访问:

```
http://<your-ip>:5566
```

## 注意事项

1. **安全性**：生产环境请修改默认密码
2. **防火墙**：确保端口 5566 已开放
3. **日志**：日志文件位于项目根目录 `tabminal.log`

## 故障排查

### 检查端口占用

```bash
netstat -tlnp | grep 5566
# 或
ss -tlnp | grep 5566
```

### 检查进程

```bash
ps aux | grep tabminal
```

### 查看详细日志

```bash
# 使用启动脚本
./scripts/start.sh logs

# 或直接查看
tail -f tabminal.log
```

### 停止所有进程

```bash
# 查找并停止所有 tabminal 进程
pkill -f tabminal-linux-x64
```

## 配置文件

如需自定义配置，可编辑 `~/.tabminal/config.json`:

```json
{
  "host": "0.0.0.0",
  "port": 5566,
  "password": "your-custom-password"
}
```

## 卸载

### 使用启动脚本

```bash
./scripts/start.sh stop
rm scripts/start.sh
```

### 使用 systemd

```bash
# 停止服务
sudo systemctl stop tabminal

# 禁用开机自启
sudo systemctl disable tabminal

# 删除服务文件
sudo rm /etc/systemd/system/tabminal.service

# 重新加载
sudo systemctl daemon-reload
```
