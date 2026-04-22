const questions = [
    { text: "行動する時、あなたは…", options: [{ label: "即行動する", value: 2 }, { label: "慎重に考える", value: -2 }], axis: "action" },
    { text: "物事を判断する時、あなたは…", options: [{ label: "論理的に考える", value: 2 }, { label: "直感で決める", value: -2 }], axis: "thinking" },
    { text: "チームや集団の中では…", options: [{ label: "人を引っ張る", value: 2 }, { label: "人を支える", value: -2 }], axis: "inter" },
    { text: "エネルギーを回復する方法は…", options: [{ label: "人と一緒に過ごす", value: 2 }, { label: "一人で静かに過ごす", value: -2 }], axis: "extra" },
    { text: "感情の表現は…", options: [{ label: "素直に外に出す", value: 2 }, { label: "自分の内に溜める", value: -2 }], axis: "emotion" },
    { text: "環境について…", options: [{ label: "変化や刺激が好き", value: 2 }, { label: "安定と安心が好き", value: -2 }], axis: "change" },
    { text: "仕事や活動で重視するのは…", options: [{ label: "目に見える成果", value: 2 }, { label: "やりがいや意味", value: -2 }], axis: "value" },
    { text: "自分の性格や長所について…", options: [{ label: "よく理解している", value: 2 }, { label: "あまり分かっていない", value: -2 }], axis: "self" }
];

let currentQuestion = 0;
let userAnswers = {};
let userData = {};

function startApp() {
    showScreen('screen-input');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
        setTimeout(() => s.style.display = 'none', 500);
    });
    
    setTimeout(() => {
        const target = document.getElementById(screenId);
        target.style.display = 'block';
        setTimeout(() => {
            target.classList.remove('hidden');
            target.classList.add('active');
        }, 50);
    }, 500);
}

function proceedToQuestions() {
    const dateInput = document.getElementById('birthdate').value;
    const nickname = document.getElementById('nickname').value || "あなた";
    
    if (!dateInput) {
        alert("生年月日を入力してください。");
        return;
    }

    userData = { date: dateInput, nickname: nickname };
    currentQuestion = 0;
    userAnswers = {};
    renderQuestion();
    showScreen('screen-question');
}

function renderQuestion() {
    const q = questions[currentQuestion];
    document.getElementById('q-current').innerText = currentQuestion + 1;
    document.getElementById('q-text').innerText = q.text;
    
    document.getElementById('q-progress').style.width = `${((currentQuestion + 1) / 8) * 100}%`;

    const optionsContainer = document.getElementById('q-options');
    optionsContainer.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.label;
        btn.onclick = () => answerQuestion(q.axis, opt.value);
        optionsContainer.appendChild(btn);
    });
}

function answerQuestion(axis, value) {
    userAnswers[axis] = value;
    currentQuestion++;
    
    if (currentQuestion < questions.length) {
        renderQuestion();
    } else {
        showScreen('screen-loading');
        setTimeout(calculateResult, 2000);
    }
}

function reduceNumber(numStr, keep33 = true) {
    let num = numStr.split('').reduce((a, b) => a + parseInt(b), 0);
    while (num > 9) {
        if (num === 11 || num === 22 || (keep33 && num === 33)) return num;
        num = num.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    }
    return num;
}

