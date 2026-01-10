/**
 * 语义猜词游戏 - 前端交互逻辑
 */

// API 配置
const API_BASE = 'http://localhost:5000/api';

// DOM 元素
const elements = {
    guessInput: document.getElementById('guess-input'),
    guessBtn: document.getElementById('guess-btn'),
    newGameBtn: document.getElementById('new-game-btn'),
    hintBtn: document.getElementById('hint-btn'),
    giveUpBtn: document.getElementById('give-up-btn'),
    statusMessage: document.getElementById('status-message'),
    attemptsCount: document.getElementById('attempts-count'),
    bestScore: document.getElementById('best-score'),
    historyList: document.getElementById('history-list'),
    winModal: document.getElementById('win-modal'),
    giveupModal: document.getElementById('giveup-modal'),
    answerWord: document.getElementById('answer-word'),
    modalAttempts: document.getElementById('modal-attempts'),
    giveupAnswerWord: document.getElementById('giveup-answer-word'),
    giveupAttempts: document.getElementById('giveup-attempts'),
    playAgainBtn: document.getElementById('play-again-btn'),
    tryAgainBtn: document.getElementById('try-again-btn'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text'),
};

// 游戏状态
let gameState = {
    isPlaying: false,
    attempts: 0,
    bestScore: 0,
    history: [],
};

/**
 * API 请求封装
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API请求失败:', error);
        return { success: false, error: '网络连接失败，请检查后端服务是否启动' };
    }
}

/**
 * 显示加载遮罩
 */
function showLoading(text = '加载中...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.add('show');
}

/**
 * 隐藏加载遮罩
 */
function hideLoading() {
    elements.loadingOverlay.classList.remove('show');
}

/**
 * 更新状态消息
 */
function updateStatus(message, icon = '🎯') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.previousElementSibling.textContent = icon;
}

/**
 * 设置游戏控件状态
 */
function setGameControls(enabled) {
    elements.guessInput.disabled = !enabled;
    elements.guessBtn.disabled = !enabled;
    elements.hintBtn.disabled = !enabled;
    elements.giveUpBtn.disabled = !enabled;

    if (enabled) {
        elements.guessInput.focus();
    }
}

/**
 * 获取分数等级样式类
 */
function getScoreClass(score) {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
}

/**
 * 获取排名样式类
 */
function getRankClass(rank) {
    if (rank === 1) return 'top-1';
    if (rank === 2) return 'top-2';
    if (rank === 3) return 'top-3';
    return '';
}

/**
 * 渲染历史记录
 */
