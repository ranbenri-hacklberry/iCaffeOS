#!/bin/bash
pkill -9 -f llama-server
pkill -9 -f proxy_server.py
sync
sleep 2

nohup /home/rani/llama.cpp/build/bin/llama-server -m /home/rani/Qwen3.5-35B-A3B-Q4_K_M.gguf -c 4096 -ngl 99 --port 8001 --host 0.0.0.0 > /home/rani/llama_server.log 2>&1 &
sleep 2

nohup python3 /home/rani/proxy_server.py > /home/rani/proxy.log 2>&1 &
echo 'Services restarted.'