function calculateResult() {
    const parts = userData.date.split('-');
    const year = parts[0], month = parts[1], day = parts[2];

    const lifePathStr = year + month + day;
    const lifePath = reduceNumber(lifePathStr, true);

    const innerNumVal = parseInt(day, 10);
    const inner = reduceNumber(innerNumVal.toString(), false);
    
    const themeSum = parseInt(month, 10) + parseInt(day, 10);
    const theme = reduceNumber(themeSum.toString(), true);

    const base = data.baseScores[lifePath] || data.baseScores[1];
    const innerBase = data.baseScores[inner] || data.baseScores[1];

    let finalScores = {};
    const axes = ["action", "thinking", "inter", "extra", "emotion", "change", "value", "self"];
    
    axes.forEach(axis => {
        let score = base[axis];
        
        // Inner modifier
        if (data.innerModifiers[axis]) {
            if (innerBase[axis] > 0) score += data.innerModifiers[axis];
            if (innerBase[axis] < 0) score -= data.innerModifiers[axis];
        }

        // Question modifier
        if (userAnswers[axis]) {
            score += userAnswers[axis];
        }

        finalScores[axis] = score;
    });

    // Determine Type
    const isLeader = finalScores.inter >= 0;
    const isExtrovert = finalScores.extra >= 0;
    const isLogical = finalScores.thinking >= 0;

    let typeKey = "";
    if (isLeader) {
        if (isExtrovert) typeKey = isLogical ? "戦略型リーダー" : "カリスマ型リーダー";
        else typeKey = isLogical ? "統率型エキスパート" : "信念型ビジョナリー";
    } else {
        if (isExtrovert) typeKey = isLogical ? "調整型コミュニケーター" : "共感型サポーター";
        else typeKey = isLogical ? "分析型アドバイザー" : "献身型ヒーラー";
    }

    // Hidden Type check
    const baseIsLeader = base.inter >= 0;
    let hiddenType = null;
    if (baseIsLeader !== isLeader) {
        // Find what the type would be without question modifications
        const origExtrovert = base.extra >= 0;
        const origLogical = base.thinking >= 0;
        if (baseIsLeader) {
            if (origExtrovert) hiddenType = origLogical ? "戦略型リーダー" : "カリスマ型リーダー";
            else hiddenType = origLogical ? "統率型エキスパート" : "信念型ビジョナリー";
        } else {
            if (origExtrovert) hiddenType = origLogical ? "調整型コミュニケーター" : "共感型サポーター";
            else hiddenType = origLogical ? "分析型アドバイザー" : "献身型ヒーラー";
        }
    }

    // Theme Conflict check
    let conflictMsg = null;
    const themeBase = data.baseScores[theme];
    if (themeBase) {
        // Find the strongest trait in the theme's base scores
        let strongestAxis = null;
        let maxAbs = -1;
        axes.forEach(axis => {
            if (Math.abs(themeBase[axis]) > maxAbs) {
                maxAbs = Math.abs(themeBase[axis]);
                strongestAxis = axis;
            }
        });

        if (strongestAxis) {
            // Check if user's final score on this axis is opposite
            const isThemePositive = themeBase[strongestAxis] > 0;
            const isUserPositive = finalScores[strongestAxis] >= 0;
            
            if (isThemePositive !== isUserPositive) {
                const traitNames = {
                    action: isThemePositive ? "即行動" : "慎重さ",
                    thinking: isThemePositive ? "論理的思考" : "直感",
                    inter: isThemePositive ? "リーダーシップ" : "サポート",
                    extra: isThemePositive ? "外向性" : "内向性",
                    emotion: isThemePositive ? "感情表現" : "感情内包",
                    change: isThemePositive ? "変化への適応" : "安定",
                    value: isThemePositive ? "成果主義" : "意味の探求",
                    self: isThemePositive ? "自己肯定" : "自己探求"
                };
                conflictMsg = `※葛藤サイン: 本来のテーマは「${traitNames[strongestAxis]}」を求めていますが、現在の性質と逆方向のため、ここに人生の葛藤や課題が現れやすいです。`;
            }
        }
    }

    displayResult(typeKey, finalScores, hiddenType, theme, conflictMsg);
}

function displayResult(typeKey, scores, hiddenType, themeNum, conflictMsg) {
    const typeInfo = data.types[typeKey];
    
    document.getElementById('res-nickname').innerText = `${userData.nickname} さんの診断結果`;
    document.getElementById('res-type').innerText = typeInfo.title;
    document.getElementById('res-desc').innerText = typeInfo.desc;
    
    document.getElementById('res-strengths').innerHTML = typeInfo.strengths.map(s => `<li>${s}</li>`).join('');
    document.getElementById('res-weaknesses').innerHTML = typeInfo.weaknesses.map(s => `<li>${s}</li>`).join('');
    
    document.getElementById('res-inner').innerText = typeInfo.inner;
    document.getElementById('res-theme').innerText = `Theme ${themeNum}: ${data.themes[themeNum]}`;
    
    const conflictEl = document.getElementById('res-conflict');
    if (conflictMsg) {
        conflictEl.innerText = conflictMsg;
        conflictEl.classList.remove('hidden');
    } else {
        conflictEl.classList.add('hidden');
    }

    document.getElementById('res-awakening').innerText = typeInfo.awakening;
    document.getElementById('res-romance').innerText = typeInfo.romance;

    if (hiddenType) {
        const hAlert = document.getElementById('res-hidden-type');
        hAlert.classList.remove('hidden');
        document.getElementById('hidden-type-name').innerText = hiddenType;
    }

    // Draw Radar Chart
    drawRadar(scores);

    showScreen('screen-result');
}

function drawRadar(scores) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    const labels = [
        scores.action >= 0 ? "即行動" : "慎重",
        scores.thinking >= 0 ? "論理的" : "直感的",
        scores.inter >= 0 ? "リーダー" : "サポート",
        scores.extra >= 0 ? "外向的" : "内向的",
        scores.emotion >= 0 ? "感情表現" : "感情内包",
        scores.change >= 0 ? "変化適応" : "安定志向",
        scores.value >= 0 ? "成果重視" : "意味重視",
        scores.self >= 0 ? "自己認識(高)" : "自己認識(低)"
    ];

    const dataValues = [
        Math.abs(scores.action), Math.abs(scores.thinking), Math.abs(scores.inter), 
        Math.abs(scores.extra), Math.abs(scores.emotion), Math.abs(scores.change), 
        Math.abs(scores.value), Math.abs(scores.self)
    ];

    if(window.myRadar) window.myRadar.destroy();

    window.myRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'パラメーター強度',
                data: dataValues,
                backgroundColor: 'rgba(199, 125, 255, 0.4)',
                borderColor: '#c77dff',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#c77dff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#c77dff',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: '#f8f9fa',
                        font: { size: 12, family: "'Noto Sans JP', sans-serif" }
                    },
                    ticks: {
                        display: false,
                        min: 0,
                        max: 10
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
