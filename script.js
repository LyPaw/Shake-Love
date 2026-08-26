(() => {
    // ========== DOM ELEMENTS ==========
    const createScreen = document.getElementById('create-screen');
    const proposalScreen = document.getElementById('proposal-screen');
    const createForm = document.getElementById('create-form');
    const senderInput = document.getElementById('sender-input');
    const messageInput = document.getElementById('message-input');
    const linkResult = document.getElementById('link-result');
    const generatedLink = document.getElementById('generated-link');
    const copyBtn = document.getElementById('copy-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const previewBtn = document.getElementById('preview-btn');

    const chickImg = document.getElementById('chick-img');
    const chick = document.getElementById('chick');
    const boxImg = document.getElementById('box-img');
    const box = document.getElementById('box');
    const messageArea = document.getElementById('message-area');
    const senderName = document.getElementById('sender-name');
    const proposalMessage = document.getElementById('proposal-message');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    const btnBack = document.getElementById('btn-back');
    const pillow = document.getElementById('pillow');
    const peluche = document.getElementById('peluche');
    const star = document.getElementById('star');
    const flower = document.getElementById('flower');
    const heart = document.getElementById('heart');
    const feather = document.getElementById('feather');
    const touchFeedback = document.getElementById('touch-feedback');
    const liliesContainer = document.getElementById('lilies-container');
    const timezoneSelect = document.getElementById('timezone-select');
    const clockArea = document.getElementById('clock-area');

    // ========== STATE ==========
    let state = {
        chickAwake: false,
        boxOpen: false,
        shakeCount: 0,
        touchCount: 0,
        neededShakes: 5,
        neededTouches: 8,
        isPreview: false,
        boxAlreadyOpenedToday: false,
        touchFeedbacks: ['💤', '💤💤', 'Hmm...', 'Zzz...', '¡Despierta!', '🎵', '✨', '💤💤💤']
    };

    // ========== DAILY BOX (localStorage) ==========
    function getDailyKey() {
        const params = new URLSearchParams(window.location.search);
        const sender = params.get('sender') || '';
        const message = params.get('message') || '';
        const today = new Date().toISOString().split('T')[0];
        return `box_${sender}_${message}_${today}`;
    }

    function wasBoxOpenedToday() {
        return localStorage.getItem(getDailyKey()) === '1';
    }

    function markBoxOpenedToday() {
        localStorage.setItem(getDailyKey(), '1');
    }

    // ========== DRAG & DROP PHYSICS (ICE RINK) ==========
    const physicsObjects = [];

    class DraggablePhysics {
        constructor(element) {
            this.el = element;
            this.isDragging = false;
            this.hasBeenDragged = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.velX = 0;
            this.velY = 0;
            this.lastX = 0;
            this.lastY = 0;
            this.lastTime = 0;
            this.friction = 0.992;
            this.bounce = 0.7;

            this.onDragStart = this.onDragStart.bind(this);
            this.onDragMove = this.onDragMove.bind(this);
            this.onDragEnd = this.onDragEnd.bind(this);
            this.animate = this.animate.bind(this);

            this.init();
        }

        init() {
            this.el.style.touchAction = 'none';
            this.el.style.cursor = 'grab';
            this.el.addEventListener('mousedown', this.onDragStart);
            this.el.addEventListener('touchstart', this.onDragStart, { passive: false });
            this.animate();
        }

        destroy() {
            this.el.removeEventListener('mousedown', this.onDragStart);
            this.el.removeEventListener('touchstart', this.onDragStart);
            document.removeEventListener('mousemove', this.onDragMove);
            document.removeEventListener('mouseup', this.onDragEnd);
            document.removeEventListener('touchmove', this.onDragMove);
            document.removeEventListener('touchend', this.onDragEnd);
        }

        getClientPos(e) {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        onDragStart(e) {
            if (state.boxOpen) return;
            e.preventDefault();
            const pos = this.getClientPos(e);
            const rect = this.el.getBoundingClientRect();

            this.isDragging = true;
            this.hasBeenDragged = true;
            this.offsetX = pos.x - rect.left;
            this.offsetY = pos.y - rect.top;
            this.lastX = pos.x;
            this.lastY = pos.y;
            this.lastTime = Date.now();
            this.velX = 0;
            this.velY = 0;

            this.el.style.cursor = 'grabbing';
            this.el.style.zIndex = '100';

            document.addEventListener('mousemove', this.onDragMove);
            document.addEventListener('mouseup', this.onDragEnd);
            document.addEventListener('touchmove', this.onDragMove, { passive: false });
            document.addEventListener('touchend', this.onDragEnd);
        }

        onDragMove(e) {
            if (!this.isDragging) return;
            e.preventDefault();
            const pos = this.getClientPos(e);
            const now = Date.now();
            const dt = now - this.lastTime;

            if (dt > 0) {
                this.velX = (pos.x - this.lastX) / dt * 16;
                this.velY = (pos.y - this.lastY) / dt * 16;
            }

            const sceneRect = document.getElementById('scene').getBoundingClientRect();
            this.el.style.left = (pos.x - this.offsetX - sceneRect.left) + 'px';
            this.el.style.top = (pos.y - this.offsetY - sceneRect.top) + 'px';
            this.el.style.right = 'auto';
            this.el.style.bottom = 'auto';

            this.lastX = pos.x;
            this.lastY = pos.y;
            this.lastTime = now;
        }

        onDragEnd(e) {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.el.style.cursor = 'grab';
            this.el.style.zIndex = '3';

            document.removeEventListener('mousemove', this.onDragMove);
            document.removeEventListener('mouseup', this.onDragEnd);
            document.removeEventListener('touchmove', this.onDragMove);
            document.removeEventListener('touchend', this.onDragEnd);

            const speed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
            if (speed > 3) {
                showTouchFeedback(this === physicsObjects[0] ? '💨' : '🧸💨');
            }

            const soundType = this.el.dataset.sound;
            if (soundType) playObjectSound(soundType);
        }

        animate() {
            if (!this.isDragging && this.hasBeenDragged) {
                if (Math.abs(this.velX) < 0.05 && Math.abs(this.velY) < 0.05) {
                    this.velX = 0;
                    this.velY = 0;
                } else {
                    const sceneRect = document.getElementById('scene').getBoundingClientRect();
                    const rect = this.el.getBoundingClientRect();
                    let x = rect.left - sceneRect.left + this.velX;
                    let y = rect.top - sceneRect.top + this.velY;

                    this.velX *= this.friction;
                    this.velY *= this.friction;

                    const w = sceneRect.width;
                    const h = sceneRect.height;

                    if (x < 0) { x = 0; this.velX = Math.abs(this.velX) * this.bounce; }
                    if (x + rect.width > w) { x = w - rect.width; this.velX = -Math.abs(this.velX) * this.bounce; }
                    if (y < 0) { y = 0; this.velY = Math.abs(this.velY) * this.bounce; }
                    if (y + rect.height > h) { y = h - rect.height; this.velY = -Math.abs(this.velY) * this.bounce; }

                    this.el.style.left = x + 'px';
                    this.el.style.top = y + 'px';
                    this.el.style.right = 'auto';
                    this.el.style.bottom = 'auto';
                }
            }

            requestAnimationFrame(this.animate);
        }
    }

    // ========== CLOCKS ==========
    function getCityName(zone) {
        return zone.replace(/_/g, ' ').split('/').pop();
    }

    function startClocks(zones) {
        clockArea.innerHTML = '';
        zones.forEach(zone => {
            const el = document.createElement('div');
            el.className = 'clock';
            el.dataset.tz = zone;
            el.textContent = getCityName(zone) + '  —:——';
            clockArea.appendChild(el);
        });
        updateClocks(zones);
        setInterval(() => updateClocks(zones), 15000);
    }

    function updateClocks(zones) {
        zones.forEach(zone => {
            const el = clockArea.querySelector(`.clock[data-tz="${zone}"]`);
            if (!el) return;
            const now = new Date();
            const time = now.toLocaleTimeString('es-ES', {
                timeZone: zone,
                hour: '2-digit',
                minute: '2-digit'
            });
            el.textContent = getCityName(zone) + '  ' + time;
        });
    }

    // ========== INIT ==========
    function init() {
        const params = new URLSearchParams(window.location.search);
        const message = params.get('message');
        const sender = params.get('sender');
        const tzs = params.get('tz');
        state.isPreview = params.get('preview') === 'true';

        if (message && sender) {
            btnBack.style.display = state.isPreview ? '' : 'none';
            showProposal(sender, decodeURIComponent(message));

            if (tzs) {
                startClocks(tzs.split(','));
            }

            if (!state.isPreview && wasBoxOpenedToday()) {
                state.boxAlreadyOpenedToday = true;
                state.chickAwake = false;
                chickImg.src = 'assets/chick_sleep.PNG';
                box.classList.add('disappear');
                messageArea.classList.add('hidden');
            }
        } else {
            showCreate();
        }

        setupListeners();
    }

    // ========== SCREENS ==========
    function showCreate() {
        createScreen.classList.add('active');
        proposalScreen.classList.remove('active');
    }

    function showProposal(sender, message) {
        createScreen.classList.remove('active');
        proposalScreen.classList.add('active');
        senderName.textContent = `— ${sender} —`;
        proposalMessage.textContent = message;

        physicsObjects.forEach(p => p.destroy());
        physicsObjects.length = 0;

        setTimeout(() => {
            physicsObjects.push(new DraggablePhysics(pillow));
            physicsObjects.push(new DraggablePhysics(peluche));
            physicsObjects.push(new DraggablePhysics(star));
            physicsObjects.push(new DraggablePhysics(flower));
            physicsObjects.push(new DraggablePhysics(heart));
            physicsObjects.push(new DraggablePhysics(feather));
        }, 100);
    }

    // ========== FORM & LINK GENERATION ==========
    function setupListeners() {
        createForm.addEventListener('submit', handleFormSubmit);
        copyBtn.addEventListener('click', handleCopy);
        previewBtn.addEventListener('click', handlePreview);
        btnYes.addEventListener('click', handleYes);
        btnNo.addEventListener('click', handleNo);
        btnBack.addEventListener('click', handleBack);

        chick.addEventListener('click', handleChickClick);

        [pillow, peluche, star, flower, heart, feather].forEach(obj => {
            obj.addEventListener('click', () => {
                const soundType = obj.dataset.sound;
                if (soundType) playObjectSound(soundType);
            });
        });

        setupShakeDetection();

        document.addEventListener('touchstart', handleTouchStart, { passive: true });

        populateTimezones();
    }

    function populateTimezones() {
        let zones;
        try {
            zones = Intl.supportedValuesOf('timeZone');
        } catch (e) {
            return;
        }

        const groups = {};
        zones.forEach(zone => {
            const continent = zone.split('/')[0];
            if (!groups[continent]) groups[continent] = [];
            groups[continent].push(zone);
        });

        const order = ['Africa', 'America', 'Antarctica', 'Asia', 'Atlantic', 'Europe', 'Indian', 'Pacific'];
        order.forEach(continent => {
            if (!groups[continent]) return;
            const optgroup = document.createElement('optgroup');
            optgroup.label = continent;
            groups[continent].forEach(zone => {
                const option = document.createElement('option');
                option.value = zone;
                option.textContent = zone.replace(/_/g, ' ').split('/').pop();
                optgroup.appendChild(option);
            });
            timezoneSelect.appendChild(optgroup);
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const sender = senderInput.value.trim();
        const message = messageInput.value.trim();
        if (!sender || !message) return;

        const url = new URL(window.location.href.split('?')[0]);
        url.searchParams.set('sender', sender);
        url.searchParams.set('message', message);

        const selectedTzs = [...timezoneSelect.selectedOptions].map(opt => opt.value);
        if (selectedTzs.length > 0) {
            url.searchParams.set('tz', selectedTzs.join(','));
        }

        generatedLink.value = url.toString();
        linkResult.classList.remove('hidden');

        const encodedMessage = encodeURIComponent(`¡Tengo una pregunta para ti! 💌\n\n${message}`);
        whatsappBtn.href = `https://wa.me/?text=${encodedMessage}%0A%0A${encodeURIComponent(url.toString())}`;
    }

    function handleCopy() {
        generatedLink.select();
        document.execCommand('copy');
        copyBtn.textContent = '¡Copiado!';
        setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
    }

    function handlePreview() {
        const sender = senderInput.value.trim() || 'Alguien especial';
        const message = messageInput.value.trim() || '¿Quieres ser mi novia?';
        state.isPreview = true;
        btnBack.style.display = '';
        showProposal(sender, message);
    }

    function handleBack() {
        state.chickAwake = false;
        state.boxOpen = false;
        state.shakeCount = 0;
        state.touchCount = 0;
        chick.classList.remove('awake');
        chickImg.src = 'assets/chick_sleep.PNG';
        box.classList.remove('open', 'closing', 'disappear');
        boxImg.src = 'assets/cofre.png';
        messageArea.classList.add('hidden');
        messageArea.classList.remove('risen');
        btnYes.style.display = '';
        btnNo.style.display = '';
        proposalScreen.classList.remove('awakening');
        physicsObjects.forEach(p => p.destroy());
        physicsObjects.length = 0;
        showCreate();
    }

    // ========== CHICK INTERACTION ==========
    function handleChickClick() {
        if (state.chickAwake || state.boxAlreadyOpenedToday) return;

        state.touchCount++;

        chickImg.style.transform = 'scale(0.95)';
        setTimeout(() => { chickImg.style.transform = ''; }, 150);

        showTouchFeedback(state.touchFeedbacks[Math.floor(Math.random() * state.touchFeedbacks.length)]);

        if (state.touchCount >= state.neededTouches && !state.chickAwake) {
            showMessage('¡Agita el móvil para despertarlo! 📱', 2000);
            state.touchCount = 0;
        }
    }

    function handleTouchStart(e) {
        if (state.boxOpen || state.chickAwake || state.boxAlreadyOpenedToday) return;
        if (e.target.closest('.interactive-object') || e.target.closest('#chick')) return;

        state.touchCount++;
        if (state.touchCount >= state.neededTouches && !state.chickAwake) {
            showMessage('¡Intenta agitar el móvil! 📱', 2000);
            state.touchCount = 0;
        }
    }

    // ========== SHAKE DETECTION ==========
    function setupShakeDetection() {
        let lastX = 0, lastY = 0, lastZ = 0;
        let lastTime = 0;
        const threshold = 25;

        if (typeof DeviceMotionEvent !== 'undefined') {
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                document.addEventListener('click', () => {
                    DeviceMotionEvent.requestPermission()
                        .then(response => {
                            if (response === 'granted') {
                                window.addEventListener('devicemotion', handleMotion);
                            }
                        })
                        .catch(console.error);
                }, { once: true });
            } else {
                window.addEventListener('devicemotion', handleMotion);
            }
        }

        function handleMotion(e) {
            if (state.boxOpen || state.boxAlreadyOpenedToday) return;

            const acc = e.accelerationIncludingGravity;
            if (!acc) return;

            const currentTime = Date.now();
            if ((currentTime - lastTime) < 100) return;

            const diffTime = currentTime - lastTime;
            lastTime = currentTime;

            const x = acc.x || 0;
            const y = acc.y || 0;
            const z = acc.z || 0;

            const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

            if (speed > threshold) {
                state.shakeCount++;
                showTouchFeedback('📱✨');

                if (state.shakeCount >= state.neededShakes && !state.chickAwake) {
                    wakeUpChick();
                }
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        }

        document.addEventListener('keydown', (e) => {
            if (state.boxOpen || state.boxAlreadyOpenedToday) return;
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                state.shakeCount++;
                showTouchFeedback('⌨️✨');
                if (state.shakeCount >= state.neededShakes && !state.chickAwake) {
                    wakeUpChick();
                }
            }
        });
    }

    // ========== CHICK WAKE UP ==========
    function wakeUpChick() {
        state.chickAwake = true;
        chick.classList.add('awake');
        chickImg.src = 'assets/chick.PNG';

        playOpenSound();
        openBox();
    }

    function openBox() {
        state.boxOpen = true;
        state.boxAlreadyOpenedToday = true;
        box.classList.add('disappear');
        markBoxOpenedToday();

        setTimeout(() => {
            messageArea.classList.remove('hidden');
            messageArea.classList.add('risen');
        }, 300);
    }

    function closeBox(keepHidden = false) {
        state.boxOpen = false;
        messageArea.classList.add('hidden');
        messageArea.classList.remove('risen');

        if (keepHidden) {
            box.classList.add('disappear');
            box.classList.remove('open');
            setTimeout(() => {
                state.chickAwake = false;
                chick.classList.remove('awake');
                chickImg.src = 'assets/chick_sleep.PNG';
                state.shakeCount = 0;
                state.touchCount = 0;
            }, 600);
        } else {
            box.style.display = '';
            box.classList.remove('open', 'disappear');
            box.classList.add('closing');
            boxImg.src = 'assets/cofre.png';

            setTimeout(() => {
                box.classList.remove('closing');
            }, 600);

            setTimeout(() => {
                state.chickAwake = false;
                chick.classList.remove('awake');
                chickImg.src = 'assets/chick_sleep.PNG';
                state.shakeCount = 0;
                state.touchCount = 0;
            }, 1200);
        }
    }

    // ========== YES / NO ==========
    function handleYes() {
        playYesSound();
        createConfetti();
        createLilies();

        proposalScreen.classList.add('awakening');
        messageArea.style.animation = 'none';
        void messageArea.offsetWidth;
        messageArea.style.animation = 'messageAppear 0.8s ease-out';

        const yesText = document.createElement('p');
        yesText.style.cssText = `
            font-size: 1.5rem; font-weight: 700; color: #FF6B9D;
            text-shadow: 0 2px 20px rgba(255,107,157,0.5);
            animation: messageAppear 1s ease-out;
            text-align: center; margin-top: 20px;
        `;
        yesText.textContent = '💕 ¡Sabía que dirías que sí! 💕';
        messageArea.appendChild(yesText);

        btnYes.style.display = 'none';
        btnNo.style.display = 'none';
    }

    function handleNo() {
        playNoSound();
        closeBox(true);

        const noTexts = [
            '¡El pollito se pone triste... 😢',
            '¿Segura? El pollito insiste... 🥺',
            'Bueno, el pollito esperará... 💤',
            '¡Intenta de nuevo! El pollito no se rinde 💪'
        ];
        showMessage(noTexts[Math.floor(Math.random() * noTexts.length)], 2500);
    }

    // ========== LILIES ==========
    function createLilies() {
        const positions = [
            { top: '5%', left: '5%' },
            { top: '10%', right: '5%' },
            { top: '30%', left: '3%' },
            { top: '50%', right: '3%' },
            { top: '70%', left: '5%' },
            { top: '85%', right: '8%' },
            { top: '15%', left: '15%' },
            { top: '60%', right: '12%' },
            { bottom: '10%', left: '10%' },
            { bottom: '15%', right: '5%' },
        ];

        const lilyTypes = ['🌸', '🌺', '🤍', '✿', '❀'];

        positions.forEach((pos, i) => {
            setTimeout(() => {
                const lily = document.createElement('div');
                lily.className = 'lily lily-float';
                lily.textContent = lilyTypes[i % lilyTypes.length];
                lily.style.fontSize = (30 + Math.random() * 30) + 'px';
                Object.keys(pos).forEach(key => {
                    lily.style[key] = pos[key];
                });
                lily.style.animationDelay = `${Math.random() * 0.5}s`;
                liliesContainer.appendChild(lily);
            }, i * 200);
        });
    }

    // ========== CONFETTI ==========
    function createConfetti() {
        const colors = ['#FF6B9D', '#FFB6D3', '#FFD700', '#FFFFFF', '#FF8BBE'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.left = Math.random() * 100 + 'vw';
                piece.style.background = colors[Math.floor(Math.random() * colors.length)];
                piece.style.width = (5 + Math.random() * 10) + 'px';
                piece.style.height = (5 + Math.random() * 10) + 'px';
                piece.style.animationDuration = (2 + Math.random() * 2) + 's';
                piece.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(piece);
                setTimeout(() => piece.remove(), 4000);
            }, i * 50);
        }
    }

    // ========== FEEDBACK ==========
    function showMessage(text, duration = 2000) {
        touchFeedback.textContent = text;
        touchFeedback.classList.remove('hidden');
        touchFeedback.style.animation = 'none';
        void touchFeedback.offsetWidth;
        touchFeedback.style.animation = 'feedbackFloat 1s ease-out forwards';
        setTimeout(() => {
            touchFeedback.classList.add('hidden');
        }, duration);
    }

    function showTouchFeedback(emoji) {
        const fb = document.createElement('div');
        fb.style.cssText = `
            position: fixed;
            top: ${30 + Math.random() * 40}%;
            left: ${20 + Math.random() * 60}%;
            font-size: 24px;
            pointer-events: none;
            z-index: 50;
            animation: feedbackFloat 1s ease-out forwards;
        `;
        fb.textContent = emoji;
        document.body.appendChild(fb);
        setTimeout(() => fb.remove(), 1000);
    }

    // ========== OBJECT SOUNDS ==========
    function playObjectSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;

            switch (type) {
                case 'pillow': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 150;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
                }
                case 'peluche': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 800;
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.linearRampToValueAtTime(1200, now + 0.05);
                    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now);
                    osc.stop(now + 0.15);
                    break;
                }
                case 'star': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 800;
                    osc.type = 'sine';
                    osc.frequency.linearRampToValueAtTime(400, now + 0.5);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                    break;
                }
                case 'flower': {
                    const bufferSize = ctx.sampleRate * 0.3;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
                    }
                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 2000;
                    filter.Q.value = 0.5;
                    const gain = ctx.createGain();
                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    noise.start(now);
                    noise.stop(now + 0.3);
                    break;
                }
                case 'heart': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 80;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.12);
                    gain.gain.linearRampToValueAtTime(0.25, now + 0.18);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                    osc.start(now);
                    osc.stop(now + 0.35);
                    break;
                }
                case 'feather': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 600;
                    osc.type = 'sine';
                    osc.frequency.linearRampToValueAtTime(200, now + 0.3);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                    break;
                }
            }
        } catch (e) {}
    }

    // ========== SOUNDS ==========
    function playOpenSound() {
        try {
            const audio = new Audio('assets/open-sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    function playYesSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.4);
            });
        } catch (e) {}
    }

    function playNoSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 300;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {}
    }

    // ========== START ==========
    init();
})();
