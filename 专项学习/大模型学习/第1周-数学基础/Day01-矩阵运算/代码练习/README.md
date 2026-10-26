# Day01 代码练习 - 矩阵运算基础

这个目录包含了今天的Python代码练习，帮助你从代码层面理解向量和矩阵运算。

## 🎯 学习目标

通过代码实践：
- 理解向量的本质（不只是数字列表）
- 掌握矩阵运算的实际操作
- 建立向量和矩阵的几何直觉
- 为神经网络打下基础

---

## 📋 练习清单

### 必做练习（按顺序完成）
- [ ] **练习1**：向量基础操作（15分钟）
- [ ] **练习2**：矩阵创建和索引（10分钟）
- [ ] **练习3**：矩阵乘法手动实现（20分钟）
- [ ] **练习4**：NumPy矩阵运算（15分钟）
- [ ] **练习5**：神经网络中的应用（20分钟）

### 挑战练习（可选）
- [ ] **练习6**：矩阵变换可视化
- [ ] **练习7**：简单神经网络前向传播

---

## 💻 代码片段与讲解

### 🔰 练习1：向量基础操作

**目标**：理解向量不只是列表，而是有几何意义的数学对象

```python
import numpy as np
import matplotlib.pyplot as plt

# ===== 1.1 创建向量 =====
# 向量是一维数组
v1 = np.array([3, 4])
v2 = np.array([1, 2])

print("向量v1:", v1)
print("向量v2:", v2)

# 费曼思考：为什么用np.array而不是普通列表？
# 答：np.array支持向量化运算，更高效，且有几何意义

# ===== 1.2 向量的长度（模） =====
# 几何意义：从原点到该点的距离
length_v1 = np.linalg.norm(v1)
print(f"\n向量v1的长度: {length_v1}")  # √(3²+4²) = 5

# 手动计算验证
length_manual = np.sqrt(v1[0]**2 + v1[1]**2)
print(f"手动计算的长度: {length_manual}")

# 费曼解释：向量[3,4]的长度是5，就像直角三角形的斜边

# ===== 1.3 向量加法 =====
# 几何意义：两个位移的合成
v3 = v1 + v2
print(f"\nv1 + v2 = {v3}")  # [3,4] + [1,2] = [4,6]

# 可视化向量加法
plt.figure(figsize=(8, 6))
plt.quiver(0, 0, v1[0], v1[1], angles='xy', scale_units='xy', scale=1,
           color='r', width=0.006, label='v1=[3,4]')
plt.quiver(0, 0, v2[0], v2[1], angles='xy', scale_units='xy', scale=1,
           color='b', width=0.006, label='v2=[1,2]')
plt.quiver(0, 0, v3[0], v3[1], angles='xy', scale_units='xy', scale=1,
           color='g', width=0.006, label='v1+v2=[4,6]')
plt.xlim(-1, 5)
plt.ylim(-1, 7)
plt.grid(True)
plt.legend()
plt.title('向量加法的几何意义')
plt.xlabel('x轴')
plt.ylabel('y轴')
plt.show()

# ===== 1.4 数乘（缩放） =====
# 几何意义：改变向量的长度，保持方向
v4 = 2 * v1
print(f"\n2 * v1 = {v4}")  # 长度变为原来的2倍

# ===== 1.5 点积（内积） =====
# 几何意义：衡量两个向量的"相似度"
dot_product = np.dot(v1, v2)
print(f"\nv1 · v2 = {dot_product}")  # 3*1 + 4*2 = 11

# 费曼解释：点积越大，两个向量越"接近"（方向相似）

# ===== 练习题 =====
print("\n=== 请完成以下练习 ===")
print("1. 创建向量 v = [5, 0]，计算其长度")
print("2. 计算 v1 和 v1 的点积（自己和自己），结果是什么？与长度平方的关系？")
print("3. 创建一个与v1垂直的向量（提示：点积为0）")
```

**费曼检验**：
- [ ] 能解释为什么 `v1 · v1 = length²`
- [ ] 能说出点积的几何意义

