---
🌻日期🌻: 2024-09-05
🌙星期🌙: 星期四
⌚️时间⌚️: 13:41:51
tags:
  - xml
  - golang
---


```go
package main

import (
	"fmt"
	"os"

	"github.com/antchfx/xmlquery"
	"github.com/xuri/excelize/v2"
)

func parseMitsuMxUdpNet(mitsuNode *xmlquery.Node, xlsName, sheet string) {
	// 查找 parse 元素
	f := excelize.NewFile()
	f.NewSheet(sheet)
	f.DeleteSheet("Sheet1")

	row := 0
	deviceName := ""
	// 设置表头
	headers := []string{"采集项名称", "功能码", "起始地址", "延时时间", "单位", "数据类型", "偏移量", "倍率", "序列类型", "最大读取长度", "寄存器个数", "设备ID", "设备IP", "PLC端口", "采集周期"}
	for col, header := range headers {
		cell := fmt.Sprintf("%s%d", string('A'+col), 1)
		f.SetCellValue(sheet, cell, header)
	}

	parseNodes := xmlquery.Find(mitsuNode, "parse/*")
	for _, parseNode := range parseNodes {
		// 获取 Address, DataType, FunctionCode 等属性
		address := parseNode.SelectAttr("Address")
		dataType := parseNode.SelectAttr("DataType")
		functionCode := parseNode.SelectAttr("FunctionCode")
		name := parseNode.SelectAttr("Name")
		cycleTime := parseNode.SelectAttr("cycleTime")
		offset := parseNode.SelectAttr("OFFSET")
		sequence := parseNode.SelectAttr("sequence")
		dataLen := parseNode.SelectAttr("len")
		deviceIP := parseNode.SelectAttr("IP")
		multi := parseNode.SelectAttr("Multiple")
		gwPort := parseNode.SelectAttr("gwPort")
		deviceIndex := parseNode.SelectAttr("deviceIndex")
		deviceName = parseNode.SelectAttr("deviceName")

		// 填充数据
		instru_item := xmlquery.Find(mitsuNode, fmt.Sprintf("instruct/%s", parseNode.Data))
		maxReadLen := instru_item[0].SelectAttr("maxReadLen")
		delayMs := instru_item[0].SelectAttr("delayMs")
		if delayMs == "None" {
			delayMs = ""
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row+2), name)         // 采集项名称
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row+2), functionCode) // 功能码
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row+2), address)      // 起始地址
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row+2), delayMs)      // 延时时间
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row+2), "-")          // 单位
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row+2), dataType)     // 数据类型
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row+2), offset)       // 偏移量
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row+2), multi)        // 倍率
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row+2), sequence)     // 序列类型
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row+2), maxReadLen)   // 最大读取长度
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row+2), dataLen)      // 寄存器个数
		f.SetCellValue(sheet, fmt.Sprintf("L%d", row+2), deviceIndex)  // 设备ID
		f.SetCellValue(sheet, fmt.Sprintf("M%d", row+2), deviceIP)     // 设备IP
		f.SetCellValue(sheet, fmt.Sprintf("N%d", row+2), gwPort)       // PLC端口
		f.SetCellValue(sheet, fmt.Sprintf("O%d", row+2), cycleTime)    // 采集周期

		// 输出结果
		fmt.Printf("Address: %s, DataType: %s, FunctionCode: %s, Name: %s\n", address, dataType, functionCode, name)
		row++
	}

	// 保存 Excel 文件
	fileName := fmt.Sprintf("xls/%s_%s_%s.xlsx", xlsName, deviceName, sheet)
	if err := f.SaveAs(fileName); err != nil {
		fmt.Println("Error saving Excel file:", err)
	}
}

func parseMitsuMxNet(mitsuNode *xmlquery.Node, xlsName, sheet string) {
	// 查找 parse 元素
	f := excelize.NewFile()
	f.NewSheet(sheet)
	f.DeleteSheet("Sheet1")

	row := 0

	// 设置表头
	headers := []string{"变量名", "变量类型", "功能码", "起始地址", "寄存器个数", "单位", "设备IP", "偏移量", "倍率", "PLC端口", "采集周期", "序列类型", "最大读取长度", "保留精度", "数据取整方式"}
	for col, header := range headers {
		cell := fmt.Sprintf("%s%d", string('A'+col), 1)
		f.SetCellValue(sheet, cell, header)
	}

	deviceName := ""
	parseNodes := xmlquery.Find(mitsuNode, "parse/*")
	for _, parseNode := range parseNodes {
		// 获取 Address, DataType, FunctionCode 等属性
		address := parseNode.SelectAttr("Address")
		dataType := parseNode.SelectAttr("DataType")
		functionCode := parseNode.SelectAttr("FunctionCode")
		name := parseNode.SelectAttr("Name")
		cycleTime := parseNode.SelectAttr("cycleTime")
		offset := parseNode.SelectAttr("OFFSET")
		sequence := parseNode.SelectAttr("sequence")
		dataLen := parseNode.SelectAttr("len")
		deviceIP := parseNode.SelectAttr("IP")
		multi := parseNode.SelectAttr("Multiple")
		gwPort := parseNode.SelectAttr("gwPort")
		preciousWidth := parseNode.SelectAttr("PreciousWidth")
		roundMethod := parseNode.SelectAttr("RoundMethod")
		deviceName = parseNode.SelectAttr("deviceName")

		// 填充数据
		instru_item := xmlquery.Find(mitsuNode, fmt.Sprintf("instruct/%s", parseNode.Data))
		maxReadLen := instru_item[0].SelectAttr("maxReadLen")

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row+2), name)          // 变量名
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row+2), dataType)      // 变量类型
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row+2), functionCode)  // 功能码
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row+2), address)       // 起始地址
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row+2), dataLen)       // 寄存器个数
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row+2), "-")           // 单位
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row+2), deviceIP)      // 设备IP
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row+2), offset)        // 偏移量
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row+2), multi)         // 倍率
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row+2), gwPort)        // PLC端口
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row+2), cycleTime)     // 采集周期
		f.SetCellValue(sheet, fmt.Sprintf("L%d", row+2), sequence)      // 序列类型
		f.SetCellValue(sheet, fmt.Sprintf("M%d", row+2), maxReadLen)    // 最大读取长度
		f.SetCellValue(sheet, fmt.Sprintf("N%d", row+2), preciousWidth) // 保留精度
		f.SetCellValue(sheet, fmt.Sprintf("O%d", row+2), roundMethod)   // 数据取整方式

		// 输出结果
		fmt.Printf("Address: %s, DataType: %s, FunctionCode: %s, Name: %s\n", address, dataType, functionCode, name)
		row++
	}

	// 保存 Excel 文件
	fileName := fmt.Sprintf("xls/%s_%s_%s.xlsx", xlsName, deviceName, sheet)
	if err := f.SaveAs(fileName); err != nil {
		fmt.Println("Error saving Excel file:", err)
	}
}

func parseNetS7Net(mitsuNode *xmlquery.Node, xlsName, sheet string) {
	// 查找 parse 元素
	f := excelize.NewFile()
	f.NewSheet(sheet)
	f.DeleteSheet("Sheet1")

	row := 0

	// 设置表头
	headers := []string{"变量名", "变量类型", "功能码", "起始地址", "单位", "设备IP", "设备网口号", "偏移量", "倍率", "采集周期", "PLC端口", "寄存器个数", "序列类型", "最大读取长度", "保留精度", "数据取整方式"}
	for col, header := range headers {
		cell := fmt.Sprintf("%s%d", string('A'+col), 1)
		f.SetCellValue(sheet, cell, header)
	}

	deviceName := ""
	parseNodes := xmlquery.Find(mitsuNode, "parse/*")
	for _, parseNode := range parseNodes {
		// 获取 Address, DataType, FunctionCode 等属性
		address := parseNode.SelectAttr("Address")
		dataType := parseNode.SelectAttr("DataType")
		functionCode := parseNode.SelectAttr("FunctionCode")
		name := parseNode.SelectAttr("Name")
		cycleTime := parseNode.SelectAttr("cycleTime")
		offset := parseNode.SelectAttr("OFFSET")
		sequence := parseNode.SelectAttr("sequence")
		dataLen := parseNode.SelectAttr("len")
		deviceIP := parseNode.SelectAttr("IP")
		multi := parseNode.SelectAttr("Multiple")
		gwPort := parseNode.SelectAttr("gwPort")
		preciousWidth := parseNode.SelectAttr("PreciousWidth")
		roundMethod := parseNode.SelectAttr("RoundMethod")
		deviceName = parseNode.SelectAttr("deviceName")

		// 填充数据
		instru_item := xmlquery.Find(mitsuNode, fmt.Sprintf("instruct/%s", parseNode.Data))
		maxReadLen := instru_item[0].SelectAttr("maxReadLen")
		netCard := instru_item[0].SelectAttr("netCard")

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row+2), name)          // 变量名
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row+2), dataType)      // 变量类型
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row+2), functionCode)  // 功能码
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row+2), address)       // 起始地址
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row+2), "-")           // 单位
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row+2), deviceIP)      // 设备IP
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row+2), netCard)       // 设备网口号
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row+2), offset)        // 偏移量
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row+2), multi)         // 倍率
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row+2), cycleTime)     // 采集周期
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row+2), gwPort)        // PLC端口
		f.SetCellValue(sheet, fmt.Sprintf("L%d", row+2), dataLen)       // 寄存器个数
		f.SetCellValue(sheet, fmt.Sprintf("M%d", row+2), sequence)      // 序列类型
		f.SetCellValue(sheet, fmt.Sprintf("N%d", row+2), maxReadLen)    // 最大读取长度
		f.SetCellValue(sheet, fmt.Sprintf("O%d", row+2), preciousWidth) // 保留精度
		f.SetCellValue(sheet, fmt.Sprintf("P%d", row+2), roundMethod)   // 数据取整方式

		// 输出结果
		fmt.Printf("Address: %s, DataType: %s, FunctionCode: %s, Name: %s\n", address, dataType, functionCode, name)
		row++
	}

	// 保存 Excel 文件
	fileName := fmt.Sprintf("xls/%s_%s_%s.xlsx", xlsName, deviceName, sheet)
	if err := f.SaveAs(fileName); err != nil {
		fmt.Println("Error saving Excel file:", err)
	}
}

func parseOPCUA(mitsuNode *xmlquery.Node, xlsName, sheet string) {
	// 查找 parse 元素
	f := excelize.NewFile()
	f.NewSheet(sheet)
	f.DeleteSheet("Sheet1")

	row := 0

	// 设置表头
	headers := []string{"勾选", "采集项名称", "描述", "数据类型", "参数地址", "Ip", "单位", "类型", "采集周期", "用于算法", "一体机UI"}
	for col, header := range headers {
		cell := fmt.Sprintf("%s%d", string('A'+col), 1)
		f.SetCellValue(sheet, cell, header)
	}

	deviceName := ""
	parseNodes := xmlquery.Find(mitsuNode, "/*")
	for _, parseNode := range parseNodes {
		// 获取 Address, DataType, FunctionCode 等属性
		title := parseNode.SelectAttr("Title")
		description := parseNode.SelectAttr("Description")
		nodeClass := parseNode.SelectAttr("nodeClass")
		configValue := parseNode.SelectAttr("configValue")
		ip := parseNode.SelectAttr("Ip")
		cycleTime := parseNode.SelectAttr("cycleTime")
		isAlg := parseNode.SelectAttr("isAlg")
		isDisp := parseNode.SelectAttr("isDisp")
		deviceName = parseNode.SelectAttr("deviceName")

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row+2), "1")         // 勾选
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row+2), title)       // 采集项名称
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row+2), description) // 描述
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row+2), nodeClass)   // 数据类型
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row+2), configValue) // 参数地址
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row+2), ip)          // Ip
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row+2), "-")         // 单位
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row+2), "_1")        // 类型
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row+2), cycleTime)   // 采集周期
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row+2), isAlg)       // 用于算法
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row+2), isDisp)      // 一体机UI

		// 输出结果
		fmt.Printf("title: %s, configValue: %s, ip: %s, cycleTime: %s\n", title, configValue, ip, cycleTime)
		row++
	}

	// 保存 Excel 文件
	fileName := fmt.Sprintf("xls/%s_%s_%s.xlsx", xlsName, deviceName, sheet)
	if err := f.SaveAs(fileName); err != nil {
		fmt.Println("Error saving Excel file:", err)
	}
}

func main() {
	f, err := os.Open("Config.xml")
	if err != nil {
		fmt.Printf("Error opening file: %v", err)
		return
	}

	doc, err := xmlquery.Parse(f)
	if err != nil {
		fmt.Println("Error loading XML file:", err)
		return
	}

	// 使用 XPath 查询所有 exe-* 元素
	exeNodes := xmlquery.Find(doc, "//ManuData/*")

	// 遍历并获取名称
	for _, exeNode := range exeNodes {
		for child := exeNode.FirstChild; child != nil; child = child.NextSibling {
			fmt.Printf("ExeNode:%s FirstChild:%+v\n", exeNode.Data, child.Data)

			if child.Data == "MitsuMxUdpNet" {
				parseMitsuMxUdpNet(child, exeNode.Data, child.Data)
			} else if child.Data == "MitsuMxNet" {
				parseMitsuMxNet(child, exeNode.Data, child.Data)
			} else if child.Data == "OPCUA" {
				parseOPCUA(child, exeNode.Data, child.Data)
			} else if child.Data == "NetS7Net" {
				parseNetS7Net(child, exeNode.Data, child.Data)
			}
		}

	}
}

```