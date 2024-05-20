---
🌻日期🌻: 2024-05-20
🌙星期🌙: 星期一
⌚️时间⌚️: 17:07:21
tags: 
---
除了使用 HTML 的 `<ruby>` 标签和 JavaScript 来注释生词外，还有其他一些优秀的工具和方法可以用于注解生词并进行学习。以下是几种推荐的方法：

### 1. 使用 `Tippy.js` 实现注解

[Tippy.js](https://atomiks.github.io/tippyjs/) 是一个强大的 Tooltip 库，可以用来实现鼠标悬停时显示注释。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tippy.js Example</title>
    <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css">
    <style>
        .tooltip {
            cursor: pointer;
            color: blue;
            border-bottom: 1px dashed blue;
        }
    </style>
</head>
<body>
    <h1>Tippy.js Example</h1>
    <p id="text">Joe Biden imposed another round of <span class="tooltip" data-tippy-content="关税">tariffs</span> on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese <span class="tooltip" data-tippy-content="电动车 (Electric Vehicles)">EVs</span> but Mr Biden suggested his steps were <span class="tooltip" data-tippy-content="先发制人的">pre-emptive</span>. Chinese carmakers are <span class="tooltip" data-tippy-content="扩展">expanding</span> in Europe.</p>

    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <script src="https://unpkg.com/tippy.js@6"></script>
    <script>
        tippy('.tooltip');
    </script>
</body>
</html>
```

### 2. 使用 `annotator.js` 实现注解

[annotator.js](https://github.com/openannotation/annotator) 是一个用于网页注释的 JavaScript 库，可以用来标注文本并添加注释。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Annotator.js Example</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/annotator@2.0.0-alpha.7/annotator.min.css">
</head>
<body>
    <h1>Annotator.js Example</h1>
    <p id="text">Joe Biden imposed another round of tariffs on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese EVs but Mr Biden suggested his steps were pre-emptive. Chinese carmakers are expanding in Europe.</p>

    <script src="https://cdn.jsdelivr.net/npm/annotator@2.0.0-alpha.7/annotator.min.js"></script>
    <script>
        var annotator = new Annotator(document.getElementById('text'));
        annotator.addPlugin('Tags');
    </script>
</body>
</html>
```

### 3. 使用 `bootstrap-tooltip` 实现注解

[Bootstrap](https://getbootstrap.com/) 的 Tooltip 功能可以用来实现注释，适合已经使用 Bootstrap 框架的项目。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bootstrap Tooltip Example</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <h1>Bootstrap Tooltip Example</h1>
    <p>Joe Biden imposed another round of <span data-bs-toggle="tooltip" data-bs-placement="top" title="关税">tariffs</span> on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese <span data-bs-toggle="tooltip" data-bs-placement="top" title="电动车 (Electric Vehicles)">EVs</span> but Mr Biden suggested his steps were <span data-bs-toggle="tooltip" data-bs-placement="top" title="先发制人的">pre-emptive</span>. Chinese carmakers are <span data-bs-toggle="tooltip" data-bs-placement="top" title="扩展">expanding</span> in Europe.</p>

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js"></script>
    <script>
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    </script>
</body>
</html>
```

### 4. 使用 `highlight.js` 和 `tooltip.js` 实现注解

结合 [highlight.js](https://highlightjs.org/) 和 [tooltip.js](https://github.com/HubSpot/tooltip) 可以实现复杂的注释功能。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Highlight.js and Tooltip.js Example</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.3.1/styles/default.min.css">
    <style>
        .tooltip {
            position: relative;
            cursor: pointer;
            color: blue;
            border-bottom: 1px dashed blue;
        }
        .tooltip .tooltiptext {
            visibility: hidden;
            width: 120px;
            background-color: black;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 0;
            position: absolute;
            z-index: 1;
            bottom: 150%;
            left: 50%;
            margin-left: -60px;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }
    </style>
</head>
<body>
    <h1>Highlight.js and Tooltip.js Example</h1>
    <p>Joe Biden imposed another round of <span class="tooltip">tariffs<span class="tooltiptext">关税</span></span> on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese <span class="tooltip">EVs<span class="tooltiptext">电动车 (Electric Vehicles)</span></span> but Mr Biden suggested his steps were <span class="tooltip">pre-emptive<span class="tooltiptext">先发制人的</span></span>. Chinese carmakers are <span class="tooltip">expanding<span class="tooltiptext">扩展</span></span> in Europe.</p>

    <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.3.1/lib/highlight.js"></script>
    <script>hljs.highlightAll();</script>
</body>
</html>
```

### 总结

上述方法都可以用于实现生词注解，帮助用户更好地学习和理解英文文章。根据你的需求和使用的技术栈，可以选择最适合的工具和方法来实现这个功能。




当然，除了之前提到的方法，还有一些其他的技术和工具可以实现类似于 Kindle Word Wise 的效果。以下是一些更多的选项：

### 1. 使用 `Popper.js` 实现注释

[Popper.js](https://popper.js.org/) 是一个强大的库，用于管理 tooltip 和 popover 的位置，可以用来实现鼠标悬停时显示注释。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Popper.js Example</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tippy.js/6.3.1/tippy.css">
    <style>
        .tooltip {
            cursor: pointer;
            color: blue;
            border-bottom: 1px dashed blue;
        }
    </style>
</head>
<body>
    <h1>Popper.js Example</h1>
    <p>Joe Biden imposed another round of <span class="tooltip" data-tippy-content="关税">tariffs</span> on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese <span class="tooltip" data-tippy-content="电动车 (Electric Vehicles)">EVs</span> but Mr Biden suggested his steps were <span class="tooltip" data-tippy-content="先发制人的">pre-emptive</span>. Chinese carmakers are <span class="tooltip" data-tippy-content="扩展">expanding</span> in Europe.</p>

    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <script src="https://unpkg.com/tippy.js@6"></script>
    <script>
        tippy('.tooltip');
    </script>
</body>
</html>
```

### 2. 使用 `highlight.js` 和 `Tooltipster` 实现注释

[highlight.js](https://highlightjs.org/) 和 [Tooltipster](https://iamceege.github.io/tooltipster/) 可以结合使用来创建复杂的注释效果。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Highlight.js and Tooltipster Example</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tooltipster/4.2.8/css/tooltipster.bundle.min.css">
    <style>
        .tooltip {
            cursor: pointer;
            color: blue;
            border-bottom: 1px dashed blue;
        }
    </style>
</head>
<body>
    <h1>Highlight.js and Tooltipster Example</h1>
    <p>Joe Biden imposed another round of <span class="tooltip" title="关税">tariffs</span> on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese <span class="tooltip" title="电动车 (Electric Vehicles)">EVs</span> but Mr Biden suggested his steps were <span class="tooltip" title="先发制人的">pre-emptive</span>. Chinese carmakers are <span class="tooltip" title="扩展">expanding</span> in Europe.</p>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tooltipster/4.2.8/js/tooltipster.bundle.min.js"></script>
    <script>
        $(document).ready(function() {
            $('.tooltip').tooltipster();
        });
    </script>
</body>
</html>
```

### 3. 使用 `Bootstrap Popovers` 实现注释

[Bootstrap](https://getbootstrap.com/) 的 Popover 功能可以用来实现注释，适合已经使用 Bootstrap 框架的项目。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bootstrap Popover Example</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .popover {
            max-width: 200px;
        }
    </style>
</head>
<body>
    <h1>Bootstrap Popover Example</h1>
    <p>Joe Biden imposed another round of <span data-bs-toggle="popover" data-bs-trigger="hover" title="Tariffs" data-bs-content="关税">tariffs</span> on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese <span data-bs-toggle="popover" data-bs-trigger="hover" title="EVs" data-bs-content="电动车 (Electric Vehicles)">EVs</span> but Mr Biden suggested his steps were <span data-bs-toggle="popover" data-bs-trigger="hover" title="Pre-emptive" data-bs-content="先发制人的">pre-emptive</span>. Chinese carmakers are <span data-bs-toggle="popover" data-bs-trigger="hover" title="Expanding" data-bs-content="扩展">expanding</span> in Europe.</p>

    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js"></script>
    <script>
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
    </script>
</body>
</html>
```

### 4. 使用 `balloon.css` 实现注释

[balloon.css](https://kazzkiq.github.io/balloon.css/) 是一个纯 CSS 的 Tooltip 库，适合需要快速实现轻量级注释的场景。

#### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balloon.css Example</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/balloon-css/balloon.min.css">
    <style>
        .tooltip {
            cursor: pointer;
            color: blue;
            border-bottom: 1px dashed blue;
        }
    </style>
</head>
<body>
    <h1>Balloon.css Example</h1>
    <p>Joe Biden imposed another round of <span class="tooltip" aria-label="关税" data-balloon-pos="up">tariffs</span> on Chinese exports to America, most notably increasing the duties on to 100%. America imports relatively few Chinese <span class="tooltip" aria-label="电动车 (Electric Vehicles)" data-balloon-pos="up">EVs</span> but Mr Biden suggested his steps were <span class="tooltip" aria-label="先发制人的" data-balloon-pos="up">pre-emptive</span>. Chinese carmakers are <span class="tooltip" aria-label="扩展" data-balloon-pos="up">expanding</span> in Europe.</p>
</body>
</html>
```

### 总结

上述方法都可以用于实现生词注解，帮助用户更好地学习和理解英文文章。根据你的需求和使用的技术栈，可以选择最适合的工具和方法来实现这个功能。无论是使用 Popper.js、Tooltipster、Bootstrap Popover 还是 Balloon.css，都能为你提供丰富的注释效果。