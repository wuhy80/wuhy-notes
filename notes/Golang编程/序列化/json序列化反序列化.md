
# 无法将 string 转换为 int 的问题
https://codesahara.com/blog/golang-cannot-unmarshal-string-into-go-value-of-type-int/
ts 本来应该转换的 json 为 int 格式，但是转换成字符串了，这个时候出现了 Go 无法解析的问题。如下图，两个端口，21 的时候就是数字格式，但是到了 2100 就变成字符串了
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404101142968.png)
这个时候如果后台定义的还是数字格式就无法解析，报下面的错误
`json: cannot unmarshal string into Go struct field FtpHostConfigStru.local_host.port of type int`
![image.png](https://wuhy-1258420163.cos.ap-shanghai.myqcloud.com/obsidian/images/2024/group_1/202404101143188.png)

## 举个例子
```go
	type Item struct {
		Name   string `json:"name"`
		ItemId int    `json:"item_id"`
	}
	jsonData:= []byte(`{"name":"item 1","item_id":"30"}`)
	var item Item
	err:=json.Unmarshal(jsonData,&item)
	if err!=nil {
		log.Fatal(err)
	}
```
就会报上面的错误。解决方式是自定义 json 反序列化工具

```go
// StringInt create a type alias for type int
type StringInt int

// UnmarshalJSON create a custom unmarshal for the StringInt
/// this helps us check the type of our value before unmarshalling it

func (st *StringInt) UnmarshalJSON(b []byte) error {
    //convert the bytes into an interface
	//this will help us check the type of our value
	//if it is a string that can be converted into an int we convert it
	///otherwise we return an error
	var item interface{}
	if err := json.Unmarshal(b, &item); err != nil {
		return err
	}
	switch v := item.(type) {
	case int:
		*st = StringInt(v)
	case float64:
		*st = StringInt(int(v))
	case string:
		///here convert the string into
		///an integer
		i, err := strconv.Atoi(v)
		if err != nil {
			///the string might not be of integer type
			///so return an error
			return err

		}
		*st = StringInt(i)

	}
	return nil
}

func main() {

 //We can now send our item as either an int or string without getting any error
	type Item struct {
		Name   string    `json:"name"`
		ItemId StringInt `json:"item_id"`
	}
	jsonData := []byte(`{"name":"item 1","item_id":"30"}`)
	var item Item
	err := json.Unmarshal(jsonData, &item)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%+v\n", item)
}
```
转换之后的 port 在使用的时候，需要用 int 进行强制转换. 例如 int(localhost.port) 的方式