---

### 🔰 练习2：矩阵创建和索引

**目标**：熟悉矩阵的结构和访问方式

```python
import numpy as np

# ===== 2.1 创建矩阵 =====

# 方法1：从列表创建
A = np.array([
    [1, 2, 3],
    [4, 5, 6]
])
print("矩阵A:")
print(A)
print(f"形状: {A.shape}")  # (2, 3) 表示 2行3列

# 方法2：特殊矩阵
zeros = np.zeros((3, 3))    # 全0矩阵
ones = np.ones((2, 4))      # 全1矩阵
eye = np.eye(3)             # 单位矩阵（对角线为1）
rand = np.random.randn(2, 3)  # 随机矩阵

print("\n单位矩阵（Identity Matrix）:")
print(eye)
# 费曼解释：单位矩阵就像数字中的"1"，任何矩阵乘以它都不变

# ===== 2.2 矩阵索引 =====
print("\n=== 矩阵索引 ===")
print(f"A[0, 0] = {A[0, 0]}")  # 第1行第1列
print(f"A[1, 2] = {A[1, 2]}")  # 第2行第3列

# 获取一整行
print(f"第1行: {A[0, :]}")  # [1, 2, 3]

# 获取一整列
print(f"第2列: {A[:, 1]}")  # [2, 5]

# ===== 2.3 矩阵转置 =====
# 几何意义：沿对角线翻转
A_T = A.T
print("\nA的转置:")
print(A_T)
print(f"原形状: {A.shape}, 转置后: {A_T.shape}")

# 费曼解释：转置就是把行变成列，列变成行

# ===== 练习题 =====
print("\n=== 请完成以下练习 ===")
print("1. 创建一个3x3矩阵，对角线是[1,2,3]，其他为0")
print("2. 提取上面矩阵的第2列")
print("3. 创建一个2x3的随机矩阵，然后转置它")
```

**费曼检验**：
- [ ] 能解释矩阵的形状 (m, n) 的含义
- [ ] 能说出单位矩阵的作用

---

### 🔰 练习3：矩阵乘法手动实现

**目标**：深入理解矩阵乘法的计算过程和几何意义

```python
import numpy as np

# ===== 3.1 理解矩阵乘法的规则 =====

# 矩阵A: 2x3
A = np.array([
    [1, 2, 3],
    [4, 5, 6]
])

# 矩阵B: 3x2
B = np.array([
    [1, 2],
    [3, 4],
    [5, 6]
])

print("矩阵A (2x3):")
print(A)
print("\n矩阵B (3x2):")
print(B)

# ===== 3.2 手动实现矩阵乘法 =====

def matrix_multiply_manual(A, B):
    """
    手动实现矩阵乘法：C = A @ B

    理解要点：
    - A的列数必须等于B的行数
    - 结果C的形状是 (A的行数, B的列数)
    - C[i,j] = A的第i行 · B的第j列（点积）
    """
    m, n = A.shape  # A是m×n
    n2, p = B.shape  # B是n×p

    # 检查维度是否匹配
    if n != n2:
        raise ValueError(f"维度不匹配: A是{m}x{n}, B是{n2}x{p}")

    # 创建结果矩阵 C (m×p)
    C = np.zeros((m, p))

    # 三层循环（理解矩阵乘法的本质）
    for i in range(m):  # 遍历A的每一行
        for j in range(p):  # 遍历B的每一列
            # C[i,j] = A的第i行与B的第j列的点积
            for k in range(n):
                C[i, j] += A[i, k] * B[k, j]

            # 打印计算过程（帮助理解）
            print(f"C[{i},{j}] = A第{i}行 · B第{j}列 = {C[i,j]}")

    return C

# 手动计算
print("\n=== 手动计算过程 ===")
C_manual = matrix_multiply_manual(A, B)
print("\n手动计算结果C:")
print(C_manual)

# 使用NumPy验证
C_numpy = A @ B  # 或者 np.dot(A, B)
print("\nNumPy计算结果:")
print(C_numpy)

# 验证是否相同
print(f"\n结果是否一致: {np.allclose(C_manual, C_numpy)}")

# ===== 3.3 矩阵乘法的几何意义 =====

# 例子：矩阵变换向量
print("\n=== 矩阵作为变换 ===")

# 旋转矩阵（逆时针旋转90度）
R = np.array([
    [0, -1],
    [1,  0]
])

# 原向量
v = np.array([3, 4])
print(f"原向量: {v}")

# 变换后的向量
v_transformed = R @ v
print(f"旋转90度后: {v_transformed}")

# 费曼解释：矩阵R把向量[3,4]变成了[-4,3]
# 这就是逆时针旋转90度的效果！

# ===== 3.4 为什么这样计算？ =====
print("\n=== 费曼式理解：为什么矩阵乘法这样定义？ ===")
print("""
想象矩阵是"变换器"：
1. 向量[x, y]经过矩阵M变换后，变成新向量
2. M的第1列告诉我们：x轴基向量[1,0]变成什么
3. M的第2列告诉我们：y轴基向量[0,1]变成什么
4. 任何向量[x,y]都可以看成 x*[1,0] + y*[0,1]
5. 所以变换后就是 x*(M的第1列) + y*(M的第2列)

这就是为什么矩阵乘法要"行×列"求和！
""")

# ===== 练习题 =====
print("\n=== 请完成以下练习 ===")
print("1. 手算这个乘法（不用代码）: [[1,2],[3,4]] @ [[1],[0]]")
print("2. 用代码验证你的手算结果")
print("3. 创建一个矩阵，能把向量[1,0]变成[2,0]（拉伸2倍）")
```

