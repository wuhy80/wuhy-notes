---
🌻日期🌻: 2024-06-07
🌙星期🌙: 星期五
⌚️时间⌚️: 16:13:47
tags:
  - 算法/数据结构
  - 算法/树结构
  - 数据库/索引
aliases:
  - B Plus Tree
  - B+Tree
---

# B+ 树

## 概述

B+ 树是一种自平衡的树形数据结构，广泛应用于数据库系统和文件系统中，特别适合处理大规模数据的高效存储和检索。

> [!tip] 可视化演示
> 通过这个交互式工具可以直观理解 B+ 树的操作原理：
> [B+ Tree Visualization](https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html)

![B+树结构示意图](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_2/202406071631850.png)

---

## 优缺点分析

### 优点

#### 1. 高效的搜索性能

| 特性 | 说明 |
|------|------|
| **树的高度较低** | 每个节点可存储多个键值，即使存储大量数据时树高度也相对较小，减少搜索路径长度 |
| **叶子节点链接** | 所有叶子节点通过指针连接成有序链表，使范围查询（range query）非常高效 |

#### 2. 高效的插入和删除性能

- **局部性好**：插入和删除操作只影响局部节点，其他部分不受影响
- **分裂和合并操作**：节点满时进行分裂，键值数过少时进行合并，保持树的平衡性

#### 3. 磁盘 I/O 友好

> [!important] 为什么 B+ 树适合磁盘存储？
> - **节点容量大**：节点通常设计为与磁盘块大小相匹配，每次磁盘 I/O 可读取/写入一个完整节点
> - **顺序访问效率高**：叶子节点按顺序链接，顺序扫描时可充分利用磁盘的顺序读取性能

#### 4. 支持范围查询

- 所有叶子节点形成有序链表，可高效进行范围查询
- 快速定位区间起始和终止位置，然后顺序遍历

#### 5. 数据冗余和可用性高

- **内部节点不存储数据**：只存储键值，可容纳更多键值，提高树的扇出度，降低树的高度

### 缺点

| 缺点 | 说明 |
|------|------|
| **实现复杂性高** | 分裂/合并操作复杂，叶子节点指针维护增加实现难度 |
| **空间利用率可能不高** | 节点不满时浪费空间，叶子节点可能重复存储键值 |
| **内存开销较大** | 需要存储多个子节点指针和叶子节点链表指针 |
| **平衡维护开销** | 频繁的分裂和合并操作增加开销 |

> [!summary] 总结
> B+ 树的优点远大于其缺点，是数据库索引的首选结构。其高效的搜索、插入、删除性能，良好的磁盘 I/O 特性和对范围查询的支持，使其成为非常优秀的树形数据结构。

---

## Golang 实现

### 功能列表

- [x] 插入（Insert）
- [x] 删除（Delete）
- [x] 查找（Search）
- [x] 范围查找（Range Search）
- [x] 遍历（Traversal）
- [x] 分裂节点（Split Node）
- [x] 合并节点（Merge Node）
- [x] 重新分配节点（Redistribute Node）

### 第一步：定义节点结构和树结构

```go
package main

import "fmt"

// BPTreeNode 表示 B+ 树的一个节点
type BPTreeNode struct {
	isLeaf   bool
	keys     []int
	children []*BPTreeNode
	next     *BPTreeNode
}

// BPTree 表示 B+ 树
type BPTree struct {
	root  *BPTreeNode
	order int
}

// NewBPTree 创建一个新的 B+ 树
func NewBPTree(order int) *BPTree {
	return &BPTree{
		root: &BPTreeNode{
			isLeaf:   true,
			keys:     make([]int, 0),
			children: nil,
			next:     nil,
		},
		order: order,
	}
}
```

### 第二步：实现插入操作

