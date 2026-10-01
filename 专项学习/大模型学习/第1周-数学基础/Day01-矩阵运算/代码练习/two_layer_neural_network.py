"""
两层神经网络完整实现
===================

目标：从零实现一个两层神经网络，完全理解原理
作者：Claude Code
日期：2025-12-27

网络结构：
    输入层 → 隐藏层(ReLU) → 输出层(Softmax)

学习内容：
1. 前向传播
2. 损失函数计算
3. 反向传播
4. 参数更新
5. 训练循环
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

# 设置中文显示
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False


class TwoLayerNN:
    """
    两层神经网络类

    费曼理解：
    - 这个类就像一个"可以学习的数学函数"
    - 输入是特征，输出是预测结果
    - 通过"训练"让它学会正确预测
    """

    def __init__(self, input_size, hidden_size, output_size, learning_rate=0.01):
        """
        初始化网络参数

        参数：
            input_size: 输入特征数（比如图片有784个像素）
            hidden_size: 隐藏层神经元数（你决定的，比如128个）
            output_size: 输出类别数（比如10个数字分类）
            learning_rate: 学习率（每次更新参数的步长）
        """
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        self.learning_rate = learning_rate

        # ===== 初始化权重和偏置 =====
        # 费曼理解：权重就是神经网络要学习的参数

        # 第一层权重：(输入维度 × 隐藏层维度)
        # 使用小的随机数初始化（为什么？防止对称性）
        self.W1 = np.random.randn(input_size, hidden_size) * 0.01
        self.b1 = np.zeros((1, hidden_size))

        # 第二层权重：(隐藏层维度 × 输出维度)
        self.W2 = np.random.randn(hidden_size, output_size) * 0.01
        self.b2 = np.zeros((1, output_size))

        # 用于记录训练历史
        self.loss_history = []
        self.accuracy_history = []

        print(f"✅ 神经网络初始化完成！")
        print(f"   输入层: {input_size}个神经元")
        print(f"   隐藏层: {hidden_size}个神经元")
        print(f"   输出层: {output_size}个神经元")
        print(f"   总参数量: {self.count_parameters()}个\n")

    def count_parameters(self):
        """计算网络总参数数量"""
        return (self.W1.size + self.b1.size +
                self.W2.size + self.b2.size)

    # ========== 激活函数 ==========

    def relu(self, Z):
        """
        ReLU激活函数：max(0, x)

        费曼理解：
        - 把负数变成0，正数保持不变
        - 为什么需要？引入非线性，让网络能学习复杂模式
        - 就像"开关"，负数就关闭，正数就通过
        """
        return np.maximum(0, Z)

    def relu_derivative(self, Z):
        """
        ReLU的导数

        费曼理解：
        - Z > 0时，导数是1（保持不变）
        - Z <= 0时，导数是0（梯度消失）
        """
        return (Z > 0).astype(float)

    def softmax(self, Z):
        """
        Softmax函数：将分数转换为概率

        费曼理解：
        - 输出的每个值都在0到1之间
        - 所有输出的和为1（概率分布）
        - 分数越大的类别，概率越大
        """
        # 减去最大值防止数值溢出（技巧！）
        exp_Z = np.exp(Z - np.max(Z, axis=1, keepdims=True))
        return exp_Z / np.sum(exp_Z, axis=1, keepdims=True)

    # ========== 前向传播 ==========

    def forward(self, X):
        """
        前向传播：从输入计算到输出

        参数：
            X: 输入数据，形状 (batch_size, input_size)

        返回：
            predictions: 预测概率，形状 (batch_size, output_size)

        费曼理解：
            就像工厂流水线，数据经过每一层加工，最后得到产品
        """
        # 第一层：输入 → 隐藏层
        # Z1 = X @ W1 + b1 (线性变换)
        self.Z1 = np.dot(X, self.W1) + self.b1  # 形状: (batch_size, hidden_size)

        # A1 = ReLU(Z1) (激活)
        self.A1 = self.relu(self.Z1)  # 形状: (batch_size, hidden_size)

        # 第二层：隐藏层 → 输出层
        # Z2 = A1 @ W2 + b2 (线性变换)
        self.Z2 = np.dot(self.A1, self.W2) + self.b2  # 形状: (batch_size, output_size)

        # A2 = Softmax(Z2) (转换为概率)
        self.A2 = self.softmax(self.Z2)  # 形状: (batch_size, output_size)

        # 保存输入，反向传播时需要
        self.X = X

        return self.A2

    # ========== 损失函数 ==========

    def compute_loss(self, y_true, y_pred):
        """
        计算交叉熵损失

        参数：
            y_true: 真实标签，形状 (batch_size, output_size) 的one-hot编码
            y_pred: 预测概率，形状 (batch_size, output_size)

        费曼理解：
            损失函数衡量"预测"和"真实答案"的差距
            - 预测越准确，损失越小
            - 预测越离谱，损失越大
        """
        m = y_true.shape[0]  # 样本数量

        # 交叉熵损失：-Σ(y_true * log(y_pred))
        # 加一个小数防止log(0)
        loss = -np.sum(y_true * np.log(y_pred + 1e-8)) / m

        return loss

    # ========== 反向传播 ==========

    def backward(self, y_true):
        """
        反向传播：计算梯度

        参数：
            y_true: 真实标签，形状 (batch_size, output_size)

        费曼理解：
            反向传播就像"追责"：
            - 从最终的错误出发
            - 一层层往回算，每个权重要负多少责任
            - 这个"责任"就是梯度
        """
        m = y_true.shape[0]  # 样本数量

        # ===== 第二层的梯度 =====

        # 输出层误差：dZ2 = A2 - y_true
        # 费曼理解：预测值和真实值的差，就是误差
        dZ2 = self.A2 - y_true  # 形状: (batch_size, output_size)

        # 第二层权重的梯度：dW2 = A1^T @ dZ2 / m
        # 费曼理解：隐藏层的每个神经元对误差的贡献
        dW2 = np.dot(self.A1.T, dZ2) / m  # 形状: (hidden_size, output_size)

        # 第二层偏置的梯度：db2 = sum(dZ2) / m
        db2 = np.sum(dZ2, axis=0, keepdims=True) / m  # 形状: (1, output_size)

        # ===== 第一层的梯度 =====

        # 隐藏层误差：dA1 = dZ2 @ W2^T
        # 费曼理解：把输出层的误差传递回隐藏层
        dA1 = np.dot(dZ2, self.W2.T)  # 形状: (batch_size, hidden_size)

        # 考虑ReLU的导数：dZ1 = dA1 * ReLU'(Z1)
        # 费曼理解：ReLU把负数的梯度变为0（梯度不传递）
        dZ1 = dA1 * self.relu_derivative(self.Z1)  # 形状: (batch_size, hidden_size)

        # 第一层权重的梯度：dW1 = X^T @ dZ1 / m
        dW1 = np.dot(self.X.T, dZ1) / m  # 形状: (input_size, hidden_size)

        # 第一层偏置的梯度：db1 = sum(dZ1) / m
        db1 = np.sum(dZ1, axis=0, keepdims=True) / m  # 形状: (1, hidden_size)

        # 保存梯度
        self.dW1, self.db1 = dW1, db1
        self.dW2, self.db2 = dW2, db2

    # ========== 参数更新 ==========

    def update_parameters(self):
        """
        梯度下降更新参数

        费曼理解：
            梯度告诉我们"往哪个方向调整能减少损失"
            学习率决定"每次调整多大步子"

            就像下山：
            - 梯度是下坡的方向
            - 学习率是步子大小
            - 目标是到达山底（损失最小）
        """
        # W = W - learning_rate * dW
        self.W1 -= self.learning_rate * self.dW1
        self.b1 -= self.learning_rate * self.db1
        self.W2 -= self.learning_rate * self.dW2
        self.b2 -= self.learning_rate * self.db2

    # ========== 训练 ==========

    def train(self, X_train, y_train, X_val, y_val, epochs=100, batch_size=32, verbose=True):
        """
        训练神经网络

        参数：
            X_train: 训练数据
            y_train: 训练标签（one-hot编码）
            X_val: 验证数据
            y_val: 验证标签
            epochs: 训练轮数
            batch_size: 批次大小
            verbose: 是否打印训练信息

        费曼理解：
            训练就是不断重复：
            1. 前向传播（预测）
            2. 计算损失（看错了多少）
            3. 反向传播（算梯度）
            4. 更新参数（改进）
        """
        n_samples = X_train.shape[0]
        n_batches = n_samples // batch_size

        print(f"🚀 开始训练，共{epochs}轮，每轮{n_batches}个批次\n")

        for epoch in range(epochs):
            # 随机打乱数据（每轮都打乱）
            indices = np.random.permutation(n_samples)
            X_train_shuffled = X_train[indices]
            y_train_shuffled = y_train[indices]

            epoch_loss = 0

            # 小批次训练
            for batch in range(n_batches):
                # 获取当前批次数据
                start = batch * batch_size
                end = start + batch_size
                X_batch = X_train_shuffled[start:end]
                y_batch = y_train_shuffled[start:end]

                # 前向传播
                predictions = self.forward(X_batch)

                # 计算损失
                loss = self.compute_loss(y_batch, predictions)
                epoch_loss += loss

                # 反向传播
                self.backward(y_batch)

                # 更新参数
                self.update_parameters()

            # 平均损失
            avg_loss = epoch_loss / n_batches
            self.loss_history.append(avg_loss)

            # 在验证集上评估
            val_predictions = self.predict(X_val)
            val_accuracy = self.compute_accuracy(y_val, val_predictions)
            self.accuracy_history.append(val_accuracy)

            # 打印训练信息
            if verbose and (epoch % 10 == 0 or epoch == epochs - 1):
                print(f"Epoch {epoch+1}/{epochs} - "
                      f"Loss: {avg_loss:.4f} - "
                      f"Val Accuracy: {val_accuracy:.4f}")

        print(f"\n✅ 训练完成！最终验证准确率: {self.accuracy_history[-1]:.4f}")

    # ========== 预测 ==========

    def predict(self, X):
        """
        预测（返回类别）

        费曼理解：
            - 前向传播得到概率
            - 选择概率最大的类别
        """
        probabilities = self.forward(X)
        return np.argmax(probabilities, axis=1)

    def predict_proba(self, X):
        """预测（返回概率）"""
        return self.forward(X)

    def compute_accuracy(self, y_true, y_pred):
        """
        计算准确率

        费曼理解：
            预测正确的样本数 / 总样本数
        """
        if len(y_true.shape) > 1:
            # 如果y_true是one-hot编码，转换为类别
            y_true = np.argmax(y_true, axis=1)

        accuracy = np.mean(y_pred == y_true)
        return accuracy


# ========== 辅助函数 ==========

def one_hot_encode(y, num_classes):
    """
    将类别标签转换为one-hot编码

    例子：
        y = [0, 1, 2] → [[1,0,0], [0,1,0], [0,0,1]]

    费曼理解：
        神经网络需要用向量表示类别
        one-hot编码就是"只有一个位置是1，其他都是0"
    """
    m = y.shape[0]
    one_hot = np.zeros((m, num_classes))
    one_hot[np.arange(m), y] = 1
    return one_hot


def plot_training_history(model):
    """可视化训练过程"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # 损失曲线
    ax1.plot(model.loss_history, linewidth=2)
    ax1.set_xlabel('Epoch', fontsize=12)
    ax1.set_ylabel('Loss', fontsize=12)
    ax1.set_title('训练损失变化', fontsize=14, fontweight='bold')
    ax1.grid(True, alpha=0.3)

    # 准确率曲线
    ax2.plot(model.accuracy_history, linewidth=2, color='green')
    ax2.set_xlabel('Epoch', fontsize=12)
    ax2.set_ylabel('Accuracy', fontsize=12)
    ax2.set_title('验证准确率变化', fontsize=14, fontweight='bold')
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()