**费曼检验**：
- [ ] 能用自己的话解释矩阵乘法的计算规则
- [ ] 能解释为什么 A(m×n) @ B(n×p) = C(m×p)
- [ ] 能说出矩阵乘法的几何意义

---

### 🔰 练习4：NumPy矩阵运算进阶

**目标**：掌握实际编程中常用的矩阵运算

```python
import numpy as np

# ===== 4.1 矩阵运算符号 =====

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print("矩阵A:")
print(A)
print("\n矩阵B:")
print(B)

# 逐元素运算（Element-wise）
print("\n=== 逐元素运算 ===")
print("A + B (逐元素加):")
print(A + B)

print("\nA * B (逐元素乘，注意不是矩阵乘法！):")
print(A * B)

# 矩阵乘法
print("\n=== 矩阵乘法 ===")
print("A @ B (矩阵乘法):")
print(A @ B)

print("\nnp.dot(A, B) (也是矩阵乘法):")
print(np.dot(A, B))

# ⚠️ 常见错误：混淆 * 和 @
print("\n⚠️ 注意区分：")
print(f"A * B ≠ A @ B")
print(f"* 是逐元素乘，@ 是矩阵乘法")

# ===== 4.2 广播机制（Broadcasting） =====
print("\n=== 广播机制 ===")

# 矩阵 + 标量
print("A + 10 (每个元素都加10):")
print(A + 10)

# 矩阵 + 向量（沿行广播）
v = np.array([1, 2])
print("\nA + v:")
print(A + v)  # v会广播到每一行

# 费曼解释：广播就是自动"复制"低维数据来匹配高维形状

# ===== 4.3 有用的矩阵操作 =====

# 求和
print("\n=== 矩阵求和 ===")
print(f"所有元素和: {np.sum(A)}")
print(f"每列求和: {np.sum(A, axis=0)}")  # [4, 6]
print(f"每行求和: {np.sum(A, axis=1)}")  # [3, 7]

# 最大值、最小值
print(f"\n最大值: {np.max(A)}")
print(f"最大值的索引: {np.argmax(A)}")

# 均值
print(f"均值: {np.mean(A)}")

# ===== 4.4 实用函数 =====

# Softmax函数（神经网络中常用）
def softmax(x):
    """
    Softmax函数：把一组数字转换为概率分布

    几何意义：
    - 所有输出都在0到1之间
    - 所有输出的和为1
    - 大的值会变得更大（相对）
    """
    exp_x = np.exp(x - np.max(x))  # 减去最大值防止溢出
    return exp_x / np.sum(exp_x)

scores = np.array([2.0, 1.0, 0.1])
probs = softmax(scores)
print(f"\nSoftmax({scores}) = {probs}")
print(f"和为1? {np.sum(probs)}")

# 费曼解释：Softmax就像"归一化"，把分数转换为概率

# ===== 练习题 =====
print("\n=== 请完成以下练习 ===")
print("1. 创建一个3x3随机矩阵，对每一列进行归一化（每列和为1）")
print("2. 实现一个函数，计算两个向量的余弦相似度")
print("3. 用矩阵运算实现：把矩阵A的每一行减去该行的均值")
```

