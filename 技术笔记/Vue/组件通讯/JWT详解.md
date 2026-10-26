作者：程序员阿晨  
链接：https://www.zhihu.com/question/364616467/answer/2982611063  
来源：知乎  
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。    

## 什么是[单点登录](https://www.zhihu.com/search?q=%E5%8D%95%E7%82%B9%E7%99%BB%E5%BD%95&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)

> 单点登录（Single Sign On），简称为SSO，是比较流行的企业业务整合的解决方案之一。SSO的定义是在多个应用系统中，用户只需要登录一次就可以访问所有相互信任的应用系统。

## JWT是什么

> JSON Web Token (JWT)是一个开放标准(RFC 7519)，它定义了一种紧凑的、自包含的方式，用于作为JSON对象在各方之间安全地传输信息。该信息可以被验证和信任，因为它是[数字签名](https://www.zhihu.com/search?q=%E6%95%B0%E5%AD%97%E7%AD%BE%E5%90%8D&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)的。

**作用：**

JWT的声明一般被用来在身份提供者和[服务提供者](https://www.zhihu.com/search?q=%E6%9C%8D%E5%8A%A1%E6%8F%90%E4%BE%9B%E8%80%85&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)间传递被认证的用户身份信息，以便于从资源服务器获取资源。比如用在用户登录上。
JWT最重要的作用就是对 token信息的防伪作用。

### JWT组成

一个JWT由三部分组成：JWT头、有效载荷、签名哈希，这三部分分别进行base64url编码，之后用“ .” 相互连接，如下，一个JWT字符串：

![](https://pic1.zhimg.com/80/v2-ace4d60032dacd2fd04f558f13f1608c_1440w.webp?source=1def8aca)

### [JWT头](https://www.zhihu.com/search?q=JWT%E5%A4%B4&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)

JWT头部分是一个描述JWT元数据的JSON对象，包含两部分信息：

- 声明类型，这里是“JWT”
- 使用的加密算法，如HMAC、SHA256、RSA，默认为HMAC SHA256（写为HS256）

完整的头部如下面的JSON

```java
{
  "alg": "HS256",
  "typ": "JWT"
}
```

这部分JSON对象使用Base64 URL算法转换为字符串保存

### 有效载荷

有效载荷，是JWT的主体内容部分，也是一个JSON对象，包含需要传递的数据。 JWT指定七个默认字段供选择。

```java
iss: jwt签发者
sub: 主题
aud: 接收jwt的一方
exp: jwt的过期时间，这个过期时间必须要大于签发时间
nbf: 定义在什么时间之前，该jwt都是不可用的.
iat: jwt的签发时间
jti: jwt的唯一身份标识，主要用来作为一次性token,从而回避重放攻击。
```

也可以自定义字段，如：

```java
{
  "name": "Ann",
  "role": "manager",
}
```

这部分JSON对象也使用Base64 URL算法转换为字符串保存，因此是未加密的，所以注意不要放敏感信息（如密码）

### 签名哈希

签名哈希部分是对上面两部分数据签名，通过指定的算法生成[哈希](https://www.zhihu.com/search?q=%E5%93%88%E5%B8%8C&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)，以确保数据不会被篡改。

首先，需要指定一个密码（secret）。该密码仅仅为保存在服务器中，并且不能向用户公开。然后，使用标头中指定的[签名算法](https://www.zhihu.com/search?q=%E7%AD%BE%E5%90%8D%E7%AE%97%E6%B3%95&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)（默认为SHA256）根据下述公式生成签名。

```java
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(claims), secret)    ==>   签名hash
```

**签名的作用：**

签名的过程实际上是对头部和负载内容进行签名，**防止内容被窜改**。假如有人对头部和负载的内容解码之后进行修改，再进行编码，最后加上之前的签名组合形成新的JWT的话，这样服务器端可以判断出新的头部和负载形成的签名和JWT附带上的签名是不一样的，这样服务器端就可以知道数据被篡改了。（这是由于签名产生，需要结合头部、负载、以及密钥来生成，而密钥保存在服务器端，无法获取）

在计算出签名哈希后，JWT头，有效载荷和签名哈希的三个部分组合成一个字符串，每个部分用“.”分隔，就构成整个JWT对象。

### JWT单点登录流程

1. 首次登陆，客户端向服务器请求令牌，服务器接收客户端发送的用户凭证（如用户名、密码）进行身份校验，校验成功后，服务端生成JWT（有过期时间），将其发送给客户端。
2. 客户端接收JWT令牌后，存储它（通常，客户端将令牌存储在Cookie中）。
3. 之后客户端每次访问服务器的应用资源，都会将[JWT令牌](https://www.zhihu.com/search?q=JWT%E4%BB%A4%E7%89%8C&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)发送给服务器，用以验证客户端身份。
4. 服务端收到JWT令牌，对其进行验证，验证通过，则认为[客户端](https://www.zhihu.com/search?q=%E5%AE%A2%E6%88%B7%E7%AB%AF&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22answer%22%2C%22sourceId%22%3A2982611063%7D)已经被授权访问应用资源，否则拒绝客户端访问。
5. 假如令牌过期，客户端需要重新向服务器端请求新令牌，然后再进行资源访问。