def visualize_decision_boundary(model, X, y, title="决策边界"):
    """
    可视化决策边界（仅适用于2D数据）

    费曼理解：
        画出神经网络学到的"分界线"
        不同颜色区域代表不同的预测类别
    """
    if X.shape[1] != 2:
        print("⚠️ 只能可视化2维数据！")
        return

    # 创建网格
    h = 0.02  # 网格步长
    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h),
                         np.arange(y_min, y_max, h))

    # 预测网格上每个点的类别
    Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    # 绘制
    plt.figure(figsize=(10, 8))
    plt.contourf(xx, yy, Z, alpha=0.4, cmap='viridis')
    plt.scatter(X[:, 0], X[:, 1], c=y, s=50, edgecolor='k', cmap='viridis')
    plt.xlabel('特征1', fontsize=12)
    plt.ylabel('特征2', fontsize=12)
    plt.title(title, fontsize=14, fontweight='bold')
    plt.colorbar(label='预测类别')
    plt.show()


# ========== 主程序：示例使用 ==========

if __name__ == "__main__":
    print("="*60)
    print(" 两层神经网络 - 从零实现")
    print("="*60)
    print()

    # ===== 1. 生成数据 =====
    print("📊 步骤1：生成模拟数据集\n")

    # 使用sklearn生成分类数据
    X, y = make_classification(
        n_samples=1000,      # 1000个样本
        n_features=2,        # 2个特征（方便可视化）
        n_informative=2,     # 2个信息特征
        n_redundant=0,       # 0个冗余特征
        n_clusters_per_class=1,
        n_classes=3,         # 3分类问题
        random_state=42
    )

    print(f"   数据形状: {X.shape}")
    print(f"   类别数量: {len(np.unique(y))}")
    print(f"   类别分布: {np.bincount(y)}\n")

    # 数据可视化
    plt.figure(figsize=(8, 6))
    plt.scatter(X[:, 0], X[:, 1], c=y, cmap='viridis', edgecolor='k', s=50)
    plt.xlabel('特征1', fontsize=12)
    plt.ylabel('特征2', fontsize=12)
    plt.title('原始数据分布', fontsize=14, fontweight='bold')
    plt.colorbar(label='类别')
    plt.show()

    # ===== 2. 数据预处理 =====
    print("🔧 步骤2：数据预处理\n")

    # 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # One-hot编码
    num_classes = len(np.unique(y))
    y_train_onehot = one_hot_encode(y_train, num_classes)
    y_test_onehot = one_hot_encode(y_test, num_classes)

    print(f"   训练集大小: {X_train.shape[0]}")
    print(f"   测试集大小: {X_test.shape[0]}")
    print(f"   标签编码: {y_train[:3]} → \n{y_train_onehot[:3]}\n")

    # ===== 3. 创建模型 =====
    print("🧠 步骤3：创建神经网络\n")

    model = TwoLayerNN(
        input_size=2,        # 2个输入特征
        hidden_size=10,      # 隐藏层10个神经元
        output_size=3,       # 3个输出类别
        learning_rate=0.1    # 学习率
    )

    # ===== 4. 训练模型 =====
    print("🎓 步骤4：训练模型\n")

    model.train(
        X_train, y_train_onehot,
        X_test, y_test_onehot,
        epochs=200,
        batch_size=32,
        verbose=True
    )

    # ===== 5. 评估模型 =====
    print("\n📈 步骤5：评估模型\n")

    # 在训练集上评估
    train_pred = model.predict(X_train)
    train_acc = model.compute_accuracy(y_train, train_pred)
    print(f"   训练集准确率: {train_acc:.4f}")

    # 在测试集上评估
    test_pred = model.predict(X_test)
    test_acc = model.compute_accuracy(y_test, test_pred)
    print(f"   测试集准确率: {test_acc:.4f}\n")

    # ===== 6. 可视化结果 =====
    print("📊 步骤6：可视化结果\n")

    # 绘制训练曲线
    plot_training_history(model)

    # 绘制决策边界
    visualize_decision_boundary(model, X_test, y_test, "测试集决策边界")

    # ===== 7. 预测新数据 =====
    print("🔮 步骤7：预测新数据\n")

    # 创建一些新数据点
    new_data = np.array([
        [0, 0],
        [2, 2],
        [-2, -2]
    ])

    # 预测类别
    predictions = model.predict(new_data)
    probabilities = model.predict_proba(new_data)

    print("   新数据预测结果：")
    for i, (point, pred, prob) in enumerate(zip(new_data, predictions, probabilities)):
        print(f"   点 {point} → 类别 {pred}, 概率 {prob}")

    print("\n" + "="*60)
    print(" 🎉 完成！你已经从零实现了一个神经网络！")
    print("="*60)
