///1 Глобальные переменные и конфигурация ядра Pip-Buck
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("cards-container");
    const title = document.getElementById("page-title");
    const toggleBtn = document.getElementById("toggle-view-btn");
    const sectionHeader = document.querySelector(".section-header");
    const navbarMenu = document.getElementById("navbar-menu");

    let currentActiveTab = "classes"; 
    let isListMode = false;
    let savedScrollPosition = 0; 
    let globalIdCounter = 1;

    try {
        isListMode = localStorage.getItem("isListMode") === "true";
    } catch (e) {}

    // Инициализация массивов базы данных
    window.classesData = [];
    window.lineagesData = [];
    window.communitiesData = [];
    window.perksData = [];
    window.loreData = [];
    window.rulesData = [];

    const tabsMap = {
        "classes": { title: "Классы", data: window.classesData },
        "lineages": { title: "Родословные (Расы)", data: window.lineagesData },
        "communities": { title: "Сообщества", data: window.communitiesData },
        "perks": { title: "Домены", data: window.perksData },
        "lore": { title: "Лор Вселенной", data: window.loreData },
        "rules": { title: "Правила Игры", data: window.rulesData }
    };

    function buildNavbar() {
        if (!navbarMenu) return;
        navbarMenu.innerHTML = "";
        Object.keys(tabsMap).forEach(key => {
            const btn = document.createElement("button");
            btn.className = `nav-btn${key === currentActiveTab ? ' active' : ''}`;
            btn.setAttribute("data-tab", key);
            
            const fullText = tabsMap[key].title.split(" (")[0].trim();
            let shortText = fullText;
            
            if (key === "lineages") shortText = "Расы";
            if (key === "communities") shortText = "Общины";
            if (key === "lore") shortText = "Лор";
            if (key === "rules") shortText = "Правила";

            btn.innerHTML = `
                <span class="btn-text-full">${fullText}</span>
                <span class="btn-text-short">${shortText}</span>
            `;
            
            btn.addEventListener("click", () => {
                savedScrollPosition = 0;
                document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                showTab(key);
            });
            navbarMenu.appendChild(btn);
        });
    }

    function findItemById(id) {
        const allCategories = Object.keys(tabsMap).map(key => tabsMap[key].data);
        return allCategories.flat().find(x => x.id === parseInt(id)) || null;
    }

    function generateBonusHtml(bonusData, isCompact = false) {
        if (!bonusData || bonusData.length === 0) return '';
        const cleanText = (str) => isCompact && typeof str === 'string' && str.includes("(") ? str.split("(")[0].trim() : str;
        const listItems = bonusData.map(point => `<li style="margin-bottom: ${isCompact ? '2px' : '5px'};">${cleanText(point)}</li>`).join('');
        return `<div class="sub-info">${isCompact ? '' : '<b>Эффект / Бонус:</b>'}<ol style="margin: 0; padding-left: 20px;">${listItems}</ol></div>`;
    }
///1

