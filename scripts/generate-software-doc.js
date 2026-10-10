const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, TabStopType, TabStopPosition } = require('docx');
const { Packer } = require('docx');

// 配置
const CONFIG = {
  url: 'http://192.0.2.11:8648/',
  username: '***REMOVED***',
  password: '***REMOVED***',
  screenshotDir: path.join(__dirname, '../软著截图'),
  outputDoc: path.join(__dirname, '../软著说明书.docx'),
  viewport: {
    width: 1920,
    height: 1080
  }
};

// 确保截图目录存在
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

// 截图信息记录
const screenshots = [];

/**
 * 等待并截图
 */
async function takeScreenshot(page, name, description, waitTime = 1000) {
  console.log(`📸 正在截图: ${name}`);

  // 等待页面稳定
  await new Promise(resolve => setTimeout(resolve, waitTime));

  // 滚动到顶部
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(resolve => setTimeout(resolve, 500));

  const filename = `${screenshots.length + 1}-${name}.png`;
  const filepath = path.join(CONFIG.screenshotDir, filename);

  await page.screenshot({
    path: filepath,
    fullPage: false
  });

  screenshots.push({
    filename,
    filepath,
    name,
    description,
    order: screenshots.length + 1
  });

  console.log(`✅ 截图完成: ${filename}`);
  return filepath;
}

/**
 * 主要的截图流程
 */
