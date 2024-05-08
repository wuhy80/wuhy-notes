---
🌻日期🌻: 2024-05-08
🌙星期🌙: 星期三
⌚️时间⌚️: 14:28:06
tags: loki kubernetes
---

## 如何动态插入 Loki 的 SideCar 配置
```go
package main

import (
	"context"
	"fmt"
	"log"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	config, err := rest.InClusterConfig()
	if err != nil {
		log.Fatalf("Failed to get in-cluster config: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("Failed to create clientset: %v", err)
	}

	// Get the Deployment
	deployment, err := clientset.AppsV1().Deployments("your-namespace").Get(context.TODO(), "your-deployment-name", metav1.GetOptions{})
	if err != nil {
		log.Fatalf("Failed to get deployment: %v", err)
	}

	// Define the Sidecar container for log collection
	sidecar := &corev1.Container{
		Name:  "log-sidecar",
		Image: "your-log-collector-image",

		// Specify the volume mount for the logs
		VolumeMounts: []corev1.VolumeMount{
			{
				Name:      "log-dir",
				MountPath: "/var/log/myapp",
			},
		},

		// Set environment variables if needed
		Env: []corev1.EnvVar{
			{
				Name:  "LOKI_ENDPOINT",
				Value: "http://loki.your-namespace.svc.cluster.local:3100/loki/api/v1/push",
			},
			{
				Name:  "LOG_FORMAT",
				Value: "json", // Or specify the desired log format
			},
		},
	}

	// Add the Sidecar container to the Deployment's Pod template
	deployment.Spec.Template.Spec.Containers = append(deployment.Spec.Template.Spec.Containers, *sidecar)

	// Define the volume that will hold the logs
	volume := corev1.Volume{
		Name: "log-dir",
		VolumeSource: corev1.VolumeSource{
			EmptyDir: &corev1.EmptyDirVolumeSource{},
		},
	}

	// Add the volume to the Deployment's Pod template
	deployment.Spec.Template.Spec.Volumes = append(deployment.Spec.Template.Spec.Volumes, volume)

	// Update the Deployment in the cluster
	updatedDeployment, err := clientset.AppsV1().Deployments("your-namespace").Update(context.TODO(), deployment, metav1.UpdateOptions{})
	if err != nil {
		log.Fatalf("Failed to update deployment: %v", err)
	}

	fmt.Printf("Deployment %s updated with Sidecar container for log collection\n", updatedDeployment.Name)
}
```