///2 Бронебойный парсер текстовой базы данных
    if (typeof rawDatabaseText === "undefined") {
        container.innerHTML = `<div style="color:#ff3333;font-weight:bold;padding:20px;text-align:center;">⚠️ rawDatabaseText не найден.</div>`;
        return;
    }

    const blocks = rawDatabaseText.split(/(?=\[[a-zA-Z]+\])/);

    blocks.forEach(block => { 
        const trimmedBlock = block.trim(); 
        if (!trimmedBlock) return; 
        const categoryMatch = trimmedBlock.match(/^\[([a-zA-Z]+)\]/); 
        if (!categoryMatch) return; 
        
        const categoryName = categoryMatch[1].toLowerCase(); 
        if (!tabsMap[categoryName]) return; 
        const targetArray = tabsMap[categoryName].data;

        const contentWithoutTag = trimmedBlock.replace(/^\[[a-zA-Z]+\]/, "").trim();
        const rawCards = contentWithoutTag.split("===");

        rawCards.forEach(rawCard => {
            const cleanCard = rawCard.trim(); if (!cleanCard) return;
            const stages = cleanCard.split("---");
            const firstStageLines = (stages[0] || "").trim().split("\n");
            let name = "Без названия", img = "", tags = [], shortDesc = "";

            firstStageLines.forEach(line => {
                const tl = line.trim();
                if (tl.startsWith("Имя:") || tl.startsWith("Name:")) name = tl.replace(/^Имя:|^Name:/, "").trim();
                if (tl.startsWith("Арт:") || tl.startsWith("Art:")) img = tl.replace(/^Арт:|^Art:/, "").trim();
                if (tl.startsWith("Теги:") || tl.startsWith("Tags:")) tags = tl.replace(/^Теги:|^Tags:/, "").split(",").map(t => t.trim()).filter(t => t);
            });

            const filteredLines = firstStageLines.map(line => {
                const tl = line.trim();
                if (tl.startsWith("Коротко:")) return line.replace("Коротко:", "").trim();
                if (tl.startsWith("Short:")) return line.replace("Short:", "").trim();
                if (tl.startsWith("Имя:") || tl.startsWith("Name:") ||
                    tl.startsWith("Арт:") || tl.startsWith("Art:") ||
                    tl.startsWith("Теги:") || tl.startsWith("Tags:")) {
                    return null;
                }
                return line; 
            }).filter(l => l !== null);

            shortDesc = filteredLines.join("\n").trim();

            const fullDesc = (stages[1] || "").trim();
            const stage3Text = (stages[2] || "").trim();
            const bonus = stage3Text ? stage3Text.replace(/^Bonus:|^Бонус:|^Фишка:/i, "").trim().split("\n").map(l => l.trim()).filter(l => l) : null;

            targetArray.push({ id: globalIdCounter++, name, img, tags, shortDesc, fullDesc, bonus });
        });
    });
///2

