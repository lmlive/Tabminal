# Tabminal Linux x86 启动指南

## 🚀 快速启动（推荐）

```bash
# 一键启动（自动编译并启动）
./quick-start.sh
```

## 📋 启动脚本方式

```bash
# 启动服务
./scripts/start.sh start

# 查看状态
./scripts/start.sh status

# 查看实时日志
./scripts/start.sh logs

# 停止服务
./scripts/start.sh stop

# 重启服务
./scripts/start.sh restart
```

## 🔧 systemd 服务方式

### 安装服务

```bash
sudo cp scripts/tabminal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tabminal
sudo systemctl start tabminal
```

### 管理服务

```bash
sudo systemctl status tabminal   # 查看状态
sudo journalctl -u tabminal -f  # 查看日志
sudo systemctl stop tabminal     # 停止
sudo systemctl restart tabminal  # 重启
```

## 🌐 访问地址

启动后访问: **http://localhost:5566**

或从其他设备: **http://<服务器IP>:5566**

## ⚙️ 默认配置

| 参数 | 值 |
|------|-----|
| 主机 | 0.0.0.0 |
| 端口 | 5566 |
| 密码 | 123456 |

## 📝 自定义配置

创建 `~/.tabminal/config.json`:

```json
{
  "host": "0.0.0.0",
  "port": 5566,
  "password": "your-password"
}
```

## 🔍 故障排查

```bash
# 检查端口占用
netstat -tlnp | grep 5566

# 查看进程
ps aux | grep tabminal

# 查看日志
tail -f tabminal.log

# 强制停止
pkill -f tabminal-linux-x64
```

## 📚 详细文档

查看完整文档: [scripts/STARTUP_GUIDE.md](scripts/STARTUP_GUIDE.md)
