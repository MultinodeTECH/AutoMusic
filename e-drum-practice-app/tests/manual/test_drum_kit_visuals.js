const canvas = document.getElementById('drumCanvas');
const ctx = canvas.getContext('2d');

// --- 样式调整 ---
document.body.style.backgroundColor = '#1f2937';
document.body.style.color = '#f3f4f6';
const h1 = document.querySelector('h1');
if (h1) {
    h1.style.textAlign = 'center';
}
canvas.style.backgroundColor = '#1f2937'; // gray-800
canvas.style.border = 'none';


// --- 鼓件配置 ---
// 根据 800x600 的画布尺寸和参考设计的百分比布局进行计算
// x/y 坐标是圆心
const drumKit = {
    // key 是用于事件监听的，id 是用于按钮映射的
    hihat: { id: 'hihat', name: 'HH CLOSED', key: 'h', keyDisplay: 'H', x: 800 * 0.05 + 45, y: 600 * 0.40 + 45, radius: 45, color: '#be185d' },
    hihatOpen: { id: 'hihatOpen', name: 'HH OPEN', key: 'o', keyDisplay: 'O', x: 800 * 0.05 + 10, y: 600 * 0.40 - 20, radius: 40, color: '#ec4899' }, // pink-500
    crash: { id: 'crash', name: 'CRASH', key: 'c', keyDisplay: 'C', x: 800 * 0.18 + 55, y: 600 * 0.10 + 55, radius: 55, color: '#d97706' },
    snare: { id: 'snare', name: 'SNARE', key: 's', keyDisplay: 'S', x: 800 * 0.30 + 55, y: 600 * 0.50 + 55, radius: 55, color: '#374151' },
    kick: { id: 'kick', name: 'KICK', key: 'k', keyDisplay: 'K', x: 800 * 0.5, y: 600 * 0.60 + 47.5, radius: 47.5, color: '#16a34a' },
    tom1: { id: 'tom1', name: 'TOM 1', key: 't', keyDisplay: 'T1', x: 800 * 0.45 + 42.5, y: 600 * 0.20 + 42.5, radius: 42.5, color: '#374151', borderColor: '#2dd4bf' },
    tom2: { id: 'tom2', name: 'TOM 2', key: 'y', keyDisplay: 'T2', x: 800 * 0.58 + 42.5, y: 600 * 0.20 + 42.5, radius: 42.5, color: '#374151', borderColor: '#38bdf8' },
    floorTom: { id: 'floorTom', name: 'FLOOR TOM', key: 'f', keyDisplay: 'F', x: 800 * 0.70 + 50, y: 600 * 0.50 + 50, radius: 50, color: '#374151' },
    ride: { id: 'ride', name: 'RIDE', key: 'r', keyDisplay: 'R', x: 800 * (1 - 0.05) - 60, y: 600 * 0.15 + 60, radius: 60, color: '#dc2626' }
};

// 存储当前活动的动画效果
let activeEffects = [];

// --- 绘制功能 ---
function drawDrum(drum, isHit = false) {
    const currentRadius = isHit ? drum.radius * 1.08 : drum.radius;

    ctx.save();

    // 绘制外边框/发光效果
    ctx.beginPath();
    ctx.arc(drum.x, drum.y, currentRadius, 0, Math.PI * 2);

    if (isHit) {
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 25;
    } else {
        ctx.strokeStyle = drum.borderColor || '#4b5563'; // gray-600
        ctx.lineWidth = 3;
    }
    ctx.stroke();
    ctx.closePath();

    // 绘制鼓面
    ctx.beginPath();
    ctx.arc(drum.x, drum.y, currentRadius - (ctx.lineWidth / 2), 0, Math.PI * 2);
    ctx.fillStyle = drum.color;
    ctx.fill();
    ctx.closePath();

    ctx.restore(); // 恢复上下文，清除阴影等效果

    // 绘制文字
    ctx.fillStyle = '#d1d5db'; // gray-300
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 鼓件名称
    ctx.font = '500 0.8rem "Inter", sans-serif';
    ctx.fillText(drum.name, drum.x, drum.y - 10);

    // 按键提示
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '700 1.2rem "Inter", sans-serif';
    ctx.fillText(drum.keyDisplay, drum.x, drum.y + 15);
}

function drawKit() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const drumName in drumKit) {
        const drum = drumKit[drumName];
        const isHit = activeEffects.some(effect => effect.drumName === drumName);
        drawDrum(drum, isHit);
    }
}

// --- 动画逻辑 ---
function triggerHitEffect(drumName) {
    const drum = drumKit[drumName];
    if (!drum) return;

    const existingEffect = activeEffects.find(effect => effect.drumName === drumName);
    if (existingEffect) {
        existingEffect.startTime = Date.now(); // 重置动画计时器
        return;
    }

    activeEffects.push({
        drumName: drumName,
        startTime: Date.now(),
        duration: 150,
    });
}

function animate() {
    const now = Date.now();

    // 移除过期的动画
    activeEffects = activeEffects.filter(effect => now - effect.startTime < effect.duration);

    drawKit();
    requestAnimationFrame(animate);
}

// --- 事件绑定 ---
// 绑定按钮点击事件
for (const drumName in drumKit) {
    const drum = drumKit[drumName];
    const button = document.getElementById(drum.id);
    if (button) {
        // 使用闭包来确保 drumName 在事件回调中是正确的
        (function (dName) {
            button.addEventListener('click', () => triggerHitEffect(dName));
        })(drumName);
    }
}

// 绑定键盘事件
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    for (const drumName in drumKit) {
        if (drumKit[drumName].key === key) {
            e.preventDefault(); // 阻止默认行为，如滚动页面
            triggerHitEffect(drumName);
        }
    }
});

// --- 启动 ---
animate();