///3
    window.showUniversalPage = function(id) {
        const item = findItemById(id);
        if (!item) return;

        savedScrollPosition = window.scrollY;

        if (sectionHeader) sectionHeader.style.display = "none"; 
        container.className = ""; 

        let tagsHtml = '';
        if (item.tags && Array.isArray(item.tags)) {
            const tagsBox = item.tags.map(t => `<span class="tag">${t}</span>`).join('');
            tagsHtml = `<div class="card-tags" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px; width: 100%; justify-content: center;">${tagsBox}</div>`;
        }

        const leftColumnHtml = item.img ? `
            <div style="display: flex; flex-direction: column; align-items: center; width: 400px; flex-shrink: 0;">
                <div class="single-page-image">
                    <img src="${item.img}" alt="${item.name}" onerror="this.style.display='none'; this.parentNode.innerText='[Арт: ${item.name}]'"/>
                </div>
                ${tagsHtml}
            </div>` : (tagsHtml ? `<div style="display: flex; flex-direction: column; width: 300px; flex-shrink: 0;">${tagsHtml}</div>` : '');

        let extraHtml = generateBonusHtml(item.bonus, false);

        const rawText = item.fullDesc || item.shortDesc || "";
        const formattedText = rawText.split('\n').map(line => {
            if (line.includes(':') && !line.startsWith('http')) {
                const parts = line.split(':');
                const header = parts[0];
                const rest = parts.slice(1);
                return `<b>${header.trim()}:</b>${rest.join(':')}`;
            }
            return line;
        }).join('\n');

        container.innerHTML = `
            <div class="single-page-layout">
                <div class="single-page-back-box">
                    <button class="nav-btn active" onclick="window.goBackToTab('${currentActiveTab}')">
                        ⬅ Вернуться к общему списку
                    </button>
                </div>
                <div class="single-page-content" style="display: flex; gap: 50px; flex-wrap: wrap; align-items: flex-start;">
                    ${leftColumnHtml}
                    <div class="single-page-info" style="flex: 1; min-width: 320px;">
                        <h2 class="card-title" style="font-size: 32px; color: #ff6600; margin-top: 0; margin-bottom: 20px;">${item.name}</h2>
                        <div class="card-desc" style="font-size: 18px; line-height: 1.7; margin-bottom: 25px; white-space: pre-line; display: block;">${formattedText.trim()}</div>
                        ${extraHtml}
                    </div>
                </div>
            </div>`;

        window.scrollTo(0, 0);
    };

    window.goBackToTab = function(tabName) {
        showTab(tabName);
    };
    toggleBtn.addEventListener("click", () => {
        isListMode = !isListMode;
        try {
            localStorage.setItem("isListMode", isListMode);
        } catch (e) {}
        showTab(currentActiveTab);
    });

    function showTab(tab) {
        currentActiveTab = tab;
        container.innerHTML = "";
        
        if (sectionHeader) sectionHeader.style.display = "flex"; 
        
        container.className = isListMode ? "grid-container list-mode" : "grid-container";
        toggleBtn.innerHTML = isListMode ? '📋 <span class="toggle-btn-text">Переключить на плитку</span>' : '📋 <span class="toggle-btn-text">Переключить на список</span>';

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) activeBtn.classList.add("active");

        const current = tabsMap[tab];
        if (!current || !current.data) return;
        title.innerText = current.title;

        current.data.forEach(item => {
            const cardEl = document.createElement("div");
            cardEl.className = item.img ? "lineage-card" : "card";
            cardEl.style.cursor = "pointer";
            cardEl.onclick = () => showUniversalPage(item.id);

            const titleHeaderEl = document.createElement("div");
            titleHeaderEl.className = "card-title-header";
            titleHeaderEl.innerHTML = `<h3 class="card-title">${item.name}</h3>`;
            cardEl.appendChild(titleHeaderEl);

            const mainContentEl = document.createElement("div");
            mainContentEl.className = item.img ? "lineage-info" : "card-main-content";

            if (isListMode && (!item.bonus || item.bonus.length === 0)) {
                mainContentEl.classList.add("no-bonus-mode");
            }

            if (item.img) {
                const imgBox = document.createElement("div");
                imgBox.className = "image-box";
                imgBox.innerHTML = `<img src="${item.img}" alt="${item.name}" onerror="this.style.display='none'; this.parentNode.innerText='[Арт: ${item.name}]'"/>`;
                mainContentEl.appendChild(imgBox);
            }

            let tagsBox = null;
            if (item.tags && Array.isArray(item.tags)) {
                tagsBox = document.createElement("div");
                tagsBox.className = "card-tags";
                tagsBox.style.overflowY = "hidden"; 
                item.tags.forEach(t => { tagsBox.innerHTML += `<span class="tag">${t}</span>`; });
            }

            if (tagsBox && !isListMode) mainContentEl.appendChild(tagsBox);

            const scrollBox = document.createElement("div");
            scrollBox.className = "text-scroll-box";
            scrollBox.innerHTML = `<p class="card-desc">${item.shortDesc || ""}</p>`;
            mainContentEl.appendChild(scrollBox);

            if (tagsBox && isListMode) scrollBox.appendChild(tagsBox);
            cardEl.appendChild(mainContentEl);

            const bonusHtml = generateBonusHtml(item.bonus, true);
            if (bonusHtml) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = bonusHtml;
                if (tempDiv.firstElementChild) {
                    if (isListMode) {
                        mainContentEl.appendChild(tempDiv.firstElementChild);
                    } else {
                        cardEl.appendChild(tempDiv.firstElementChild);
                    }
                }
            }
            container.appendChild(cardEl);
        });

        if (savedScrollPosition > 0) {
            window.scrollTo(0, savedScrollPosition);
            savedScrollPosition = 0; 
        }
    }

    buildNavbar();
    showTab("classes");
});
///3

