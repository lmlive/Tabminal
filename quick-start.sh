#!/bin/bash

# 快速启动脚本

echo "=== Tabminal 快速启动 ==="
echo ""

# 检查二进制文件
if [ ! -f "./dist/tabminal-linux-x64" ]; then
    echo "❌ 找不到二进制文件，正在编译..."
    npm run build:binary:linux
fi

# 启动服务
echo "🚀 启动 Tabminal..."
echo "📍 主机: 0.0.0.0"
echo "🔌 端口: 5566"
echo "🔑 密码: 123456"
echo ""

./scripts/start.sh start
echo ""
echo "✅ 启动完成！"
echo ""
echo "📝 常用命令:"
echo "  ./scripts/start.sh status  # 查看状态"
echo "  ./scripts/start.sh logs    # 查看日志"
echo "  ./scripts/start.sh stop    # 停止服务"
echo ""
echo "🌐 访问地址: http://localhost:5566"
