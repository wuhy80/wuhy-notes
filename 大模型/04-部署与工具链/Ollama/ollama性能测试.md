---
🌻日期🌻: 2025-05-20
🌙星期🌙: 星期二
⌚️时间⌚️: 10:14:19
tags: 
---
执行命令
```shell
python stress_test.py --config config.yaml --host http://192.0.2.11:11434
```
配置文件
```yaml
# config.yaml
qwq:latest: 5
qwen3:32b: 5
```

代码片段
```python
import aiohttp
import asyncio
import random
import time
import json
from datetime import datetime
import argparse
from typing import Dict, List, Optional 
import pandas as pd
from tabulate import tabulate
import yaml
import sys
from collections import defaultdict

TEST_PROMPTS = [
    "请帮我分析成本业务,指标【天然气】，起止时间【2025-05-14~2025-05-14】，维度【产线 :全厂】 异常原因；请从【维度钻取】等方面分析",
    "请帮我分析成本业务,指标【天然气】，起止时间【2025-05-10~2025-05-14】，维度【产线 :全厂】 异常原因；请从【时间趋势】等方面分析",
    "请帮我分析成本业务,指标【钾长石】，起止时间【2025-05-04~2025-05-14】，维度【产线 :全厂】 异常原因；请从【关联关系】等方面分析",
    "请帮我分析成本业务,指标【天然气】，起止时间【2025-05-01~2025-05-14】，维度【产线 :全厂】 异常原因；请从【同比环比】等方面分析",
    "请帮我分析成本业务,指标【钾长石】，起止时间【2025-05-15~2025-05-15】，维度【产线 :全厂】 异常原因；请从【关联关系，维度钻取，时间趋势，同比环比】等方面分析，并以结论性文字内容返回。"
]

class ChatSession:
    def __init__(self, chat_id: int, model: str, prompt: str):
        self.chat_id = chat_id
        self.model = model
        self.prompt = prompt
        self.start_time = time.time()
        self.first_token_time: Optional[float] = None 
        self.complete_response = ""
        self.buffer = "" 
        self.last_update_time = time.time() 
        self.token_times: List[float] = []  
        self.total_tokens = 0 
        self.token_speeds: List[float] = []  

    def format_prefix(self) -> str:
        return f"[{self.chat_id}-{self.model}]"

    def add_token(self, token_text: str, timestamp: float): 
        if not self.first_token_time:
            self.first_token_time = timestamp

        self.token_times.append(timestamp)
        char_count = len(token_text)
        self.total_tokens += char_count
        self.complete_response += token_text

        if len(self.token_times) > 1: 
            time_diff = timestamp - self.token_times[-2]
            if time_diff > 0:
                self.token_speeds.append(char_count / time_diff)
            elif char_count > 0 : 
                self.token_speeds.append(float('inf')) 
        elif char_count > 0 and (timestamp - self.start_time) > 0:
             pass

    @property
    def first_token_latency(self) -> Optional[float]:
        if self.first_token_time:
            return self.first_token_time - self.start_time
        return None

    @property
    def average_token_speed(self) -> float: 
        if not self.token_speeds:
            return 0.0
        valid_speeds = [s for s in self.token_speeds if s != float('inf')]
        if not valid_speeds:
            return 0.0 
        return sum(valid_speeds) / len(valid_speeds)

    @property
    def peak_token_speed(self) -> float:
        return max(self.token_speeds) if self.token_speeds else 0.0

    @property
    def total_session_time(self) -> float: 
        if not self.token_times: 
            return time.time() - self.start_time 
        return self.token_times[-1] - self.start_time

    def get_performance_stats(self) -> Dict[str, any]:
        session_time = self.total_session_time
        return {
            'first_token_latency': self.first_token_latency,
            'average_token_speed': self.average_token_speed, 
            'peak_token_speed': self.peak_token_speed,
            'total_tokens': self.total_tokens, 
            'total_session_time': session_time,
            'overall_tokens_per_second': self.total_tokens / session_time if session_time > 0 else 0.0
        }

class OllamaParallelTest:
    def __init__(self, host: str, model_configs: Dict[str, int]):
        self.host = host
        self.model_configs = model_configs
        self.sessions: Dict[int, ChatSession] = {}
        self.current_output_batch: Dict[int, str] = {}
        self.last_global_output_time = time.time() 
        self.lock = asyncio.Lock()
        self.client_session: Optional[aiohttp.ClientSession] = None

    async def _get_or_create_client_session(self):
        if self.client_session is None or self.client_session.closed:
            self.client_session = aiohttp.ClientSession()
        return self.client_session

    async def close_client_session(self):
        if self.client_session and not self.client_session.closed:
            await self.client_session.close()
            self.client_session = None

    async def stream_chat(self, chat_id: int, model: str):
        prompt = random.choice(TEST_PROMPTS)
        session = ChatSession(chat_id, model, prompt)
        async with self.lock: 
            self.sessions[chat_id] = session

        client = await self._get_or_create_client_session()

        try:
            async with client.post(
                f"{self.host}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": True
                }
            ) as response:
                response.raise_for_status() 
                async for line in response.content:
                    if line:
                        data = json.loads(line.decode('utf-8')) 
                        response_text = data.get('response', '')
                        current_time = time.time()

                        session.add_token(response_text, current_time)
                        session.buffer += response_text 

                        if current_time - session.last_update_time >= 1.0 and session.buffer:
                            async with self.lock:
                                self.current_output_batch[chat_id] = f"{session.format_prefix()} {session.buffer}"
                                await self.output_batched_messages()
                            session.buffer = "" 
                            session.last_update_time = current_time

                        if data.get('done', False):
                            async with self.lock:
                                if session.buffer: 
                                    self.current_output_batch[chat_id] = f"{session.format_prefix()} {session.buffer}"
                                    session.buffer = ""
                                await self.output_batched_messages(force=True)
                            break
        except aiohttp.ClientError as e: 
            print(f"\n[Error] Chat {chat_id} (aiohttp): {str(e)}", flush=True)
            session.complete_response = f"Error: {str(e)}"
        except json.JSONDecodeError as e:
            print(f"\n[Error] Chat {chat_id} (JSON Decode): {str(e)} on line: {line}", flush=True)
            session.complete_response = f"Error: JSONDecodeError - {str(e)}"
        except Exception as e:
            print(f"\n[Error] Chat {chat_id} (General): {type(e).__name__} - {str(e)}", flush=True)
            session.complete_response = f"Error: {type(e).__name__} - {str(e)}"

    async def output_batched_messages(self, force: bool = False):
        """输出当前批次中所有缓冲的消息，并去除内容中的换行符"""
        current_time = time.time()
        # 这个方法通常在 stream_chat 中的锁内部被调用

        if force or (current_time - self.last_global_output_time >= 1.0 and self.current_output_batch):
            if not self.current_output_batch: 
                if force: 
                     self.last_global_output_time = current_time
                return

            print(f"\n----- {datetime.now().strftime('%H:%M:%S')} -----", end='', flush=True)

            sorted_messages = sorted(self.current_output_batch.items(), key=lambda x: x[0])
            for _, original_message_content in sorted_messages: 
                if original_message_content.strip(): 
                    # 将所有空白（包括换行符）替换为单个空格，并移除首尾空白
                    concise_message = ' '.join(original_message_content.split())
                    
                    # f-string 中的 \n 是为了让每个chat_id的更新在新的一行开始（相对于前一个chat_id的更新）
                    # 用户要求的是去除 message_content 内部的换行符
                    print(f"\n{concise_message}", end='', flush=True)

            self.current_output_batch.clear()
            self.last_global_output_time = current_time
            sys.stdout.flush() 

    def print_complete_conversations(self):
        print("\n\n=== Complete Conversation Records ===")
        for chat_id, session in sorted(self.sessions.items()):
            print(f"\nChat ID: {chat_id}")
            print(f"Model: {session.model}")
            print(f"Prompt: {session.prompt}")
            print(f"Response ({session.total_tokens} chars):")
            print(session.complete_response) # 完整对话保留原始换行符
            print("-" * 80)

    def print_performance_metrics(self):
        print("\n=== Performance Metrics ===")
        model_metrics_collector = defaultdict(list)
        for session in self.sessions.values():
            stats = session.get_performance_stats()
            model_metrics_collector[session.model].append(stats)

        for model, metrics_list in model_metrics_collector.items():
            print(f"\nModel: {model} ({len(metrics_list)} sessions)")
            if not metrics_list:
                print("  No performance data collected for this model.")
                continue

            first_token_latencies = [m['first_token_latency'] for m in metrics_list if m['first_token_latency'] is not None]
            if first_token_latencies:
                print(f"  First Token Latency (s):")
                print(f"    Average: {sum(first_token_latencies)/len(first_token_latencies):.3f}")
                print(f"    Min: {min(first_token_latencies):.3f}")
                print(f"    Max: {max(first_token_latencies):.3f}")
            else:
                print("  First Token Latency (s): N/A (no successful first tokens)")

            overall_tps_list = [m['overall_tokens_per_second'] for m in metrics_list if m['total_session_time'] > 0]
            if overall_tps_list:
                print(f"  Overall Session Speed (chars/s):")
                print(f"    Average: {sum(overall_tps_list)/len(overall_tps_list):.2f}")
                print(f"    Min: {min(overall_tps_list):.2f}")
                print(f"    Max: {max(overall_tps_list):.2f}")

            avg_chunk_speeds = [m['average_token_speed'] for m in metrics_list if m['total_tokens'] > 0]
            peak_chunk_speeds = [m['peak_token_speed'] for m in metrics_list if m['total_tokens'] > 0]
            if avg_chunk_speeds:
                print(f"  Chunk-based Speed (chars/s):")
                print(f"    Average of session average chunk speeds: {sum(avg_chunk_speeds)/len(avg_chunk_speeds):.2f}")
            if peak_chunk_speeds:
                 print(f"    Max of session peak chunk speeds: {max(peak_chunk_speeds):.2f}")

            total_chars_model = sum(m['total_tokens'] for m in metrics_list)
            model_start_times = [s.start_time for s_id, s in self.sessions.items() if s.model == model]
            model_end_times = []
            for m_stat in metrics_list:
                 for s in self.sessions.values():
                      if s.model == model and s.get_performance_stats()['total_tokens'] == m_stat['total_tokens']: 
                           if s.token_times: 
                                model_end_times.append(s.token_times[-1])
                           elif s.first_token_time: 
                                model_end_times.append(s.first_token_time)
                           else: 
                                model_end_times.append(s.start_time + m_stat['total_session_time']) 
                           break
            if model_start_times and model_end_times:
                effective_model_batch_time = max(model_end_times) - min(model_start_times)
                if effective_model_batch_time > 0:
                    print(f"  Aggregated Throughput for '{model}' batch:")
                    print(f"    Total Chars: {total_chars_model}")
                    print(f"    Effective Batch Time: {effective_model_batch_time:.2f}s")
                    print(f"    Throughput: {total_chars_model/effective_model_batch_time:.2f} chars/s")
            
            print("\n  Per-Session Statistics:")
            for i, m_stat in enumerate(metrics_list):
                ftl_str = f"{m_stat['first_token_latency']:.3f}s" if m_stat['first_token_latency'] is not None else "N/A"
                print(f"    Session {i+1}: FT: {ftl_str}, AvgChunkSpeed: {m_stat['average_token_speed']:.2f} chars/s, PeakChunkSpeed: {m_stat['peak_token_speed']:.2f} chars/s, TotalChars: {m_stat['total_tokens']}, OverallTPS: {m_stat['overall_tokens_per_second']:.2f} chars/s, Time: {m_stat['total_session_time']:.2f}s")

    async def run_parallel_test(self):
        tasks = []
        chat_id_counter = 0
        for model, count in self.model_configs.items():
            for _ in range(count):
                tasks.append(self.stream_chat(chat_id_counter, model))
                chat_id_counter += 1
        
        print(f"Starting {len(tasks)} chat sessions in parallel...\n")
        try:
            await asyncio.gather(*tasks)
        finally:
            async with self.lock: # Ensure lock is acquired for final forced output
                await self.output_batched_messages(force=True)
            await self.close_client_session()

        if not self.sessions:
            print("No sessions were completed or recorded.")
            return

        self.print_complete_conversations()
        self.print_performance_metrics()
        self.print_summary()

    def print_summary(self):
        print("\n=== Test Summary ===")
        summary_data = []
        model_data_collector = defaultdict(lambda: {"success_count": 0, "total_time_sum": 0.0, "sessions_with_time": 0, "total_count": 0})

        for session in self.sessions.values():
            collector = model_data_collector[session.model]
            collector['total_count'] += 1
            if not session.complete_response.startswith("Error:"):
                collector['success_count'] += 1
            
            stats = session.get_performance_stats() 
            session_time = stats['total_session_time']
            if session_time is not None and session_time > 0: 
                collector['total_time_sum'] += session_time
                collector['sessions_with_time'] += 1
        
        if not model_data_collector:
            print("No session data to summarize.")
            return

        for model, data in model_data_collector.items():
            avg_time = data['total_time_sum'] / data['sessions_with_time'] if data['sessions_with_time'] > 0 else 0.0
            summary_data.append({
                "Model": model,
                "Success/Total": f"{data['success_count']}/{data['total_count']}",
                "Avg Session Time (s)": f"{avg_time:.2f}",
                "Concurrent Chats Configured": self.model_configs.get(model, 0)
            })

        if not summary_data:
            print("No data to tabulate for summary.")
            return

        df = pd.DataFrame(summary_data)
        print(tabulate(df, headers='keys', tablefmt='grid', showindex=False))

def parse_config(config_file: str) -> Dict[str, int]:
    with open(config_file, 'r', encoding='utf-8') as f: 
        return yaml.safe_load(f)

def main():
    parser = argparse.ArgumentParser(description='Ollama Parallel Stream Test')
    parser.add_argument('--host', default='http://localhost:11434', help='Ollama API host (default: http://localhost:11434)')
    parser.add_argument('--config', required=True, help='Path to YAML configuration file defining models and concurrency count')
    
    args = parser.parse_args()
    
    try:
        model_configs = parse_config(args.config)
        if not model_configs or not isinstance(model_configs, dict):
            print("Error: Configuration file is empty or not in expected format (model: count).")
            sys.exit(1)
        for model, count in model_configs.items():
            if not isinstance(model, str) or not isinstance(count, int) or count <=0:
                print(f"Error: Invalid configuration for model '{model}'. Count must be a positive integer.")
                sys.exit(1)
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {args.config}")
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML configuration file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred during config parsing: {e}")
        sys.exit(1)

    test = OllamaParallelTest(args.host, model_configs)
    print(f"Starting parallel stream test against Ollama host: {args.host}")
    print(f"Test Configuration (Model: Concurrent Sessions): {model_configs}\n")
    
    asyncio.run(test.run_parallel_test())

if __name__ == "__main__":
    main()
```

测试结果文件
![[ollama性能测试结果.txt]]