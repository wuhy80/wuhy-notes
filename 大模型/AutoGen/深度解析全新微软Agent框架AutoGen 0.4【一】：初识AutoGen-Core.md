---
🌻日期🌻: 2025-03-23
🌙星期🌙: 星期日
⌚️时间⌚️: 09:49:00
tags: 
---

2025-02-25 01:12·[AI大模型应用实践](https://www.toutiao.com/c/user/token/MS4wLjABAAAALBePZCFh57gJGpiSgoi9PDMpq739gGJdWAUXc-px5FE/?source=tuwen_detail)

**专注LLM深度应用，关注我不迷路**

作为曾经与LangChain，LlamaIndex一起被视为最早的LLM应用底层开发框架三架马车之一的微软AutoGen，在去年经历了一系列人员变动后，进行了全新的设计与重构，推出了彻底改头换面的AutoGen 0.4版本（旧版本为0.2），并在2025年初推出了最新的稳定版本0.4.2。

![](https://p3-sign.toutiaoimg.com/tos-cn-i-axegupay5k/7cccda7ac0ea484b8b7ad59832052bc0~tplv-tt-origin-web:gif.jpeg?_iz=58558&from=article.pc_detail&lk3s=953192f4&x-expires=1743298670&x-signature=n7un6JPdtaz%2B%2FxdhnvFjunAeXes%3D)

或许你已经见过一些蜻蜓点水式的介绍，不过在经过研究与实践后，我们将为大家带来更全面与深入的新版本解析。

这是一个完全重写且不向后兼容的AutoGen版本，所以本篇学习不依赖旧版本v0.2的学习基础。此外，由于AutoGen更专注Agent应用，完全可与LangGraph/LlamaIndex Workflows配合使用，因此学习AutoGen将给你带来更灵活的开发组合选择。

我们将分多期来循序渐进认识新版本中**AutoGen-Core**与**AutoGen-AgentChat**这两个不同的框架层次。其中**AutoGen-Core**部分内容包括：

- **初识AutoGen 0.4与AutoGen-Core**
- **AutoGen-Core：使用Tools与代码执行器**
- **AutoGen-Core：多Agent工作范式与实例**
- **AutoGen-Core：与LangGraph/LlamaIndex的集成**

本篇将首先介绍第一个部分。

**1**

**认识AutoGen0.4整体架构**

相对于LangChain的通用强大（也略臃肿与复杂）、LlamaIndex的侧重数据密集型应用，AutoGen从诞生开始就更专注在**多智能体应用**。在旧版本中，你可以使用AutoGen预置的上层Agent组件快速构建一个多Agent系统，并通过“聊天”模式来完成输入任务。但由于天然的架构限制，也存在着协作模式有限、可控能力不足、调试麻烦、扩展性较差等问题。

全新的AutoGen0.4版本采用了一种分层、可扩展的模块化架构，是一个**异步的、消息驱动的、可扩展的多Agent框架（红色部分是我们的研究重点）**：

![](https://p3-sign.toutiaoimg.com/tos-cn-i-6w9my0ksvp/56ee5c3bb717447e8a42ab2d540667a9~tplv-tt-origin-web:gif.jpeg?_iz=58558&from=article.pc_detail&lk3s=953192f4&x-expires=1743298670&x-signature=UkfKF3uaQDtElaiQLhwl2H9JVkQ%3D)

图片来自微软官方

其最大特点是：**提供了从底层核心框架（Core），到高层API（AgentChat），再到应用层（Apps）的多层次可复用组件**，**开发人员可以根据需要在不同的层次使用框架。**使用越上层的开发量越小，但灵活性也越小；而使用最底层的Core框架，则代表较高的复杂度，当然能力也越强，几乎可以应对所有的LLM应用开发场景。

先对每个层次建立初步认识：

- **Core（核心框架）**：**提供基础组件与运行环境。**包括消息通信、消息驱动的Agent、Tools、日志等基础抽象，以及对分布式Agent系统的运行支持。
- **AgentChat（高级API层）**：**在Core之上的高层API**。包括多种预构建的Agent类型、Agent团队类型、Message类型等。这是最接近AutoGen旧版本的层次，可方便旧版本的迁移。
- **Extentions（扩展）**：**第三方扩展组件，用于完善生态。**比如第三方LLM组件、代码执行器、Tools、更多的预置Agent等。你也可以自己开发Extension并提交到社区。
- **Magentic-One：一个通用的多智能体应用程序。**可用于网页浏览、代码执行、文件处理等自动任务。其构建在在Extentions层的magentic_one组件之上。

除此之外，AutoGen还整合了两个方便的开发工具：

- **AutoGen Studio：用于低代码开发多Agent应用的UI程序。**可以想象成基于AutoGen底层框架之上的Coze。
- **AutoGen Bench：用于评估Agent性能与基准测试套件。**工程化平台的一部分。

尽管AutoGen0.4有着清晰的分层设计，但并不意味着使用时的绝对隔离。比如你可能在使用Core开发的时候用到Extentsions中的组件；或者用到AgentChat中某个封装Agent类型等，后面例子中会看到。

**2**

**AutoGen-Core：核心概念**

AutoGen0.4与旧版本最大的区别在于：提供了一种更底层的，快速构建消息驱动的、分布式、可扩展的多Agent系统的框架与组件，即**AutoGen-core**。

AutoGen-Core提供了多Agent的基础管理与运行环境。这里用下图来表示：

![](https://p3-sign.toutiaoimg.com/tos-cn-i-6w9my0ksvp/e80b671019ee4c91ad221daf2e19c08f~tplv-tt-origin-web:gif.jpeg?_iz=58558&from=article.pc_detail&lk3s=953192f4&x-expires=1743298670&x-signature=yPDnjsnSIns2UrPy8JIsAMr7E9U%3D)

了解几个AutoGen-Core中的核心概念：

**【Agent】**

**可以把Agent想象成一个能对消息进行响应的软件对象。**Agent可以维护自己的状态与数据，其响应过程可以是任何自定义逻辑，比如调用API、发送消息给其他Agent、执行Python代码等。因此，正如图中所示，你也可以调用LangGraph或者LlamaIndex开发的Agent Workflow。

如果这个Agent是LLM来驱动，那么它就是一个AI Agent。

**【Runtime】**

**可以把Runtime想象成一个类似Web容器的Server。**Runtime的作用主要为：

- 管理Agent的注册、创建与销毁等生命周期管理
- 提供Agent间的消息通信机制

Runtime可以在单机运行，也可以分布式运行。即多个Runtime运行在不同的物理机器，并通过一个主Runtime来协调通信与管理。

**【Agent ID】**

**可以把AgentID想象成Agent实例的唯一“身份证”。**一个Agent ID包含两个部分：

- Agent Type：代表这个Agent实例的类型。
- Agent Key：代表这个Agent实例的标识符。

Agent ID也是Agent实例间消息通信的“通信地址”。比如，如果你需要给某个Agent实例发送消息，只需要知道它的Agent ID。

**【消息与通信】**

**消息代表Agent实例之间通信的结构化内容。**消息的结构可以完全自定义，在AutoGen-Core中的消息通信机制有两种：

- **直接消息：**即直接向某个Agent实例发送消息，发送者可以是Agent实例，也可以是Runtime。
- **广播与订阅：**广播者向某个主题（topic）发布消息，则订阅该主题的所有Agent实例都会收到到消息。

基本上，理解了这些基本概念，就可以用AutoGen-Core开发可控的、消息驱动的Agent系统（这个系统甚至可以与AI无关）。

**3**

**AutoGen-Core：Hello World！**

我们借助一个简单的应用来理解AutoGen-Core的上述核心概念。在这个场景中：

**有两个Agent，ManagerAgent与WorkerAgent。ManagerAgent在收到任务消息（Hello World）后，会转发给Worker完成，并获得反馈。**

![](https://p3-sign.toutiaoimg.com/tos-cn-i-6w9my0ksvp/145832f311b344559f35c6bc43fa601f~tplv-tt-origin-web:gif.jpeg?_iz=58558&from=article.pc_detail&lk3s=953192f4&x-expires=1743298670&x-signature=TXVTlTwakRxBDLDljUdlNHyF%2BgU%3D)

我们逐步创建这个应用：

**【定义消息类型】**

使用dataclass装饰器自定义消息类型：

```
from dataclasses import dataclass

@dataclass
class MyTextMessage:
    content: str
```

**【定义WorkerAgent】**

从AutoGen-core提供的基础抽象RoutedAgent派生，快速创建WorkerAgent；为了处理消息，可以借助装饰器@message_handler来实现自己的消息处理方法。每个message_handler都会收到两个输入参数：消息体与消息上下文。

注意，这里为了让ManagerAgent能收到反馈，我们return了一个消息。

```
from autogen_core import AgentId, MessageContext, RoutedAgent, message_handler

class MyWorkerAgent(RoutedAgent):
    def __init__(self) -> None:
        super().__init__("MyWorkerAgent")
        
    @message_handler
    async def handle_my_message(self, message: MyTextMessage, ctx: MessageContext) -> MyTextMessage:
        print(f"{self.id.key} 收到来自 {ctx.sender} 的消息: {message.content}\n")
        return MyTextMessage(content="OK, Got it!")
```

**【定义ManagerAgent】**

ManagerAgent与Worker有所不同，由于其需要将任务消息转发给WorkerAgent，因此在初始化时，会保留指向WorkerAgent的引用（指定一个AgentId即可，Agent实例由Runtime在必要时自动创建）。随后的消息处理过程如下：

- 接收到任务消息，通常是由Runtime发送
- 将消息转发给WorkerAgent（借助AgentId）
- 等待WorkerAgent的响应消息并输出

```
class MyManagerAgent(RoutedAgent):
    def __init__(self) -> None:
        super().__init__("MyManagerAgent")
        self.worker_agent_id = AgentId('my_worker_agent', 'worker')

    @message_handler
    async def handle_my_message(self, message: MyTextMessage, ctx: MessageContext) -> None:
        print(f"{self.id.key} 收到消息: {message.content}\n")
        print(f"{self.id.key} 发送消息给 {self.worker_agent_id}...\n")
        response = await self.send_message(message, self.worker_agent_id)
        print(f"{self.id.key} 收到来自 {self.worker_agent_id} 的消息: {response.content}\n")
```

**【创建Runtime并启动】**

定义完Agent后，就可以创建Runtime并运行：

- 创建Runtime，并负责启动与停止
- 注册定义好的Agent类型，并指定工厂函数用于实例化
- 通过Runtime发送任务消息给入口Agent实例，这里是ManagerAgent

主程序实现如下：

```
from autogen_core import SingleThreadedAgentRuntime
import asyncio

async def main():

    #创建runtime，并注册agent类型
    runtime = SingleThreadedAgentRuntime()
    await MyManagerAgent.register(runtime, "my_manager_agent", lambda: MyManagerAgent())
    await MyWorkerAgent.register(runtime, "my_worker_agent", lambda: MyWorkerAgent())

    #启动runtime，发送消息，关闭runtime
    runtime.start()

    #创建agent_id，发送消息
    agent_id = AgentId("my_manager_agent", "manager")
    await runtime.send_message(MyTextMessage(content="Hello World!"),agent_id)

    #关闭runtime
    await runtime.stop_when_idle()

asyncio.run(main())
```

在上面的代码中：

- 注册Agent使用类方法register()，注册时设定Agent类名称以及工厂方法
- 初始的任务消息通过Runtime.send_message()发送
- send_message发送直接消息只需要指定接受消息的AgentId即可，无需关注其真实的实例是否存在，Runtime会自动管理

现在运行下这个简单的应用，应该可以看到这样的输出：

![](https://p3-sign.toutiaoimg.com/tos-cn-i-6w9my0ksvp/2124e708068f4c2f8b5ea10873c7bb97~tplv-tt-origin-web:gif.jpeg?_iz=58558&from=article.pc_detail&lk3s=953192f4&x-expires=1743298670&x-signature=9UkwBMsNNiXdDaNYg%2B5FGAQr9l8%3D)

现在相信你对AutoGen-Core的核心机制已经有所体会。

这里只是创建了一个与AI无关的、异步消息驱动的多Agent（还不是一个AI Agent）应用，现在让我们引入AI能力。

4

**AutoGen-Core：第一个AI Agent**

我们将会创建一个最简单的AI Agent：**借助LLM给出任务响应，并支持简单的对话上下文记忆**。

由于只涉及一个简单的Agent，所以逻辑比上一节的“Hello World”更简单，但是引入了LLM响应。这里直接给出核心实现：

```
......
@dataclass
class Message:
    content: str

class MyAgent(RoutedAgent):
    def __init__(self) -> None:
        super().__init__("A simple agent")
        self._system_messages = [SystemMessage(content="You are a helpful AI assistant.Pls answer using Chinese.")]
        self._model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")
        self._model_context = BufferedChatCompletionContext(buffer_size=5)

    @message_handler
    async def handle_user_message(self, message: Message, ctx: MessageContext) -> Message: 
        user_message = UserMessage(content=message.content, source="user")
        await self._model_context.add_message(user_message)
        response = await self._model_client.create(
            self._system_messages + (await self._model_context.get_messages()), cancellation_token=ctx.cancellation_token
        )
        await self._model_context.add_message(AssistantMessage(content=response.content, source=self.metadata["type"]))
        return Message(content=response.content)
```

在这里的代码中：

- 使用model_clien访问LLM；使用model_context来保存对话历史；
- 每次收到新消息，则将新消息添加到对话历史，并交给LLM做输出
- 将LLM输出消息添加到对话历史后，返回本次响应内容

采用与上一节相同的方法创建Runtime、注册、启动后，给Agent发送一个任务消息，你就完成了一次对上述Agent的调用：

```
..
    # 创建agent_id，发送消息
    message = Message("中国的首都是哪个城市？")
    response = await runtime.send_message(message, AgentId("my_agent", "default"))    print(response.content)
```

就这样，一个极简版本的、基于AutoGen-Core的Agent就完成了。

事实上这只是一个简单的LLM应用，没有外部工具使用、长期记忆、ReAct等多方面能力。我们将在下一篇继续介绍如何使用AutoGen-Core开发带有工具能力的AI Agent。