```go
// Insert 插入键值
func (tree *BPTree) Insert(key int) {
	root := tree.root
	if len(root.keys) == tree.order-1 {
		newRoot := &BPTreeNode{
			isLeaf:   false,
			keys:     make([]int, 0),
			children: []*BPTreeNode{root},
		}
		tree.splitChild(newRoot, 0, root)
		tree.root = newRoot
	}
	tree.insertNonFull(tree.root, key)
}

// splitChild 分裂子节点
func (tree *BPTree) splitChild(parent *BPTreeNode, index int, node *BPTreeNode) {
	newNode := &BPTreeNode{
		isLeaf:   node.isLeaf,
		keys:     make([]int, 0),
		children: nil,
	}
	t := tree.order / 2

	parent.keys = append(parent.keys, 0)
	copy(parent.keex+1:], parent.keys[index:])
	parent.keys[index] = node.keys[t]

	parent.children = append(parent.children, nil)
	copy(parent.children[index+2:], parent.children[index+1:])
	parent.children[index+1] = newNode

	newNode.keys = append(newNode.keys, node.keys[t+1:]...)
	node.keys = node.keys[:t]

	if !node.isLeaf {
		newNode.children = append(newNode.children, node.children[t+1:]...)
		node.children = node.children[:t+1]
	} else {
		newNode.next = node.next
		node.next = newNode
	}
}

// insertNonFull 插入非满节点
func (tree *BPTree) insertNonFull(node *BPTreeNode, key int) {
	if node.isLeaf {
		node.keys = append(node.keys, 0)
		i := len(node.keys
		for i >= 0 && key < node.keys[i] {
			node.keys[i+1] = node.keys[i]
			i--
		}
		node.keys[i+1] = key
	} else {
		i := len(node.keys) - 1
		for i >= 0 && key < node.keys[i] {
			i--
		}
		i++
		if len(node.children[i].keys) == tree.order-1 {
			tree.splitChild(node, i, node.children[i])
			if key > node.keys[i] {
				i++
			}
		}
		tree.insertNonFull(node.children[i], key)
	}
}
```

### 第三步：实现查找操作

```go
// Search 查找键值
func (tree *BPTree) Search(key int) (*BPTreeNode, int) {
	return search(tree.root, key)
}

// search 查找节点
func search(node *BPTreeNode, key int) (*BPTreeNode, int) {
	i := 0
	for i < len(node.keys) && key > node.keys[i] {
		i++
	}
	if i < len(node.keys) && key == node.keys[i] {
		return node, i
	}
	if node.isLeaf {
		return nil, -1
	}
	return search(node.children[i], key)
}
```

### 第四步：实现删除操作

> [!warning] 注意
> 删除操作相对复杂，需要考虑合并和重新分配节点。以下是基本实现，不考虑复杂的合并和重新分配节点。

```go
// Delete 删除键值
func (tree *BPTree) Delete(key int) {
	tree.delete(tree.root, key)
	if len(tree.root.keys) == 0 && !tree.root.isLeaf {
		tree.root = tree.root.children[0]
	}
}

// delete 删除键值的内部实现
func (tree *BPTree) delete(node *BPTreeNode, key int) {
	i := 0
	for i < len(node.keys) && key > node.keys[i] {
		i++
	}
	if node.isLeaf {
		if i < len(node.keys) && key == node.keys[i] {
			copy(node.keys[i:], node.keys[i+1:])
			node.keys = node.keys[:len(node.keys)-1]
		}
	} else {
		if i < len(node.keys) && key == node.keys[i] {
			if len(node.children[i].keys) >= tree.order/2 {
				node.keys[i] = node.children[i].keys[len(node.children[i].keys)-1]
				tree.delete(node.children[i], node.keys[i])
			} else if len(node.children[i+1].keys) >= tree.order/2 {
				node.keys[i] = node.children[i+1].keys[0]
				tree.delete(node.children[i+1], node.keys[i])
			} else {
				node.keys = append(node.keys[:i], node.keys[i+1:]...)
				node.children[i].keys = append(node.children[i].keys, node.keys[i])
				node.children[i].keys = append(node.children[i].keys, node.children[i+1].keys...)
				node.children[i].children = append(node.children[i].children, node.children[i+1].children...)
				node.children = append(node.children[:i+1], node.children[i+2:]...)
				tree.delete(node.children[i], key)
			}
		} else {
			if len(node.children[i].keys) >= tree.order/2 {
				tree.delete(node.children[i], key)
			} else {
				if i > 0 && len(node.children[i-1].keys) >= tree.order/2 {
					node.children[i].keys = append([]int{node.keys[i-1]}, node.children[i].keys...)
					node.keys[i-1] = node.children[i-1].keys[len(node.children[i-1].keys)-1]
					node.children[i-1].keys = node.children[i-1].keys[:len(node.children[i-1].keys)-1]
					if !node.children[i].isLeaf {
						node.children[i].children = append([]*BPTreeNode{node.children[i-1].children[len(node.children[i-1].children)-1]}, node.children[i].children...)
						node.children[i-1].children = node.children[i-1].children[:len(node.children[i-1].children)-1]
					}
				} else if i < len(node.children)-1 && len(node.children[i+1].keys) >= tree.order/2 {
					node.children[i].keys = append(node.children[i].keys, node.keys[i])
					node.keys[i] = node.children[i+1].keys[0]
					node.children[i+1].keys = node.children[i+1].keys[1:]
					if !node.children[i].isLeaf {
						node.children[i].children = append(node.children[i].children, node.children[i+1].children[0])
						node.children[i+1].children = node.children[i+1].children[1:]
					}
				} else {
					if i < len(node.children)-1 {
						node.children[i].keys = append(node.children[i].keys, node.keys[i])
						node.children[i].keys = append(node.children[i].keys, node.children[i+1].keys...)
						node.children[i].children = append(node.children[i].children, node.children[i+1].children...)
						node.keys = append(node.keys[:i], node.keys[i+1:]...)
						node.children = append(node.children[:i+1], node.children[i+2:]...)
					} else {
						node.children[i-1].keys = append(node.children[i-1].keys, node.keys[i-1])
						node.children[i-1].keys = append(node.children[i-1].keys, node.children[i].keys...)
						node.children[i-1].children = append(node.children[i-1].children, node.children[i].children...)
						node.keys = append(node.keys[:i-1], node.keys[i:]...)
						node.children = append(node.children[:i], node.children[i+1:]...)
					}
					tree.delete(node.children[i], key)
				}
			}
		}
	}
}
```

