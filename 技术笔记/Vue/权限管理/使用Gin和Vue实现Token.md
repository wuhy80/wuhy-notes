- 登录：当用户填写完账号和密码后向服务端验证是否正确，验证通过之后，服务端会返回一个**token**，拿到token之后（我会将这个token存贮到localStorage中，保证刷新页面后能记住用户登录状态），前端会根据token再去拉取一个 **userInfo** 的接口来获取用户的详细信息（如用户权限，用户名等等信息）。
- 权限验证：通过token获取用户对应的菜单权限列表和按钮去权限列表，动态算出其对应的权限路由，通过 `router.addRoute`动态挂载这些路由。

https://blog.csdn.net/qq_63880817/article/details/133584436
讲述了如何在 Gin 中生成 token 并使用通过 Headers 传递过来的 Token
https://blog.csdn.net/weixin_48255917/article/details/110622736
这个讲述了如何用 Vue 和后端的 Token 做交互

下面是具体实现
## GIN 部分
### 如何生成 token
```go
package gin_server

import (
	"fmt"

	"github.com/dgrijalva/jwt-go"
)

// JWT 定义一个jwt对象；可以是其他命名，并非是前面所说的token类型，注意不要搞混乱了，想象成java中一个有多种方法类，
type JWT struct {
	SigningKey []byte
}

// NewJWT 初始化jwt对象,固定返回一个为123456的密钥，（基于你的项目实际需要
func NewJWT() *JWT {
	return &JWT{
		[]byte("project_name"),
	}
}

// JWTClaims 定义自己的负载
type JWTClaims struct {
	Name string `json:"name"`
	Role string `json:"role"`
	// StandardClaims结构体实现了Claims接口(Valid()函数)
	jwt.StandardClaims
}

// CreatToken 进行构造一个token,参数为接受到的负载
func (j *JWT) CreatToken(claims JWTClaims) (string, error) {
	// 指定编码的算法为jwt.SigningMethodHS256,返回一个token的指针
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.SigningKey)
}

// ParseToken 进行解析一个token
func (j *JWT) ParseToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return j.SigningKey, nil
	})
	//错误处理 ，使更健壮性、易懂性
	if err != nil {
		// jwt.ValidationError 是一个无效token的错误结构
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorMalformed != 0 {
				// ValidationErrorMalformed是一个uint常量，表示token格式错误
				return nil, fmt.Errorf("token格式错误")
			} else if ve.Errors&jwt.ValidationErrorExpired != 0 {
				//ValidationErrorExpired表示token过期
				return nil, fmt.Errorf("token过期")
			} else if ve.Errors&jwt.ValidationErrorNotValidYet != 0 {
				//ValidationErrorNotValidYet 表示token生效时间未到
				return nil, fmt.Errorf("token生效时间未到")
			} else {
				return nil, fmt.Errorf("token 不可用")
			}
		}
	}
	// 将token中的claims信息解析出来并断言成用户自定义的有效载荷结构
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("token无效")
}

```

### 如何在登录的时候设置 Token
```go

func login(c *gin.Context) {
	var user User
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validUser, err := validateUser(user.Name, user.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user_name or password"})
		return
	}

	wt := NewJWT()

	claims := JWTClaims{
		Name: validUser.Name,
		Role: string(validUser.Role),
		StandardClaims: jwt.StandardClaims{
			NotBefore: int64(time.Now().Unix() - 1000), // 签名生效时间
			ExpiresAt: int64(time.Now().Unix() + 3600), // 签名过期时间
			IssuedAt:  int64(time.Now().Unix()),
			Issuer:    "签名颁发者",
		},
	}

	token, err := wt.CreatToken(claims)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": -1,
			"msg":  "token生成失败",
		})
		return
	}

	c.JSON(http.StatusOK, map[string]interface{}{"code": 0, "msg": "success", "data": gin.H{"token": token}})
}
```

### 如何在中间件验证 token
```go

// JWTAuth define the midWare to check whether the JWT is valid
func JWTAuth(c *gin.Context) {
	if c.Request.URL.Path == "/api/login" {
		c.Next()
		return
	}

	comm.Log.Infof("JWTAuth: %s", c.Request.URL.Path)

	//从头部信息的Authorization中的到tocken
	tokenString := c.GetHeader("Authorization")
	//如果信息为空
	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status": -1,
			"msg":    "Authorization header not provided",
		})
		c.Abort()
		return
	}
	//将tokenString解析成想要的*MyClaims格式，自定义的函数解析，下面内容有讲解
	jwt := NewJWT()
	claims, err := jwt.ParseToken(tokenString)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status": -1,
			"msg":    err.Error(),
		})
		c.Abort()
		return
	}
	c.Set("claims", claims)
}
```

