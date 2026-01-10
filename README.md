# 语义猜词游戏

基于 Word2Vec 的中文语义猜词游戏，类似于 Semantle。

## 游戏介绍

系统会随机选择一个目标词，你需要通过猜测词语并获得语义相似度反馈来找到它。相似度分数越高，说明你猜的词与目标词在语义上越接近。

## 技术栈

- **后端**: Python Flask + Gensim Word2Vec
- **前端**: HTML5 + CSS3 + JavaScript
- **词向量**: 中文预训练模型

## 快速开始

### 1. 下载词向量模型

推荐使用腾讯 AI Lab 或其他中文预训练词向量：

- [腾讯 AI Lab 词向量](https://ai.tencent.com/ailab/nlp/zh/embedding.html)
- [中文 Word2Vec 模型集合](https://github.com/Embedding/Chinese-Word-Vectors)

下载后将模型文件放到 `backend/model/` 目录。

### 2. 安装依赖

```bash
cd backend
uv sync
```

### 3. 配置模型路径

编辑 `backend/app.py`，设置 `MODEL_PATH` 为你的模型文件路径：

```python
MODEL_PATH = "models/your_model.bin"
```

或通过环境变量设置：

```bash
set WORD2VEC_MODEL_PATH=path/to/your/model.bin
```

### 4. 启动后端服务

```bash
cd backend
uv run python app.py
```

### 5. 打开游戏

在浏览器中打开 `frontend/index.html`

## 项目结构

```
semantic guessing game/
├── backend/
│   ├── app.py           # Flask API 服务
│   ├── game.py          # 游戏核心逻辑
│   ├── pyproject.toml   # Python 项目配置
│   └── models/          # 词向量模型目录
└── frontend/
    ├── index.html       # 游戏页面
    ├── styles.css       # 样式文件
    └── app.js           # 交互逻辑
```

## API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/load-model` | POST | 加载模型 |
| `/api/new-game` | POST | 开始新游戏 |
| `/api/guess` | POST | 提交猜测 |
| `/api/hint` | GET | 获取提示 |
| `/api/give-up` | POST | 放弃游戏 |
| `/api/history` | GET | 获取历史 |

## License

MIT
