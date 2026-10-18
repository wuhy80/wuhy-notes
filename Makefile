.PHONY: setup run build clean

QUARTZ_DIR := _site/quartz
CONTENT_DIR := _site/content
PORT := 20001
QUARTZ_COMMIT := 97a2d05f80c4c50534959b1d0d41cc4b3895625e

setup:
	@echo "=== 安装 Quartz 与依赖 ==="
	@mkdir -p _site
	@if [ ! -d "$(QUARTZ_DIR)/.git" ]; then \
		echo "克隆 Quartz..."; \
		git clone https://github.com/jackyzha0/quartz.git $(QUARTZ_DIR); \
		cd $(QUARTZ_DIR) && git checkout $(QUARTZ_COMMIT); \
	fi
	@echo "安装 Quartz 依赖..."
	@cd $(QUARTZ_DIR) && npm install
	@echo "安装主题包..."
	@cd $(QUARTZ_DIR) && npm install "@quartz-themes/core@^2.0.0" "@quartz-themes/claude-paper@^1.0.1" "@quartz-themes/minimal@^1.0.1"
	@echo "复制配置文件..."
	@cp scripts/quartz.config.yaml $(QUARTZ_DIR)/quartz.config.yaml
	@cp scripts/site-custom.scss $(QUARTZ_DIR)/quartz/styles/custom.scss
	@mkdir -p $(QUARTZ_DIR)/quartz/static/font
	@cp scripts/site-assets/AlimamaShuHeiTi-Bold.woff2 $(QUARTZ_DIR)/quartz/static/font/
	@echo "✅ 安装完成！"

run: setup
	@echo "=== 停止旧的 Quartz 服务器 ==="
	@pkill -f "quartz build --serve --port $(PORT)" 2>/dev/null || true
	@sleep 1
	@echo "=== 导出笔记到 content 目录 ==="
	@./scripts/export-local.sh
	@echo "=== 启动 Quartz 预览服务器（端口 $(PORT)）==="
	@echo "访问地址："
	@echo "  本机：http://localhost:$(PORT)"
	@echo "  局域网：http://$$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $$1}'):$(PORT)"
	@cd $(QUARTZ_DIR) && npx quartz build --serve --port $(PORT) -d ../../$(CONTENT_DIR)

build: setup
	@echo "=== 导出笔记到 content 目录 ==="
	@./scripts/export-local.sh
	@echo "=== 构建静态站点 ==="
	@cd $(QUARTZ_DIR) && npx quartz build -d ../../$(CONTENT_DIR)
	@echo "✅ 构建完成！产物在 $(QUARTZ_DIR)/public/"

clean:
	@echo "=== 清理构建产物 ==="
	@rm -rf $(QUARTZ_DIR)/public $(CONTENT_DIR)
	@echo "✅ 清理完成！"

clean-all:
	@echo "=== 删除 Quartz 与所有构建产物 ==="
	@rm -rf _site
	@echo "✅ 完全清理完成！"