中间件的使用方法
```go
	router := gin.Default()
	router.Use(cors())
	router.Use(JWTAuth)
```

## 前端 Vue
### 使用 Pinia 维护 Token
```ts
import { defineStore } from 'pinia'
import request from '@/utils/request';
import router from '@/router'
import { ElMessage } from 'element-plus';
import { UserFormDataInter } from '@/types/user';
import { jwtDecode } from 'jwt-decode'

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      token: window.localStorage.getItem('token') || "",
      username: window.localStorage.getItem('username') || "",
    }
  },
  actions: {
    async login(user: UserFormDataInter) {
      try {
        request.post("/login", user).then(res => {
          if (res) {
            ElMessage({
              message: '登录成功',
              type: 'success',
            })

            this.token = res.data.token                       
            let token_parsed = jwtDecode(res.data.token) as { name: string };
            this.username = token_parsed.name

            window.localStorage.setItem("token", res.data.token);
            window.localStorage.setItem("username", this.username);

            console.log(`token_parsed`, token_parsed)
            
            router.push('/config/status');
          } else {
            ElMessage.error('账号或密码错误！！！登录失败！！！')
          }
        });
      } catch (error) {
        ElMessage.error('登录失败')
        throw error;
      }
    },
    logout() {
      this.token = ""
      this.username = ""

      router.push('/login');
    },
  }
});
```

### 路由进行拦截验证
```ts
import { jwtDecode } from 'jwt-decode'

//路由守卫    
//全局守卫，登录拦截
//进行路由拦截：当没有登陆标识，直接打回登陆页面，如何避免退回到 登陆页呢？
router.beforeEach((to, from, next) => {
  // 从本地缓存中获取保存的 token 信息
  if (to.path === "/login") {
    next()
    return
  }

  let token_str = window.localStorage.getItem('token') || ""

  // 如果没有token，强制跳转到登录页面；如果有，则判断token时间是否过期
  if (token_str === "") {
    ElMessage({
      message: h('p', null, [
        h('span', null, '没有找到登录信息'),
        h('i', { style: 'color: teal' }, '请登录后继续使用本系统！'),
      ]),
    })
    next('/login')
  } else {
    let tokenObj = jwtDecode(token_str) as { name: string, exp: number };

    let date = new Date().getTime();

    // 当前时间 - token中的登录时间 > 设置的过期时间，为过期；则清除token，并强制跳转至登录页
    // 反之为有效期，则放行
    if (date > tokenObj.exp * 1000) {
      console.log(`${new Date(date)} > ${new Date(tokenObj.exp*1000)}`)
      window.localStorage.removeItem('username');
      window.localStorage.removeItem('token');

      next('/login')
      ElMessage({
        message: h('p', null, [
          h('span', null, '登录状态过期'),
          h('i', { style: 'color: teal' }, '请重新登录！'),
        ]),
      })
    } else {
      next();
    }
  }
});
```

### Request 封装 Token
```ts
import axios from 'axios'
import { useUserStore } from '@/store/user'

const request = axios.create({
	// 这里是全局统一加上了 '/api' 前缀，也就是说所有接口都会加上'/api'前缀在，页面里面写接口的时候就不要加 '/api'了
    baseURL: 'http://xxx.xx.xx.xxx:8080/api',  
    timeout: 5000
})

// request 拦截器
// 可以自请求发送前对请求做一些处理
// 比如统一加token，对请求参数统一加密
request.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=utf-8';
    config.headers['Authorization'] = window.localStorage.getItem('token') || "";
    return config
}, error => {
    return Promise.reject(error)
});

// response 拦截器
// 可以在接口响应后统一处理结果
request.interceptors.response.use(
    response => {
        let res = response.data;
        // 如果是返回的文件
        if (response.config.responseType === 'blob') {
            return res
        }
        // 兼容服务端返回的字符串数据
        if (typeof res === 'string') {
            res = res ? JSON.parse(res) : res
        }
        return res;
    },
    error => {
        console.log('' + error) // for debug
        return Promise.reject(error)
    }
)


// 封装get请求方法
export const $get = async (url:string, params:object={}) => {
    let {data} = await request.get(url, {params});
    return data
  }
  
  // 封装post请求方法
  export const $post = async (url:string, params:object={}) => {
    let {data} =  await request.post(url, params);
    return data
  }

export default request
```