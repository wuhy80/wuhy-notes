---
🌻日期🌻: 2024-05-03
🌙星期🌙: 星期四
⌚️时间⌚️: 16:32:49
tags:
---
在src/stores下面新建index.ts座位pinia的入口
```ts
import { createPinia } from "pinia"

const store = createPinia()
​
export default store
```
在main.ts中引用
```ts
import store from './stores'
​
app.use(store)
```

## 组装式例子

```ts
import { defineStore } from 'pinia'
​
// 定义状态的类型 一般情况下Pinia会自动推断出state的类型，你就无需定义接口。如果state的数据类型比较复杂，推荐你定义一个接口来描述state的类型
interface IUserState {
    firstName: string
    lastName: string
}
​
const useUserStore = defineStore('user', {
    state: (): IUserState => ({
        firstName: 'Liu',
        lastName: 'Dehua'
    }),
    getters: {
        fullName(): string {
            return this.firstName + ' ' + this.lastName
        }
    }
})
​
export default useUserStore
```

## 组合式例子
```ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from "vue"
​
// 定义状态的类型 一般情况下Pinia会自动推断出state的类型，你就无需定义接口。如果state的数据类型比较复杂，推荐你定义一个接口来描述state的类型
interface IUserState {
    firstName: string
    lastName: string
}
​
const useUserStore = defineStore('user', () => {
    const state = reactive<IUserState>({
        firstName: 'Liu',
        lastName: 'Dehua'
    })
    
    const fullName = (): string => state.firstName + ' ' + state.lastName
    
    return {
        ...toRefs(state),
        fullName
    }
})
​
export default useUserStore
```

## 如何使用上面定义的Store
上面两种方式定义的使用方式一样
```ts
<template>
  <div class="about">
    <div class="store">
      <h1>在组件中您可以这样使用定义的Store</h1>
      <h2>FirstName：{{ userStore.firstName }}</h2>
      <h2>LastName：{{ userStore.lastName }}</h2>
      <h2>FullName：{{ userStore.fullName() }}</h2>
    </div>
  </div>
</template>
​
<script setup lang="ts">
import useUserStore from '@/stores/modules/user'
​
const userStore = useUserStore()
</script>
```

# 如何实现持久化
先执行命令安装插件
npm i pinia-plugin-persistedstate

在 `src/stores/index.ts` 中引入插件
```ts
import { createPinia } from "pinia"
// 引入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
​
const store = createPinia()
// 将插件提供给store实例
store.use(piniaPluginPersistedstate)
​
export default store
```

## 第一种方式的持久化
```ts
import { defineStore } from 'pinia'
​
// 定义状态的类型 一般情况下Pinia会自动推断出state的类型，你就无需定义接口。如果state的数据类型比较复杂，推荐你定义一个接口来描述state的类型
interface IUserState {
    firstName: string
    lastName: string
}
​
const useUserStore = defineStore('user', {
    state: (): IUserState => ({
        firstName: 'Liu',
        lastName: 'Dehua'
    }),
    getters: {
        fullName(): string {
            return this.firstName + ' ' + this.lastName
        }
    },
    actions: {
        updateLastName(lastName: string) {
            this.lastName = lastName
        }
    },
    // 表示这个store里的数据都将持久化存储
    persist: true
})
​
export default useUserStore
```

## 第二种方式的持久化
```ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from "vue"
​
// 定义状态的类型 一般情况下Pinia会自动推断出state的类型，你就无需定义接口。如果state的数据类型比较复杂，推荐你定义一个接口来描述state的类型
interface IUserState {
    firstName: string
    lastName: string
}
​
const useUserStore = defineStore('user', () => {
    const state = reactive<IUserState>({
        firstName: 'Liu',
        lastName: 'Dehua'
    })
    
    const fullName = (): string => state.firstName + ' ' + state.lastName
    const updateLastName = (lastName: string) => state.lastName = lastName
    
    return {
        ...toRefs(state),
        fullName,
        updateLastName
    }
}, {
    // 注意defineStore的第三个参数可以传入插件配置
    persist: true
})
​
export default useUserStore
```

## 如何自定义持久化的内容
在 `src/utils` 目录下新建 `persist.ts` 文件，修改存储配置：
```ts
import type { PersistedStateOptions } from 'pinia-plugin-persistedstate'

/**
 * @description pinia持久化参数配置
 * @param {String} key 存储到持久化的 name
 * @param {Array} paths 需要持久化的 state name
 * @return persist
 * */
const piniaPersistConfig = (key: string, paths?: string[]) => {
	const persist: PersistedStateOptions = {
		key,
		storage: window.localStorage,
		// storage: window.sessionStorage,
		paths
	}
	return persist
}

export default piniaPersistConfig
```
因此修改store中的持久化配置：
```ts
import { defineStore } from 'pinia'
import { reactive, toRefs } from "vue"
import piniaPersistConfig from "@/utils/persist"

// 定义状态的类型 一般情况下Pinia会自动推断出state的类型，你就无需定义接口。如果state的数据类型比较复杂，推荐你定义一个接口来描述state的类型
interface IUserState {
    firstName: string
  	lastName: string
}

const useUserStore = defineStore('user', () => {
    const state = reactive<IUserState>({
        firstName: 'Liu',
        lastName: 'Dehua'
    })
    
    const fullName = (): string => state.firstName + ' ' + state.lastName
    const updateLastName = (lastName: string) => state.lastName = lastName
    
    return {
        ...toRefs(state),
    	fullName,
        updateLastName
    }
}, {
    // 注意defineStore的第三个参数可以传入插件配置，根据配置只持久化lastName
    persist: piniaPersistConfig('user', ['lastName'])
})

export default useUserStore
```