**费曼检验**：
- [ ] 能区分 `*` 和 `@` 的区别
- [ ] 能解释广播机制
- [ ] 能说出Softmax的作用

---

### 🔰 练习5：神经网络中的应用

**目标**：理解矩阵运算在神经网络中的实际应用

```python
import numpy as np

print("=== 简化的神经网络前向传播 ===\n")

# ===== 5.1 问题设定 =====
# 假设我们有3个训练样本，每个样本有4个特征
# 我们要用一个简单的神经网络进行分类

# 输入数据 X: (3样本 × 4特征)
X = np.array([
    [1.0, 2.0, 3.0, 4.0],  # 样本1
    [2.0, 3.0, 4.0, 5.0],  # 样本2
    [3.0, 4.0, 5.0, 6.0]   # 样本3
])

print("输入数据X (3样本×4特征):")
print(X)
print(f"形状: {X.shape}\n")

# ===== 5.2 第一层：全连接层 =====
# 权重矩阵 W1: (4输入 × 3输出神经元)
# 费曼理解：W1的每一列是一个神经元的权重
W1 = np.array([
    [0.1, 0.2, 0.3],  # 第1个特征的权重
    [0.4, 0.5, 0.6],  # 第2个特征的权重
    [0.7, 0.8, 0.9],  # 第3个特征的权重
    [1.0, 1.1, 1.2]   # 第4个特征的权重
])

# 偏置 b1: (3个神经元)
b1 = np.array([0.1, 0.2, 0.3])

print("权重矩阵W1 (4特征×3神经元):")
print(W1)
print(f"形状: {W1.shape}\n")

# 计算：Z1 = X @ W1 + b1
Z1 = X @ W1 + b1  # 广播机制自动处理偏置
print("线性变换 Z1 = X @ W1 + b1:")
print(Z1)
print(f"形状: {Z1.shape}")
print("\n费曼理解：")
print("- X @ W1 进行了矩阵乘法，每个样本和每个神经元的权重做点积")
print("- + b1 给每个神经元加上偏置\n")

# ===== 5.3 激活函数 =====
def relu(x):
    """ReLU激活函数: max(0, x)"""
    return np.maximum(0, x)

A1 = relu(Z1)
print("激活后 A1 = ReLU(Z1):")
print(A1)
print("\n费曼理解：ReLU把负数变为0，保留正数\n")

# ===== 5.4 第二层（输出层） =====
# 假设我们要分类成2类
W2 = np.array([
    [1.0, -1.0],
    [0.5, 0.5],
    [-0.5, 1.0]
])
b2 = np.array([0.0, 0.0])

Z2 = A1 @ W2 + b2
print("输出层 Z2 = A1 @ W2 + b2:")
print(Z2)

# Softmax得到概率
def softmax_batch(X):
    """对批量数据的每一行应用softmax"""
    exp_X = np.exp(X - np.max(X, axis=1, keepdims=True))
    return exp_X / np.sum(exp_X, axis=1, keepdims=True)

probs = softmax_batch(Z2)
print("\nSoftmax后的概率:")
print(probs)
print("\n每行的和（应该都是1）:")
print(np.sum(probs, axis=1))

# ===== 5.5 完整流程总结 =====
print("\n" + "="*50)
print("完整的前向传播流程：")
print("="*50)
print("""
1. 输入层: X (3×4)
            ↓ (矩阵乘法)
2. 第一层: Z1 = X @ W1 + b1 (3×3)
            ↓ (ReLU激活)
3. 激活层: A1 = ReLU(Z1) (3×3)
            ↓ (矩阵乘法)
4. 输出层: Z2 = A1 @ W2 + b2 (3×2)
            ↓ (Softmax)
5. 概率: probs (3×2)

关键点：
- 矩阵乘法实现了"每个样本"与"每个神经元权重"的计算
- 一次矩阵运算就处理了所有样本（批处理）
- 这就是为什么矩阵运算对神经网络如此重要！
""")

# ===== 5.6 可视化权重矩阵 =====
import matplotlib.pyplot as plt

plt.figure(figsize=(12, 4))

plt.subplot(1, 3, 1)
plt.imshow(X, cmap='viridis', aspect='auto')
plt.colorbar()
plt.title('输入数据X (3×4)')
plt.xlabel('特征')
plt.ylabel('样本')

plt.subplot(1, 3, 2)
plt.imshow(W1, cmap='viridis', aspect='auto')
plt.colorbar()
plt.title('权重W1 (4×3)')
plt.xlabel('神经元')
plt.ylabel('输入特征')

plt.subplot(1, 3, 3)
plt.imshow(Z1, cmap='viridis', aspect='auto')
plt.colorbar()
plt.title('输出Z1 (3×3)')
plt.xlabel('神经元')
plt.ylabel('样本')

plt.tight_layout()
plt.show()

# ===== 练习题 =====
print("\n=== 请完成以下练习 ===")
print("1. 修改W1的值，观察对Z1的影响")
print("2. 增加一个训练样本（X变成4×4），重新计算")
print("3. 解释为什么神经网络需要矩阵乘法而不是逐元素乘法")
```