async function captureScreenshots() {
  console.log('🚀 启动浏览器...');

  // 尝试查找系统Chrome
  const possiblePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    process.env.CHROME_PATH
  ].filter(Boolean);

  let executablePath;
  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      executablePath = chromePath;
      console.log(`✅ 找到Chrome: ${chromePath}`);
      break;
    }
  }

  const browser = await puppeteer.launch({
    headless: true, // 使用headless模式更稳定
    executablePath: executablePath, // 使用系统Chrome
    defaultViewport: CONFIG.viewport,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(CONFIG.viewport);

    console.log(`🌐 访问系统: ${CONFIG.url}`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 1. 登录页面截图
    await takeScreenshot(page, '登录界面', '系统登录界面，用户通过输入用户名和密码进行身份认证', 2000);

    // 查找登录表单元素
    console.log('🔍 正在查找登录表单...');

    // 尝试多种可能的登录表单选择器
    let loginSuccess = false;
    const loginAttempts = [
      // 尝试1: 通过name属性
      async () => {
        const usernameInput = await page.$('input[name="username"]');
        const passwordInput = await page.$('input[name="password"]');
        if (usernameInput && passwordInput) {
          await usernameInput.type(CONFIG.username);
          await passwordInput.type(CONFIG.password);
          return true;
        }
        return false;
      },
      // 尝试2: 通过type属性
      async () => {
        const inputs = await page.$$('input[type="text"], input[type="password"]');
        if (inputs.length >= 2) {
          await inputs[0].type(CONFIG.username);
          await inputs[1].type(CONFIG.password);
          return true;
        }
        return false;
      },
      // 尝试3: 通过placeholder
      async () => {
        const usernameInput = await page.$('input[placeholder*="用户"]');
        const passwordInput = await page.$('input[placeholder*="密码"]');
        if (usernameInput && passwordInput) {
          await usernameInput.type(CONFIG.username);
          await passwordInput.type(CONFIG.password);
          return true;
        }
        return false;
      }
    ];

    for (const attempt of loginAttempts) {
      if (await attempt()) {
        console.log('✅ 找到登录表单，正在填写...');
        loginSuccess = true;
        break;
      }
    }

    if (!loginSuccess) {
      console.log('⚠️ 无法自动识别登录表单，需要手动登录');
      console.log('请在浏览器窗口中手动登录，然后按Enter继续...');

      // 等待用户手动登录
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    } else {
      // 查找并点击登录按钮
      const loginButtons = await page.$$('button[type="submit"], button:has-text("登录"), input[type="submit"]');
      if (loginButtons.length > 0) {
        await loginButtons[0].click();
        console.log('✅ 点击登录按钮');
      }

      // 等待导航完成
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
        console.log('⚠️ 导航等待超时，继续执行...');
      });
    }

    // 2. 登录后首页截图
    await new Promise(resolve => setTimeout(resolve, 2000));
    await takeScreenshot(page, '系统首页', '登录成功后的系统主界面，展示主要功能模块入口', 2000);

    // 3. 获取页面上的所有菜单/链接
    console.log('🔍 正在分析页面结构...');
    const menuItems = await page.evaluate(() => {
      const items = [];

      // 查找导航菜单
      const selectors = [
        'nav a',
        '.menu a',
        '.sidebar a',
        'ul.nav li a',
        '[role="navigation"] a',
        '.el-menu a', // Element UI
        '.ant-menu a', // Ant Design
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          const href = el.href;
          if (text && href && !items.some(item => item.text === text)) {
            items.push({ text, href });
          }
        });
        if (items.length > 0) break;
      }

      return items;
    });

    console.log(`📋 找到 ${menuItems.length} 个菜单项`);

    // 4. 遍历主要功能模块（限制数量，避免截图过多）
    const maxModules = Math.min(menuItems.length, 8);
    for (let i = 0; i < maxModules; i++) {
      const item = menuItems[i];
      console.log(`📂 访问模块: ${item.text}`);

      try {
        await page.goto(item.href, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 模块列表页截图
        await takeScreenshot(
          page,
          `${item.text}-列表`,
          `${item.text}模块的数据列表界面，展示查询条件和数据列表`,
          1500
        );

        // 查找"新增"、"添加"等按钮
        const addButtons = await page.$$('button:has-text("新增"), button:has-text("添加"), button:has-text("创建"), a:has-text("新增")');

        if (addButtons.length > 0) {
          console.log(`  🔘 找到新增按钮，点击...`);
          await addButtons[0].click();
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 新增/编辑表单截图
          await takeScreenshot(
            page,
            `${item.text}-新增`,
            `${item.text}模块的新增界面，用户可以填写表单创建新数据`,
            1500
          );

          // 关闭弹窗或返回
          await page.keyboard.press('Escape');
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.log(`  ⚠️ 访问模块失败: ${error.message}`);
      }
    }

    // 5. 尝试查找系统设置、个人中心等
    const systemPages = [
      { name: '个人中心', keywords: ['个人中心', '个人信息', 'profile', 'account'] },
      { name: '系统设置', keywords: ['系统设置', '系统管理', 'settings', 'config'] },
      { name: '操作日志', keywords: ['操作日志', '日志管理', 'logs'] }
    ];

    for (const sysPage of systemPages) {
      for (const keyword of sysPage.keywords) {
        const found = menuItems.find(item =>
          item.text.toLowerCase().includes(keyword.toLowerCase())
        );

        if (found) {
          console.log(`📂 访问: ${sysPage.name}`);
          try {
            await page.goto(found.href, { waitUntil: 'networkidle2', timeout: 15000 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await takeScreenshot(
              page,
              sysPage.name,
              `${sysPage.name}界面`,
              1500
            );
          } catch (error) {
            console.log(`  ⚠️ 访问失败: ${error.message}`);
          }
          break;
        }
      }
    }

    console.log(`\n✅ 截图完成！共 ${screenshots.length} 张`);

  } catch (error) {
    console.error('❌ 截图过程出错:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * 生成Word文档
 */
async function generateWordDocument() {
  console.log('\n📝 开始生成Word文档...');

  const sections = [];

  // 封面
  sections.push({
    properties: {},
    children: [
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: '软件著作权申请',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: '操作说明书',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      }),
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: `申请单位：`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `版本号：V1.0`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `编写日期：${new Date().toISOString().split('T')[0]}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    ]
  });

  // 目录（简化版，手动添加）
  sections.push({
    properties: {},
    children: [
      new Paragraph({
        text: '目录',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: '1. 软件概述',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '2. 用户登录',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '3. 主要功能模块',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '4. 系统管理',
        spacing: { after: 200 }
      })
    ]
  });

  // 1. 软件概述
  sections.push({
    properties: {},
    children: [
      new Paragraph({
        text: '1. 软件概述',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: '1.1 软件基本信息',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        text: '软件名称：[待填写]',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '版本号：V1.0',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '开发语言：[待填写]',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '运行环境：Web浏览器',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '开发单位：[待填写]',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '1.2 软件功能概述',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        text: '本软件是一套基于Web的业务管理系统，主要用于[业务描述]。系统采用B/S架构设计，用户通过浏览器即可访问使用，无需安装客户端软件。',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '系统主要功能包括：用户权限管理、业务数据管理、统计查询、系统配置等核心模块，能够满足日常业务管理的各项需求。',
        spacing: { after: 200 }
      })
    ]
  });

  // 2. 用户登录部分
  const loginScreenshots = screenshots.filter(s =>
    s.name.includes('登录') || s.name.includes('首页')
  );

  const loginChildren = [
    new Paragraph({
      text: '2. 用户登录',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: '2.1 系统登录',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 }
    }),
    new Paragraph({
      text: `用户通过浏览器访问系统地址（${CONFIG.url}），进入系统登录界面。系统采用用户名+密码的认证方式，确保系统访问的安全性。`,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: '操作步骤：',
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: '1. 在浏览器地址栏输入系统访问地址',
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: '2. 在登录界面输入用户名',
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: '3. 输入登录密码',
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: '4. 点击"登录"按钮进入系统',
      spacing: { after: 200 }
    })
  ];

  // 添加登录相关截图
  for (const screenshot of loginScreenshots) {
    if (fs.existsSync(screenshot.filepath)) {
      const imageBuffer = fs.readFileSync(screenshot.filepath);
      loginChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: 550,
                height: 310
              }
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: `图2-${screenshot.order} ${screenshot.name}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: screenshot.description,
          spacing: { after: 400 }
        })
      );
    }
  }

  sections.push({
    properties: {},
    children: loginChildren
  });

  // 3. 主要功能模块
  const moduleScreenshots = screenshots.filter(s =>
    !s.name.includes('登录') && !s.name.includes('首页') && !s.name.includes('个人中心') && !s.name.includes('系统')
  );

  const moduleChildren = [
    new Paragraph({
      text: '3. 主要功能模块',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: '本章节介绍系统的主要功能模块，包括数据管理、查询统计等核心业务功能。',
      spacing: { after: 400 }
    })
  ];

  // 按模块分组
  const modules = {};
  moduleScreenshots.forEach(s => {
    const moduleName = s.name.split('-')[0];
    if (!modules[moduleName]) {
      modules[moduleName] = [];
    }
    modules[moduleName].push(s);
  });

  let moduleIndex = 1;
  for (const [moduleName, screens] of Object.entries(modules)) {
    moduleChildren.push(
      new Paragraph({
        text: `3.${moduleIndex} ${moduleName}模块`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: `${moduleName}模块用于管理${moduleName}相关的业务数据。用户可以查看、新增、编辑和删除${moduleName}信息，并支持按多种条件进行查询和筛选。`,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '主要功能包括：',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `1. 查看${moduleName}列表`,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `2. 新增${moduleName}信息`,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `3. 编辑${moduleName}数据`,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `4. 删除${moduleName}记录`,
        spacing: { after: 200 }
      })
    );

    for (const screenshot of screens) {
      if (fs.existsSync(screenshot.filepath)) {
        const imageBuffer = fs.readFileSync(screenshot.filepath);
        moduleChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 550,
                  height: 310
                }
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: `图3-${moduleIndex}-${screens.indexOf(screenshot) + 1} ${screenshot.name}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: screenshot.description,
            spacing: { after: 400 }
          })
        );
      }
    }

    moduleIndex++;
  }

  sections.push({
    properties: {},
    children: moduleChildren
  });

  // 4. 系统管理
  const systemScreenshots = screenshots.filter(s =>
    s.name.includes('个人中心') || s.name.includes('系统') || s.name.includes('设置') || s.name.includes('日志')
  );

  if (systemScreenshots.length > 0) {
    const systemChildren = [
      new Paragraph({
        text: '4. 系统管理',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: '本章节介绍系统的管理功能，包括个人信息管理、系统配置、操作日志等。',
        spacing: { after: 400 }
      })
    ];

    for (const screenshot of systemScreenshots) {
      if (fs.existsSync(screenshot.filepath)) {
        const imageBuffer = fs.readFileSync(screenshot.filepath);
        systemChildren.push(
          new Paragraph({
            text: `4.${systemScreenshots.indexOf(screenshot) + 1} ${screenshot.name}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: screenshot.description,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 550,
                  height: 310
                }
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: `图4-${systemScreenshots.indexOf(screenshot) + 1} ${screenshot.name}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );
      }
    }

    sections.push({
      properties: {},
      children: systemChildren
    });
  }

  // 创建文档
  const doc = new Document({
    sections: sections
  });

  // 保存文档
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(CONFIG.outputDoc, buffer);

  console.log(`✅ Word文档生成成功: ${CONFIG.outputDoc}`);
  console.log(`📊 文档包含 ${screenshots.length} 张截图`);
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('========================================');
    console.log('   软著说明书自动生成工具');
    console.log('========================================\n');

    console.log('配置信息:');
    console.log(`  系统地址: ${CONFIG.url}`);
    console.log(`  用户名: ${CONFIG.username}`);
    console.log(`  截图目录: ${CONFIG.screenshotDir}`);
    console.log(`  输出文档: ${CONFIG.outputDoc}`);
    console.log('');

    // 步骤1: 截图
    await captureScreenshots();

    // 步骤2: 生成Word文档
    await generateWordDocument();

    console.log('\n========================================');
    console.log('✅ 全部完成！');
    console.log('========================================');
    console.log(`\n📁 截图保存在: ${CONFIG.screenshotDir}`);
    console.log(`📄 Word文档: ${CONFIG.outputDoc}`);

  } catch (error) {
    console.error('\n❌ 执行失败:', error);
    process.exit(1);
  }
}

// 运行
main();
