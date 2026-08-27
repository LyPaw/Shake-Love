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
    const shakeProgress = document.getElementById('shake-progress');
    const shakeFill = document.getElementById('shake-fill');
    const shakeText = document.getElementById('shake-text');
    const loadingScreen = document.getElementById('loading-screen');
    const shakeFallback = document.getElementById('shake-fallback');

    const giftZone = document.getElementById('gift-zone');
    const btnAddGift = document.getElementById('btn-add-gift');
    const sceneGifts = document.getElementById('scene-gifts');
    const giftModal = document.getElementById('gift-modal');
    const giftModalTitle = document.getElementById('gift-modal-title');
    const giftTypeCarta = document.getElementById('gift-type-carta');
    const giftTypeCajita = document.getElementById('gift-type-cajita');
    const giftContent = document.getElementById('gift-content');
    const giftCajitaPreview = document.getElementById('gift-cajita-preview');
    const btnGiftCancel = document.getElementById('btn-gift-cancel');
    const btnGiftSubmit = document.getElementById('btn-gift-submit');
    const cartaModal = document.getElementById('carta-modal');
    const cartaTitle = document.getElementById('carta-title');
    const cartaBody = document.getElementById('carta-body');
    const cartaActions = document.getElementById('carta-actions');
    const btnCartaDelete = document.getElementById('btn-carta-delete');
    const btnCartaClose = document.getElementById('btn-carta-close');

    // ========== STATE ==========
    let state = {
        chickAwake: false,
        boxOpen: false,
        shakeCount: 0,
        touchCount: 0,
        neededShakes: 40,
        neededTouches: 8,
        isPreview: false,
        roomCode: null,
        myAuthorId: null,
        gifts: [],
        giftMode: 'carta',
        giftPhysics: [],
        viewGift: null,
        shakeStartTime: 0,
        shakeActive: false,
        lastShakeTime: 0,
        touchFeedbacks: ['💤', '💤💤', 'Hmm...', 'Zzz...', '¡Despierta!', '🎵', '✨', '💤💤💤']
    };

    // ========== SANITIZE ==========
    function sanitize(str, maxLen = 200) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim()
            .substring(0, maxLen);
    }

    // ========== SHAKE PROGRESS ==========
    function updateShakeProgress() {
        const pct = Math.min(100, (state.shakeCount / state.neededShakes) * 100);
        shakeFill.style.width = pct + '%';
        shakeProgress.classList.remove('hidden');

        if (pct < 30) {
            shakeText.textContent = '¡Agita con fuerza! 💪';
        } else if (pct < 60) {
            shakeText.textContent = '¡No pares! 🔥';
        } else if (pct < 90) {
            shakeText.textContent = '¡Casi lo consigues! ✨';
        } else {
            shakeText.textContent = '¡Ya está! 🎉';
        }
    }

    function resetShakeProgress() {
        state.shakeCount = 0;
        state.shakeActive = false;
        state.shakeStartTime = 0;
        state.lastShakeTime = 0;
        shakeFill.style.width = '0%';
        shakeProgress.classList.add('hidden');
        shakeText.textContent = '';
    }

    // ========== ROOM & GIFTS (Supabase RPC) ==========
    function genRoomCode(length = 8) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    async function createNewRoom(sender, message, tzs) {
        await ensureAnonSession();
        let codigo = genRoomCode();
        let created = false;
        for (let attempt = 0; attempt < 5 && !created; attempt++) {
            const { data, error } = await supabaseClient.rpc('create_room', {
                p_codigo: codigo,
                p_sender: sender,
                p_message: message,
                p_tz: tzs.length > 0 ? tzs.join(',') : null
            });
            if (error) {
                if (attempt < 4) { codigo = genRoomCode(); continue; }
                throw error;
            }
            created = true;
        }
        const { data: user } = await supabaseClient.auth.getUser();
        state.myAuthorId = user?.user?.id || null;
        return codigo;
    }

    async function openRoom(codigo) {
        await ensureAnonSession();
        const { data, error } = await supabaseClient.rpc('get_room', { p_codigo: codigo });
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('NO_ROOM');
        const { data: user } = await supabaseClient.auth.getUser();
        state.myAuthorId = user?.user?.id || null;
        state.roomCode = codigo;
        return data[0];
    }

    async function loadGifts(roomCode) {
        const { data, error } = await supabaseClient.rpc('get_gifts', { p_room_code: roomCode });
        if (error) throw error;
        state.gifts = data || [];
        return state.gifts;
    }

    async function saveGift(type, content) {
        if (!state.roomCode) return;
        const { data, error } = await supabaseClient.rpc('create_gift', {
            p_room_code: state.roomCode,
            p_type: type,
            p_content: content,
            p_author_name: 'Anónimo'
        });
        if (error) throw error;
        return data;
    }

    async function deleteGift(giftId) {
        const { error } = await supabaseClient.rpc('delete_gift', { p_gift_id: giftId });
        if (error) throw error;
    }

    const GIFT_SRC = {
        carta: 'assets/nota.svg',
        cajita: 'assets/regalo.svg'
    };

    const giftSpotTemplate = [
        { top: '12%', left: '70%' },
        { top: '18%', left: '10%' },
        { top: '45%', left: '78%' },
        { top: '60%', left: '8%' },
        { top: '72%', left: '72%' },
        { top: '25%', left: '82%' },
        { top: '55%', left: '5%' },
        { top: '35%', left: '3%' },
        { top: '78%', left: '25%' },
        { top: '10%', left: '35%' }
    ];

    function isMineGift(g) {
        return g.author_id && state.myAuthorId && g.author_id === state.myAuthorId;
    }

    function renderGifts() {
        state.giftPhysics.forEach(p => p.destroy());
        state.giftPhysics = [];
        sceneGifts.innerHTML = '';
        if (state.isPreview) return;
        state.gifts.forEach((g, i) => {
            appendGiftObject(g, i);
        });
    }

    function appendGiftObject(g, posIndex) {
        const el = document.createElement('div');
        el.className = 'scene-gift' + (isMineGift(g) ? ' gift-mine' : ' gift-other');
        const img = document.createElement('img');
        img.src = GIFT_SRC[g.type] || GIFT_SRC.carta;
        img.alt = g.type === 'carta' ? 'Nota' : 'Regalo';
        el.appendChild(img);
        el.dataset.giftId = g.id;
        el.style.top = giftSpotTemplate[posIndex % giftSpotTemplate.length].top;
        el.style.left = giftSpotTemplate[posIndex % giftSpotTemplate.length].left;
        el.title = g.type === 'carta' ? 'Nota' : 'Regalo';
        sceneGifts.appendChild(el);
        state.giftPhysics.push(new DraggablePhysics(el, () => openGiftContent(g, el)));
    }

    function openGiftContent(g, el) {
        if (g.type === 'carta') {
            cartaTitle.textContent = (isMineGift(g) ? 'Tu nota' : `Nota de ${g.author_name || 'alguien'}`);
            cartaBody.textContent = g.content || '...';
            cartaActions.classList.remove('hidden');
            btnCartaDelete.style.display = isMineGift(g) ? '' : 'none';
            state.viewGift = g;
            cartaModal.classList.remove('hidden');
        } else {
            const q = g.content || 'Un regalo para ti 💝';
            showMessage((isMineGift(g) ? 'Tu regalo: ' : '') + q, 3500);
        }
    }

    function openGiftModal() {
        giftContent.value = '';
        giftContent.classList.remove('hidden');
        giftCajitaPreview.classList.add('hidden');
        setGiftMode('carta');
        giftModal.classList.remove('hidden');
    }

    function setGiftMode(mode) {
        state.giftMode = mode;
        giftTypeCarta.classList.toggle('active', mode === 'carta');
        giftTypeCajita.classList.toggle('active', mode === 'cajita');
        giftContent.classList.remove('hidden');
        giftCajitaPreview.classList.toggle('hidden', mode !== 'cajita');
        if (mode === 'cajita') {
            giftModalTitle.textContent = 'Añade un regalo';
            giftContent.placeholder = 'Escribe la pregunta que tendrá el regalo...';
        } else {
            giftModalTitle.textContent = 'Añade una nota';
            giftContent.placeholder = 'Escribe la nota...';
        }
    }

    function closeGiftModal() {
        giftModal.classList.add('hidden');
    }

    function closeCartaModal() {
        cartaModal.classList.add('hidden');
        state.viewGift = null;
    }

    async function handleGiftSubmit() {
        if (!state.roomCode) return;
        const content = sanitize(giftContent.value.trim(), 200);
        if (!content) { showMessage('Escribe algo primero ✍️', 2000); return; }

        try {
            const gift = await saveGift(state.giftMode, content);
            state.gifts.push(gift);
            appendGiftObject(gift, state.gifts.length - 1);
            closeGiftModal();
            showMessage(state.giftMode === 'carta' ? '¡Nota añadida! 💌' : '¡Regalo añadido! 🎁', 2000);
        } catch (err) {
            console.error(err);
            showMessage('No se pudo añadir 🙈', 3000);
        }
    }

    async function handleCartaDelete() {
        const g = state.viewGift;
        if (!g) return;
        try {
            await deleteGift(g.id);
            state.gifts = state.gifts.filter(x => x.id !== g.id);
            renderGifts();
            closeCartaModal();
            showMessage('Nota eliminada 🗑️', 2000);
        } catch (err) {
            console.error(err);
            showMessage('No se pudo eliminar 🙈', 3000);
        }
    }

    // ========== DRAG & DROP PHYSICS (ICE RINK) ==========
    const physicsObjects = [];

    class DraggablePhysics {
        constructor(element, onTap) {
            this.el = element;
            this.onTap = onTap || null;
            this.isDragging = false;
            this.hasBeenDragged = false;
            this.moved = false;
            this.startX = 0;
            this.startY = 0;
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
            this.onClickBound = this.onClickBound.bind(this);
            this.animate = this.animate.bind(this);

            this.init();
        }

        init() {
            this.el.style.touchAction = 'none';
            this.el.style.cursor = 'grab';
            this.el.addEventListener('mousedown', this.onDragStart);
            this.el.addEventListener('touchstart', this.onDragStart, { passive: false });
            if (this.onTap) {
                this.el.addEventListener('click', this.onClickBound);
            }
            this.animate();
        }

        destroy() {
            this.el.removeEventListener('mousedown', this.onDragStart);
            this.el.removeEventListener('touchstart', this.onDragStart);
            if (this.onTap) {
                this.el.removeEventListener('click', this.onClickBound);
            }
            document.removeEventListener('mousemove', this.onDragMove);
            document.removeEventListener('mouseup', this.onDragEnd);
            document.removeEventListener('touchmove', this.onDragMove);
            document.removeEventListener('touchend', this.onDragEnd);
        }

        onClickBound(e) {
            if (this.moved) return;
            if (this.onTap) this.onTap(e);
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
            this.moved = false;
            this.startX = pos.x;
            this.startY = pos.y;
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

            if (Math.abs(pos.x - this.startX) + Math.abs(pos.y - this.startY) > 8) {
                this.moved = true;
            }

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

                    const chickArea = document.getElementById('chick-area');
                    const chickRect = chickArea.getBoundingClientRect();
                    const oLeft = x + sceneRect.left;
                    const oTop = y + sceneRect.top;
                    const oRight = oLeft + rect.width;
                    const oBottom = oTop + rect.height;
                    const push = 1.5;

                    if (oRight - push > chickRect.left && oLeft + push < chickRect.right &&
                        oBottom - push > chickRect.top && oTop + push < chickRect.bottom) {
                        const overlapX = Math.min(oRight - chickRect.left, chickRect.right - oLeft);
                        const overlapY = Math.min(oBottom - chickRect.top, chickRect.bottom - oTop);

                        if (overlapX < overlapY) {
                            if (oLeft + rect.width / 2 < chickRect.left + chickRect.width / 2) {
                                x -= push;
                            } else {
                                x += push;
                            }
                        } else {
                            if (oTop + rect.height / 2 < chickRect.top + chickRect.height / 2) {
                                y -= push;
                            } else {
                                y += push;
                            }
                        }
                        this.velX *= this.friction;
                        this.velY *= this.friction;
                    }

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
        let validZones;
        try {
            const supported = new Set(Intl.supportedValuesOf('timeZone'));
            validZones = zones.filter(z => supported.has(z));
        } catch (e) {
            validZones = [];
        }
        if (validZones.length === 0) return;

        clockArea.innerHTML = '';
        validZones.forEach(zone => {
            const el = document.createElement('div');
            el.className = 'clock';
            el.dataset.tz = zone;
            el.textContent = getCityName(zone) + '  —:——';
            clockArea.appendChild(el);
        });
        updateClocks(validZones);
        setInterval(() => updateClocks(validZones), 15000);
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
    async function init() {
        const params = new URLSearchParams(window.location.search);
        const codigo = sanitize(params.get('r') || '', 40);
        state.isPreview = params.get('preview') === 'true';

        if (codigo && !state.isPreview) {
            try {
                const room = await openRoom(codigo);
                const sender = room.sender;
                const message = room.message;
                const tzs = room.tz;
                state.roomCode = codigo;

                createScreen.classList.remove('active');
                btnBack.style.display = 'none';

                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    setTimeout(() => { loadingScreen.style.display = 'none'; }, 600);

                    showProposal(sender, message);

                    if (tzs) {
                        startClocks(tzs.split(','));
                    }

                    loadGifts(codigo)
                        .then(renderGifts)
                        .catch(err => console.error('loadGifts', err));
                }, 1000);
            } catch (err) {
                console.error(err);
                loadingScreen.style.display = 'none';
                showMessage('Ese enlace no es válido 🙈', 3000);
                showCreate();
            }
        } else {
            const message = sanitize(decodeURIComponent(params.get('message') || ''), 200);
            const sender = sanitize(params.get('sender') || '', 30);
            const tzs = params.get('tz');

            if (state.isPreview && message && sender) {
                createScreen.classList.remove('active');
                btnBack.style.display = '';

                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    setTimeout(() => { loadingScreen.style.display = 'none'; }, 600);

                    showProposal(sender, message);
                    giftZone.classList.add('hidden');

                    if (tzs) {
                        startClocks(tzs.split(','));
                    }
                }, 1000);
            } else {
                loadingScreen.style.display = 'none';
                showCreate();
            }
        }

        setupListeners();
    }

    // ========== SCREENS ==========
    function showCreate() {
        createScreen.classList.add('active');
        proposalScreen.classList.remove('active');
        giftZone.classList.add('hidden');
    }

    function showProposal(sender, message) {
        createScreen.classList.remove('active');
        proposalScreen.classList.add('active');
        senderName.textContent = `— ${sender} —`;
        proposalMessage.textContent = message;

        giftZone.classList.remove('hidden');

        state.giftPhysics.forEach(p => p.destroy());
        state.giftPhysics = [];
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

        btnAddGift.addEventListener('click', openGiftModal);
        btnGiftCancel.addEventListener('click', closeGiftModal);
        btnCartaClose.addEventListener('click', closeCartaModal);
        btnCartaDelete.addEventListener('click', handleCartaDelete);
        giftTypeCarta.addEventListener('click', () => setGiftMode('carta'));
        giftTypeCajita.addEventListener('click', () => setGiftMode('cajita'));
        btnGiftSubmit.addEventListener('click', handleGiftSubmit);

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

    async function handleFormSubmit(e) {
        e.preventDefault();
        const sender = sanitize(senderInput.value.trim(), 30);
        const message = sanitize(messageInput.value.trim(), 200);
        if (!sender || !message) return;

        const submitBtn = createForm.querySelector('.btn-create');
        submitBtn.disabled = true;

        const selectedTzs = [...timezoneSelect.selectedOptions].map(opt => opt.value);

        try {
            const codigo = await createNewRoom(sender, message, selectedTzs);
            state.roomCode = codigo;

            const url = new URL(window.location.href.split('?')[0]);
            url.searchParams.set('r', codigo);

            generatedLink.value = url.toString();
            linkResult.classList.remove('hidden');

            const encodedMessage = encodeURIComponent(`¡Tengo una pregunta para ti! 💌\n\n${message}`);
            whatsappBtn.href = `https://wa.me/?text=${encodedMessage}%0A%0A${encodeURIComponent(url.toString())}`;
        } catch (err) {
            console.error(err);
            showMessage('No se pudo crear el enlace 🙈', 3000);
        } finally {
            submitBtn.disabled = false;
        }
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
        giftZone.classList.add('hidden');
    }

    function handleBack() {
        state.chickAwake = false;
        state.boxOpen = false;
        state.shakeCount = 0;
        state.touchCount = 0;
        resetShakeProgress();
        chick.classList.remove('awake');
        chickImg.src = 'assets/chick_sleep.PNG';
        box.classList.remove('open', 'closing', 'disappear');
        boxImg.src = 'assets/cofre.png';
        messageArea.classList.add('hidden');
        messageArea.classList.remove('risen');
        btnYes.style.display = '';
        btnNo.style.display = '';
        proposalScreen.classList.remove('awakening');
        state.giftPhysics.forEach(p => p.destroy());
        state.giftPhysics = [];
        sceneGifts.innerHTML = '';
        physicsObjects.forEach(p => p.destroy());
        physicsObjects.length = 0;
        showCreate();
    }

    // ========== CHICK INTERACTION ==========
    function handleChickClick() {
        if (state.chickAwake) return;

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
        if (state.boxOpen || state.chickAwake) return;
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
        const threshold = 50;
        const DECAY_RATE = 0.4;
        const DECAY_INTERVAL = 800;
        const MAX_WINDOW = 5000;
        let motionDetected = false;

        function processShake() {
            const now = Date.now();
            if (!state.shakeActive) {
                state.shakeActive = true;
                state.shakeStartTime = now;
            }

            state.shakeCount++;
            state.lastShakeTime = now;
            updateShakeProgress();

            if (state.shakeCount >= state.neededShakes && !state.chickAwake) {
                wakeUpChick();
            }
        }

        function decayLoop() {
            setInterval(() => {
                if (!state.shakeActive || state.boxOpen || state.chickAwake) return;

                const now = Date.now();
                const timeSinceLastShake = now - state.lastShakeTime;
                const timeSinceStart = now - state.shakeStartTime;

                if (timeSinceLastShake > DECAY_INTERVAL) {
                    state.shakeCount = Math.max(0, state.shakeCount - Math.floor(state.neededShakes * DECAY_RATE));
                    updateShakeProgress();
                }

                if (timeSinceStart > MAX_WINDOW) {
                    resetShakeProgress();
                    showMessage('¡Intenta de nuevo con más fuerza! 💪', 2000);
                }
            }, 300);
        }

        decayLoop();

        function handleMotion(e) {
            if (state.boxOpen) return;

            const acc = e.accelerationIncludingGravity;
            if (!acc) return;

            motionDetected = true;

            const currentTime = Date.now();
            if ((currentTime - lastTime) < 100) return;

            const diffTime = currentTime - lastTime;
            lastTime = currentTime;

            const x = acc.x || 0;
            const y = acc.y || 0;
            const z = acc.z || 0;

            const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

            if (speed > threshold) {
                processShake();
                showTouchFeedback('📱✨');
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        }

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

        setTimeout(() => {
            if (!motionDetected) {
                shakeFallback.classList.remove('hidden');
                let fallbackStartY = 0;
                let fallbackActive = false;
                let fallbackLastY = 0;

                shakeFallback.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    fallbackActive = true;
                    fallbackStartY = e.touches[0].clientY;
                    fallbackLastY = fallbackStartY;
                }, { passive: false });

                shakeFallback.addEventListener('touchmove', (e) => {
                    if (!fallbackActive) return;
                    e.preventDefault();
                    const currentY = e.touches[0].clientY;
                    const delta = Math.abs(currentY - fallbackLastY);
                    if (delta > 15) {
                        processShake();
                        showTouchFeedback('📱✨');
                        fallbackLastY = currentY;
                    }
                }, { passive: false });

                shakeFallback.addEventListener('touchend', () => {
                    fallbackActive = false;
                });
            }
        }, 2000);

        document.addEventListener('keydown', (e) => {
            if (state.boxOpen) return;
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                processShake();
                showTouchFeedback('⌨️✨');
            }
        });
    }

    // ========== CHICK WAKE UP ==========
    function wakeUpChick() {
        state.chickAwake = true;
        chick.classList.add('awake');
        chickImg.src = 'assets/chick.PNG';
        resetShakeProgress();

        playOpenSound();
        openBox();
    }

    function openBox() {
        state.boxOpen = true;
        box.classList.add('disappear');

        setTimeout(() => {
            messageArea.classList.remove('hidden');
            messageArea.classList.add('risen');
        }, 300);
    }

    function closeBox(keepHidden = false) {
        state.boxOpen = false;
        messageArea.classList.add('hidden');
        messageArea.classList.remove('risen');
        resetShakeProgress();

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
