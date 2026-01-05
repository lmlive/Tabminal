#!/bin/bash

# Tabminal 启动脚本 (Linux x86)
# 后台运行 Tabminal 服务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BINARY="${PROJECT_DIR}/dist/tabminal-linux-x64"
PID_FILE="${PROJECT_DIR}/tabminal.pid"
LOG_FILE="${PROJECT_DIR}/tabminal.log"

DEFAULT_HOST="0.0.0.0"
DEFAULT_PORT="5566"
DEFAULT_PASSWORD="123456"

if [ ! -f "$BINARY" ]; then
    echo "错误: 找不到二进制文件 $BINARY"
    echo "请先编译二进制文件: npm run build:binary:linux"
    exit 1
fi

if [ ! -x "$BINARY" ]; then
    echo "错误: 二进制文件没有执行权限"
    echo "运行: chmod +x $BINARY"
    exit 1
fi

case "$1" in
    start)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "Tabminal 已经在运行 (PID: $PID)"
                exit 0
            else
                echo "发现陈旧的 PID 文件，移除..."
                rm -f "$PID_FILE"
            fi
        fi

        echo "启动 Tabminal..."
        echo "主机: $DEFAULT_HOST"
        echo "端口: $DEFAULT_PORT"
        echo "密码: $DEFAULT_PASSWORD"

        nohup "$BINARY" -h "$DEFAULT_HOST" -p "$DEFAULT_PORT" -a "$DEFAULT_PASSWORD" -y >> "$LOG_FILE" 2>&1 &
        PID=$!

        echo $PID > "$PID_FILE"
        sleep 2

        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Tabminal 已启动 (PID: $PID)"
            echo "日志文件: $LOG_FILE"
            echo "访问地址: http://$DEFAULT_HOST:$DEFAULT_PORT"
        else
            echo "启动失败，请查看日志: $LOG_FILE"
            rm -f "$PID_FILE"
            exit 1
        fi
        ;;

    stop)
        if [ ! -f "$PID_FILE" ]; then
            echo "Tabminal 没有在运行"
            exit 0
        fi

        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "停止 Tabminal (PID: $PID)..."
            kill -TERM "$PID"
            sleep 2

            if ps -p "$PID" > /dev/null 2>&1; then
                echo "强制停止..."
                kill -KILL "$PID"
                sleep 1
            fi

            rm -f "$PID_FILE"
            echo "Tabminal 已停止"
        else
            echo "进程不存在，移除 PID 文件"
            rm -f "$PID_FILE"
        fi
        ;;

    restart)
        echo "重启 Tabminal..."
        $0 stop
        sleep 2
        $0 start
        ;;

    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "Tabminal 正在运行 (PID: $PID)"
                netstat -tlnp 2>/dev/null | grep ":$DEFAULT_PORT " || ss -tlnp 2>/dev/null | grep ":$DEFAULT_PORT "
                exit 0
            else
                echo "PID 文件存在但进程未运行"
                exit 1
            fi
        else
            echo "Tabminal 没有在运行"
            exit 1
        fi
        ;;

    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "日志文件不存在: $LOG_FILE"
            exit 1
        fi
        ;;

    *)
        echo "Tabminal 管理脚本"
        echo ""
        echo "用法: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "命令:"
        echo "  start    - 启动 Tabminal 服务（后台运行）"
        echo "  stop     - 停止 Tabminal 服务"
        echo "  restart  - 重启 Tabminal 服务"
        echo "  status   - 查看服务状态"
        echo "  logs     - 查看实时日志"
        echo ""
        echo "默认配置:"
        echo "  主机: $DEFAULT_HOST"
        echo "  端口: $DEFAULT_PORT"
        echo "  密码: $DEFAULT_PASSWORD"
        echo ""
        echo "示例:"
        echo "  $0 start   # 启动服务"
        echo "  $0 stop    # 停止服务"
        echo "  $0 logs    # 查看日志"
        exit 1
        ;;
esac
