"""
语义猜词游戏 Flask API 服务
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from game import SemanticGame

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 模型路径 - 可通过环境变量配置
MODEL_PATH = os.environ.get(
    "WORD2VEC_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "model", "tencent-ailab-embedding-zh-d100-v0.2.0-s.txt")
)

# 游戏实例（简化版，单用户）
# 生产环境应使用会话或数据库管理多用户状态
game = SemanticGame(model_path=MODEL_PATH)


@app.route("/api/health", methods=["GET"])
def health_check():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "model_loaded": game.model is not None
    })


@app.route("/api/load-model", methods=["POST"])
def load_model():
    """加载Word2Vec模型"""
    success = game.load_model()
    if success:
        return jsonify({"success": True, "message": "模型加载成功"})
    else:
        return jsonify({
            "success": False, 
            "error": "模型加载失败，请检查模型文件路径"
        }), 500


@app.route("/api/new-game", methods=["POST"])
def new_game():
    """开始新游戏"""
    result = game.start_new_game()
    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400


@app.route("/api/guess", methods=["POST"])
def guess():
    """处理猜测"""
    data = request.get_json()
    if not data or "word" not in data:
        return jsonify({"success": False, "error": "请提供猜测词语"}), 400
    
    word = data["word"]
    result = game.guess(word)
    
    if result["success"]:
        # 附加历史记录
        result["history"] = game.get_history()
        return jsonify(result)
    else:
        return jsonify(result), 400


@app.route("/api/hint", methods=["GET"])
def get_hint():
    """获取提示"""
    result = game.get_hint()
    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400


@app.route("/api/give-up", methods=["POST"])
def give_up():
    """放弃游戏"""
    result = game.give_up()
    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400


@app.route("/api/history", methods=["GET"])
def get_history():
    """获取猜测历史"""
    return jsonify({
        "success": True,
        "history": game.get_history()
    })


def main():
    """主入口"""
    print("=" * 50)
    print("语义猜词游戏服务启动中...")
    print(f"模型路径: {MODEL_PATH}")
    print("=" * 50)
    
    # 预加载模型
    game.load_model()
    
    # 启动服务
    app.run(host="0.0.0.0", port=5000, debug=True)


if __name__ == "__main__":
    main()