**费曼检验**：
- [ ] 能解释为什么 X @ W 的形状是 (样本数×神经元数)
- [ ] 能说出批处理的优势
- [ ] 能用矩阵运算的角度理解神经网络

---

## 🎓 费曼学习法检验清单

完成所有练习后，检验你的理解：

### 概念理解
- [ ] 能用一句话说明向量和矩阵的区别
- [ ] 能解释为什么矩阵乘法不满足交换律
- [ ] 能说出矩阵乘法的几何意义

### 编程能力
- [ ] 能不看文档写出矩阵乘法代码
- [ ] 能解释 @ 和 * 的区别
- [ ] 能用NumPy实现简单的神经网络层

### 应用理解
- [ ] 能解释神经网络中为什么用矩阵运算
- [ ] 能说出批处理的优势
- [ ] 能设计一个简单的线性分类器

### 终极测试
- [ ] 能给一个完全不懂的人讲清楚“矩阵乘法为什么这样定义”
- [ ] 能画图解释神经网络的前向传播
- [ ] 能回答面试官关于矩阵运算的刁钻问题

---

## 📚 扩展资源

### 推荐阅读
- NumPy官方教程：https://numpy.org/doc/stable/user/quickstart.html
- 3Blue1Brown线性代数系列：https://www.youtube.com/c/3blue1brown

### 进阶练习
- 实现一个完整的两层神经网络
- 用矩阵运算实现图像卷积
- 理解反向传播中的矩阵运算

---

## 💡 学习建议

1. **不要跳过手动实现**：虽然NumPy更快，但手动实现能加深理解
2. **多画图**：可视化是理解几何意义的关键
3. **费曼检验**：每学完一个概念，试着教给别人（或AI）
4. **连接应用**：时刻思考“这在神经网络中怎么用”

---

**创建时间**: 2025-12-27
**预计完成时间**: 1-1.5小时
**难度**: ⭐⭐⭐☆☆
