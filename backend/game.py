"""
语义猜词游戏核心逻辑
使用Word2Vec计算词语语义相似度
"""

import os
import random
from typing import Optional
import numpy as np
from gensim.models import KeyedVectors

# 常用中文词汇列表（目标词候选）
COMMON_WORDS = [
    "太阳", "月亮", "星星", "天空", "大海", "山峰", "森林", "河流",
    "春天", "夏天", "秋天", "冬天", "花朵", "树木", "草地", "雨水",
    "音乐", "电影", "书籍", "绘画", "舞蹈", "诗歌", "故事", "梦想",
    "快乐", "幸福", "希望", "勇气", "智慧", "友情", "爱情", "亲情",
    "学校", "医院", "公园", "图书馆", "博物馆", "餐厅", "超市", "银行",
    "电脑", "手机", "汽车", "飞机", "火车", "轮船", "自行车", "摩托车",
    "早餐", "午餐", "晚餐", "水果", "蔬菜", "面包", "牛奶", "咖啡",
    "老师", "医生", "工程师", "艺术家", "科学家", "运动员", "作家", "歌手",
    "足球", "篮球", "游泳", "跑步", "登山", "滑雪", "网球", "乒乓球",
    "猫咪", "小狗", "兔子", "熊猫", "老虎", "狮子", "大象", "长颈鹿",
]


class SemanticGame:
    """语义猜词游戏类"""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        初始化游戏
        
        Args:
            model_path: Word2Vec模型文件路径
        """
        self.model: Optional[KeyedVectors] = None
        self.target_word: Optional[str] = None
        self.guesses: list[dict] = []
        self.game_over: bool = False
        self.model_path = model_path
        
        # 过滤出模型中存在的词汇
        self.valid_words: list[str] = []
        
    def load_model(self) -> bool:
        """加载Word2Vec模型"""
        if self.model is not None:
            return True
            
        try:
            if self.model_path and os.path.exists(self.model_path):
                print(f"正在加载Word2Vec模型: {self.model_path}")
                # 尝试不同的加载方式
                if self.model_path.endswith('.bin'):
                    self.model = KeyedVectors.load_word2vec_format(
                        self.model_path, binary=True
                    )
                else:
                    self.model = KeyedVectors.load_word2vec_format(
                        self.model_path, binary=False
                    )
                print("模型加载完成！")
                
                # 过滤有效词汇
                self.valid_words = [w for w in COMMON_WORDS if w in self.model]
                print(f"有效目标词数量: {len(self.valid_words)}")
                return True
            else:
                print(f"模型文件不存在: {self.model_path}")
                return False
        except Exception as e:
            print(f"模型加载失败: {e}")
            return False
    
    def start_new_game(self) -> dict:
        """开始新游戏"""
        if not self.model:
            if not self.load_model():
                return {"success": False, "error": "模型未加载"}
        
        if not self.valid_words:
            return {"success": False, "error": "没有可用的目标词"}
        
        # 随机选择目标词
        self.target_word = random.choice(self.valid_words)
        self.guesses = []
        self.game_over = False
        
        return {
            "success": True,
            "message": "游戏开始！请输入你的猜测。",
            "total_words": len(self.valid_words)
        }
    
    def calculate_similarity(self, word: str) -> float:
        """
        计算词语与目标词的语义相似度
        
        Args:
            word: 猜测的词语
            
        Returns:
            相似度分数 (0-100)
        """
        if not self.model or not self.target_word:
            return 0.0
            
        try:
            # 计算余弦相似度 (-1 to 1)
            similarity = self.model.similarity(word, self.target_word)
            # 转换为 0-100 分数
            score = max(0, (similarity + 1) / 2 * 100)
            return round(score, 2)
        except KeyError:
            return -1  # 词语不在词表中
    
    def guess(self, word: str) -> dict:
        """
        处理用户猜测
        
        Args:
            word: 猜测的词语
            
        Returns:
            猜测结果
        """
        if self.game_over:
            return {"success": False, "error": "游戏已结束"}
        
        if not self.target_word:
            return {"success": False, "error": "请先开始游戏"}
        
        word = word.strip()
        
        if not word:
            return {"success": False, "error": "请输入有效词语"}
        
        # 检查是否已经猜过
        for g in self.guesses:
            if g["word"] == word:
                return {"success": False, "error": "你已经猜过这个词了", "duplicate": True}
        
        # 检查是否猜中
        if word == self.target_word:
            self.game_over = True
            result = {
                "success": True,
                "word": word,
                "similarity": 100.0,
                "rank": 1,
                "won": True,
                "attempts": len(self.guesses) + 1,
                "target_word": self.target_word
            }
            self.guesses.append({"word": word, "similarity": 100.0})
            return result
        
        # 计算相似度
        similarity = self.calculate_similarity(word)
        
        if similarity < 0:
            return {"success": False, "error": f"'{word}' 不在词表中，请尝试其他词语"}
        
        # 添加到猜测历史
        self.guesses.append({"word": word, "similarity": similarity})
        
        # 计算排名
        sorted_guesses = sorted(self.guesses, key=lambda x: x["similarity"], reverse=True)
        rank = next(i for i, g in enumerate(sorted_guesses, 1) if g["word"] == word)
        
        return {
            "success": True,
            "word": word,
            "similarity": similarity,
            "rank": rank,
            "won": False,
            "attempts": len(self.guesses)
        }
    
    def get_hint(self) -> dict:
        """获取提示（返回一个与目标词相似的词）"""
        if not self.model or not self.target_word:
            return {"success": False, "error": "游戏未开始"}
        
        try:
            similar_words = self.model.most_similar(self.target_word, topn=20)
            # 过滤掉已经猜过的词
            guessed_words = {g["word"] for g in self.guesses}
            available_hints = [w for w, _ in similar_words if w not in guessed_words]
            
            if available_hints:
                hint = random.choice(available_hints[:5])  # 从前5个相似词中选择
                return {"success": True, "hint": hint}
            else:
                return {"success": False, "error": "没有可用的提示"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def give_up(self) -> dict:
        """放弃游戏"""
        if not self.target_word:
            return {"success": False, "error": "游戏未开始"}
        
        self.game_over = True
        return {
            "success": True,
            "target_word": self.target_word,
            "attempts": len(self.guesses)
        }
    
    def get_history(self) -> list[dict]:
        """获取猜测历史（按相似度排序）"""
        return sorted(self.guesses, key=lambda x: x["similarity"], reverse=True)
