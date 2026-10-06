#!/bin/zsh
# 使用脚本所在目录，避免依赖启动时的工作路径。
cd "${0:A:h}"
python3 scripts/preview.py "$@"