### 第五步：实现范围查找

```go
// RangeSearch 范围查找
func (tree *BPTree) RangeSearch(start, end {
	return rangeSearch(tree.root, start, end)
}

// rangeSearch 范围查找的内部实现
func rangeSearch(node *BPTreeNode, start, end int) []int {
	var result []int
	i := 0
	for i < len(node.keys) && start > node.keys[i] {
		i++
	}
	if node.isLeaf {
		for i < len(node.keys) && node.keys[i] <= end {
			result = append(result, node.keys[i])
			i++
		}
		if node.keys[i-1] <= end && node.next != nil {
			result = append(result, rangeSearch(node.next, start, end)...)
		}
	} else {
		if i < len(node.keys) && node.keys[i] >= start && node.keys[i] <= end {
			result = append(result, node.keys[i])
		}
		if i < len(node.children) {
			result = append(result, rangeSearch(node.children[i], start, end)...)
		}
	}
	return result
}
```

### 第六步：实现遍历操作

```go
// Traverse 遍历
func (tree *BPTree) Traverse() []int {
	return traverse(tree.root)
}

// traverse 遍历节点
func traverse(node *BPTreeNode) []int {
	var result []int
	if node.isLeaf {
		result = append(result, node.keys...)
		if node.next != nil {
			result = append(result, traverse(node.next)...)
		}
	} else {
		for i := 0; i < len(node.children); i++ {
			result = append(result, traverse(node.children[i])...)
			if i < len(node.keys) {
				result = append(result, node.keys[i])
			}
		}
	}
	return result
}
```

### 使用示例

```go
func main() {
	bptree := NewBPTree(3)

	// 插入数据
	bptree.Insert(10)
	bptree.Insert(20)
	bptree.Insert(5)
	bptree.Insert(6)
	bptree.Insert(12)
	bptree.Insert(30)
	bptree.Insert(7)
	bptree.Insert(17)

	// 查找
	node, index := bptree.Search(6)
	if node != nil {
		fmt.Printf("Found key %d at index %d in node with keys %v\n", 6, index, node.keys)
	} else {
		fmt.Println("Key not found")
	}

	// 删除
	bptree.Delete(6)
	node, index = bptree.Search(6)
	if node != nil {
		fmt.Printf("Found key %d at index %d in node with keys %v\n", 6, index, node.keys)
	} else {
		fmt.Println("Key not found")
	}

	// 范围查找
	rangeKeys := bptree.RangeSearch(5, 17)
	fmt.Printf("Range search result: %v\n", rangeKeys)

	// 遍历
	allKeys := bptree.Traverse()
	fmt.Printf("All keys in B+ Tree: %v\n", allKeys)
}
```

---

## 相关笔记

- [[红黑树]]
- [[技术笔记/数据库/B树：为什么每个数据库都在使用它|B树]]
- AVL 数据库索引
- MySQL 索引原理

## 参考资料

- [B+ Tree Visualization](https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html)
- [Wikipedia - B+ tree](https://en.wikipedia.org/wiki/B%2B_tree)