function renderHistory(history) {
    if (!history || history.length === 0) {
        elements.historyList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>还没有猜测记录</p>
                <p class="empty-hint">开始游戏后，你的猜测将显示在这里</p>
            </div>
        `;
        return;
    }

    // 按相似度排序
    const sorted = [...history].sort((a, b) => b.similarity - a.similarity);

    elements.historyList.innerHTML = sorted.map((item, index) => {
        const rank = index + 1;
        const scoreClass = getScoreClass(item.similarity);
        const rankClass = getRankClass(rank);

        return `
            <div class="history-item ${scoreClass}">
                <div class="history-rank ${rankClass}">${rank}</div>
                <div class="history-word">${escapeHtml(item.word)}</div>
                <div class="history-score-container">
                    <div class="history-bar">
                        <div class="history-bar-fill" style="width: ${item.similarity}%"></div>
                    </div>
                    <div class="history-score">${item.similarity.toFixed(1)}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * HTML转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 更新统计信息
 */
function updateStats() {
    elements.attemptsCount.textContent = gameState.attempts;
    elements.bestScore.textContent = gameState.bestScore > 0
        ? gameState.bestScore.toFixed(1)
        : '-';
}

/**
 * 显示胜利弹窗
 */
function showWinModal(word, attempts) {
    elements.answerWord.textContent = word;
    elements.modalAttempts.textContent = attempts;
    elements.winModal.classList.add('show');
}

/**
 * 显示放弃弹窗
 */
function showGiveUpModal(word, attempts) {
    elements.giveupAnswerWord.textContent = word;
    elements.giveupAttempts.textContent = attempts;
    elements.giveupModal.classList.add('show');
}

/**
 * 隐藏所有弹窗
 */
function hideModals() {
    elements.winModal.classList.remove('show');
    elements.giveupModal.classList.remove('show');
}

/**
 * 开始新游戏
 */
async function startNewGame() {
    showLoading('正在准备游戏...');

    const result = await apiRequest('/new-game', 'POST');

    hideLoading();

    if (result.success) {
        gameState = {
            isPlaying: true,
            attempts: 0,
            bestScore: 0,
            history: [],
        };

        updateStatus('游戏开始！请输入你的第一个猜测', '🎮');
        setGameControls(true);
        renderHistory([]);
        updateStats();
        hideModals();

        elements.guessInput.value = '';
        elements.guessInput.focus();
    } else {
        updateStatus(result.error || '游戏启动失败', '❌');

        // 如果模型未加载，尝试加载
        if (result.error && result.error.includes('模型')) {
            showLoading('正在加载Word2Vec模型，请稍候...');
            const loadResult = await apiRequest('/load-model', 'POST');
            hideLoading();

            if (loadResult.success) {
                // 重新尝试开始游戏
                await startNewGame();
            } else {
                updateStatus('模型加载失败: ' + (loadResult.error || '未知错误'), '❌');
            }
        }
    }
}

/**
 * 提交猜测
 */
async function submitGuess() {
    const word = elements.guessInput.value.trim();

    if (!word) {
        updateStatus('请输入一个词语', '⚠️');
        elements.guessInput.focus();
        return;
    }

    // 禁用输入
    elements.guessBtn.disabled = true;
    elements.guessInput.disabled = true;

    const result = await apiRequest('/guess', 'POST', { word });

    // 恢复输入
    elements.guessBtn.disabled = false;
    elements.guessInput.disabled = false;
    elements.guessInput.value = '';
    elements.guessInput.focus();

    if (result.success) {
        // 更新游戏状态
        gameState.attempts = result.attempts;
        gameState.history = result.history || [];

        if (result.similarity > gameState.bestScore) {
            gameState.bestScore = result.similarity;
        }

        updateStats();
        renderHistory(gameState.history);

        if (result.won) {
            // 胜利！
            gameState.isPlaying = false;
            setGameControls(false);
            showWinModal(result.target_word, result.attempts);
            updateStatus('恭喜你猜对了！', '🎉');
        } else {
            // 显示相似度反馈
            const emoji = result.similarity >= 70 ? '🔥' :
                result.similarity >= 40 ? '👍' : '🤔';
            updateStatus(
                `"${word}" 相似度: ${result.similarity.toFixed(1)} 分 (排名 #${result.rank})`,
                emoji
            );
        }
    } else {
        if (result.duplicate) {
            updateStatus(`你已经猜过 "${word}" 了，换一个试试`, '🔄');
        } else {
            updateStatus(result.error || '猜测失败', '❌');
        }
    }
}

/**
 * 获取提示
 */
async function getHint() {
    elements.hintBtn.disabled = true;

    const result = await apiRequest('/hint');

    elements.hintBtn.disabled = false;

    if (result.success) {
        updateStatus(`💡 提示：试试 "${result.hint}" 这个词的方向`, '💡');
    } else {
        updateStatus(result.error || '获取提示失败', '❌');
    }
}

/**
 * 放弃游戏
 */
async function giveUp() {
    if (!confirm('确定要放弃吗？这将显示答案。')) {
        return;
    }

    const result = await apiRequest('/give-up', 'POST');

    if (result.success) {
        gameState.isPlaying = false;
        setGameControls(false);
        showGiveUpModal(result.target_word, result.attempts);
        updateStatus('游戏结束', '🏳️');
    } else {
        updateStatus(result.error || '操作失败', '❌');
    }
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
    // 新游戏按钮
    elements.newGameBtn.addEventListener('click', startNewGame);

    // 猜测按钮
    elements.guessBtn.addEventListener('click', submitGuess);

    // 回车提交
    elements.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !elements.guessBtn.disabled) {
            submitGuess();
        }
    });

    // 提示按钮
    elements.hintBtn.addEventListener('click', getHint);

    // 放弃按钮
    elements.giveUpBtn.addEventListener('click', giveUp);

    // 再玩一局按钮
    elements.playAgainBtn.addEventListener('click', startNewGame);
    elements.tryAgainBtn.addEventListener('click', startNewGame);

    // 点击弹窗外部关闭
    elements.winModal.addEventListener('click', (e) => {
        if (e.target === elements.winModal) {
            hideModals();
        }
    });
    elements.giveupModal.addEventListener('click', (e) => {
        if (e.target === elements.giveupModal) {
            hideModals();
        }
    });
}

/**
 * 检查后端服务状态
 */
async function checkBackendStatus() {
    const result = await apiRequest('/health');

    if (result.status === 'ok') {
        if (!result.model_loaded) {
            updateStatus('Word2Vec模型未加载，点击"开始游戏"自动加载', '⏳');
        } else {
            updateStatus('服务已就绪，点击"开始游戏"开始挑战', '✅');
        }
    } else {
        updateStatus('后端服务未启动，请先运行 python app.py', '❌');
    }
}

/**
 * 应用初始化
 */
function init() {
    initEventListeners();
    checkBackendStatus();

    console.log('🎮 语义猜词游戏已加载');
    console.log('📚 确保后端服务已启动: cd backend && python app.py');
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
