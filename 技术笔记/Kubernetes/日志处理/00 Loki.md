---
🌻日期🌻: 2024-05-08
🌙星期🌙: 星期三
⌚️时间⌚️: 14:28:06
tags:
  - kubernetes
  - loki
  - 日志
  - sidecar
  - golang
---

# Loki 日志收集方案

> [!abstract] 概述
> Loki 是 Grafana Labs 推出的日志聚合系统，专为 Kubernetes 环境设计。本文介绍如何通过 Go 代码动态为 Deployment 注入 Loki Sidecar 容器，实现应用日志的自动收集。

## Sidecar 模式简介

> [!info] 什么是 Sidecar 模式？
> Sidecar 是一种设计模式，在主应用容器旁边运行一个辅助容器，用于处理日志收集、监控、代理等横切关注点，而不需要修改主应用代码。

## 动态注入 Loki Sidecar

以下 Go 代码演示如何通过 Kubernetes API 动态为 Deployment 添加日志收集 Sidecar：

```go
package main

import (
	"context"
	"fmt"
	"log"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	// 获取集群内配置
	config, err := rest.InClusterConfig()
	if err != nil {
		log.Fatalf("Failed to get in-cluster config: %v", err)
	}

	// 创建 Kubernetes 客户端
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("Failed to create clientset: %v", err)
	}

	// 获取目标 Deployment
	deployment, err := clientset.AppsV1().Deployments("your-namespace").Get(
		context.TODO(),
		"your-deployment-name",
		metav1.GetOptions{},
	)
	if err != nil {
		log.Fatalf("Failed to get deployment: %v", err)
	}

	// 定义 Sidecar 容器
	sidecar := &corev1.Container{
		Name:  "log-sidecar",
		Image: "your-log-collector-image",
		VolumeMounts: []corev1.VolumeMount{
			{
				Name:      "log-dir",
				MountPath: "/var/log/myapp",
			},
		},
		Env: []corev1.EnvVar{
			{
				Name:  "LOKI_ENDPOINT",
				Value: "http://loki.your-namespace.svc.cluster.local:3100/loki/api/v1/push",
			},
			{
				Name:  "LOG_FORMAT",
				Value: "json",
			},
		},
	}

	// 添加 Sidecar 到 Pod 模板
	// 主应用也必须挂载同一个卷；否则 sidecar 只能读取自己的空目录。
	for i := range deployment.Spec.Template.Spec.Containers {
		deployment.Spec.Template.Spec.Containers[i].VolumeMounts = append(
			deployment.Spec.Template.Spec.Containers[i].VolumeMounts,
			corev1.VolumeMount{Name: "log-dir", MountPath: "/var/log/myapp"},
		)
	}
	deployment.Spec.Template.Spec.Containers = append(
		deployment.Spec.Template.Spec.Containers,
		*sidecar,
	)

	// 定义共享日志卷
	volume := corev1.Volume{
		Name: "log-dir",
		VolumeSource: corev1.VolumeSource{
			EmptyDir: &corev1.EmptyDirVolumeSource{},
		},
	}

	// 添加卷到 Pod 模板
	deployment.Spec.Template.Spec.Volumes = append(
		deployment.Spec.Template.Spec.Volumes,
		volume,
	)

	// 更新 Deployment
	updatedDeployment, err := clientset.AppsV1().Deployments("your-namespace").Update(
		context.TODO(),
		deployment,
		metav1.UpdateOptions{},
	)
	if err != nil {
		log.Fatalf("Failed to update deployment: %v", err)
	}

	fmt.Printf("Deployment %s updated with Sidecar container for log collection\n",
		updatedDeployment.Name)
}
```

## 代码说明

### 关键组件

| 组件 | 说明 |
|------|------|
| `rest.InClusterConfig()` | 获取 Pod 内的集群配置 |
| `kubernetes.NewForConfig()` | 创建 K8S API 客户端 |
| `corev1.Container` | 定义 Sidecar 容器规格 |
| `corev1.Volume` | 定义共享存储卷 |

### 环境变量配置

> [!tip] Sidecar 环境变量
> - `LOKI_ENDPOINT`: Loki 推送 API 地址
> - `LOG_FORMAT`: 日志格式（json/text）

> [!warning] 生产注意
> Sidecar 镜像必须真正实现 Loki Push API（本文中的 `your-log-collector-image` 只是占位符）。直接为每个 Pod 修改 Deployment 还要处理幂等性、RBAC、并发更新和滚动发布；生产环境通常使用 Grafana Alloy/Promtail 等 DaemonSet。Loki 标签应保持低基数，避免把 request ID 等高基数字段作为标签。

### 共享卷机制

```
┌───────────────────────────────────        Pod                     │
│  ┌─────────────┐  ┌──────────────┐  │
│  │  主应用容器  │  │  Sidecar     │  │
│  │             │  │  日志收集器   │  │
│  │  写入日志 ──┼──┼─→ 读取日志   │  │
│  └─────────────┘  └──────────────┘  │
│         │              │             │
│         └──── EmptyDir ─┘            │
│              /var/log/myapp          │
└─────────────────────────────────────┘
```

## 相关链接

- [[Kubernetes常见问题]] - K8S 常见问题
- [[如何进行K8S的备份恢复]] - 备份恢复方案

**返回**: [[Kubernetes]]
