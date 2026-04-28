const API_URL = 'http://localhost:3000/api';

const elements = {
    apiStatus: document.getElementById('api-status'),
    playerId: document.getElementById('player-id'),
    combatId: document.getElementById('combat-id'),
    loadStatsBtn: document.getElementById('load-stats-btn'),
    loadLogBtn: document.getElementById('load-log-btn'),
    feedback: document.getElementById('feedback'),
    totalCombats: document.getElementById('total-combats'),
    victories: document.getElementById('victories'),
    defeats: document.getElementById('defeats'),
    winRate: document.getElementById('win-rate'),
    avgTurns: document.getElementById('avg-turns'),
    avgBlood: document.getElementById('avg-blood'),
    levelChart: document.getElementById('level-chart'),
    enemyChart: document.getElementById('enemy-chart'),
    actionChart: document.getElementById('action-chart'),
    recentCombatsBody: document.getElementById('recent-combats-body'),
    combatTitle: document.getElementById('combat-title'),
    combatSummary: document.getElementById('combat-summary'),
    timelineCaption: document.getElementById('timeline-caption'),
    turnTimeline: document.getElementById('turn-timeline')
};

function showFeedback(message, isError = false) {
    elements.feedback.textContent = message;
    elements.feedback.classList.remove('hidden', 'error');
    if (isError) {
        elements.feedback.classList.add('error');
    }
}

function clearFeedback() {
    elements.feedback.classList.add('hidden');
    elements.feedback.textContent = '';
    elements.feedback.classList.remove('error');
}

function setApiStatus(text) {
    elements.apiStatus.textContent = text;
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString('es-CO');
}

function formatDuration(seconds) {
    const totalSeconds = Number(seconds || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(dateString) {
    if (!dateString) {
        return 'Sin fecha';
    }

    return new Date(dateString).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

function buildResultPill(result) {
    const normalized = result || 'pending';
    const label = normalized === 'victory'
        ? 'Victoria'
        : normalized === 'defeat'
            ? 'Derrota'
            : 'En curso';
    const className = normalized === 'victory'
        ? 'result-pill result-victory'
        : normalized === 'defeat'
            ? 'result-pill result-defeat'
            : 'result-pill result-pending';
    return `<span class="${className}">${label}</span>`;
}

function renderMetricSummary(summary) {
    elements.totalCombats.textContent = formatNumber(summary.total_combats);
    elements.victories.textContent = formatNumber(summary.victories);
    elements.defeats.textContent = formatNumber(summary.defeats);
    elements.winRate.textContent = `${formatNumber(summary.win_rate)}%`;
    elements.avgTurns.textContent = formatNumber(summary.avg_turns);
    elements.avgBlood.textContent = formatNumber(summary.avg_blood_used);
}

function renderBarList(container, rows, valueKey, detailBuilder) {
    container.innerHTML = '';

    if (!rows || rows.length === 0) {
        container.innerHTML = '<div class="empty-state">Sin datos suficientes todavia.</div>';
        return;
    }

    const maxValue = Math.max(...rows.map(row => Number(row[valueKey] || 0)), 1);

    for (const row of rows) {
        const barWidth = Math.max((Number(row[valueKey] || 0) / maxValue) * 100, 4);
        const item = document.createElement('div');
        item.className = 'bar-row';
        item.innerHTML = `
            <div class="bar-label">${row.label}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${barWidth}%"></div></div>
            <div class="bar-value">${detailBuilder(row)}</div>
        `;
        container.appendChild(item);
    }
}

function renderRecentCombats(rows) {
    elements.recentCombatsBody.innerHTML = '';

    if (!rows || rows.length === 0) {
        elements.recentCombatsBody.innerHTML = '<tr><td colspan="9" class="empty-state">No hay combates para mostrar.</td></tr>';
        return;
    }

    for (const row of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.Combat_id}</td>
            <td>${row.Player_name}</td>
            <td>${row.Level_name}</td>
            <td>${row.Enemy_name}</td>
            <td>${buildResultPill(row.Result)}</td>
            <td>${formatNumber(row.Total_turns)}</td>
            <td>${formatNumber(row.Blood_used)}</td>
            <td>${formatDuration(row.Duration_seconds)}</td>
            <td><button class="table-btn" data-combat-id="${row.Combat_id}">Abrir</button></td>
        `;
        elements.recentCombatsBody.appendChild(tr);
    }

    for (const button of elements.recentCombatsBody.querySelectorAll('[data-combat-id]')) {
        button.addEventListener('click', () => {
            const combatId = button.getAttribute('data-combat-id');
            elements.combatId.value = combatId;
            loadCombatLog(combatId);
        });
    }
}

function renderCombatSummary(combat, summary) {
    elements.combatTitle.textContent = `Combate #${combat.Combat_id} · ${combat.Player_name} vs ${combat.Enemy_name}`;
    elements.timelineCaption.textContent = `${combat.Level_name} · ${buildResultPill(combat.Result)}`;

    elements.combatSummary.classList.remove('empty-state');
    elements.combatSummary.innerHTML = `
        <div class="summary-tile">
            <span class="metric-label">Resultado</span>
            <strong>${combat.Result || 'En curso'}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Duracion</span>
            <strong>${formatDuration(combat.Duration_seconds)}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Turnos registrados</span>
            <strong>${formatNumber(summary.totalTurns)}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Acciones del jugador</span>
            <strong>${formatNumber(summary.playerActions)}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Acciones del enemigo</span>
            <strong>${formatNumber(summary.enemyActions)}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Sangre usada</span>
            <strong>${formatNumber(combat.Blood_used)}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Danio jugador</span>
            <strong>${formatNumber(summary.playerDamage)}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Danio enemigo</span>
            <strong>${formatNumber(summary.enemyDamage)}</strong>
        </div>
        <div class="summary-tile">
            <span class="metric-label">Inicio</span>
            <strong>${formatDate(combat.Started_at)}</strong>
        </div>
    `;
}

function renderTimeline(turns) {
    elements.turnTimeline.innerHTML = '';
    elements.turnTimeline.classList.remove('empty-state');

    if (!turns || turns.length === 0) {
        elements.turnTimeline.classList.add('empty-state');
        elements.turnTimeline.textContent = 'Este combate no tiene turnos registrados.';
        return;
    }

    for (const turn of turns) {
        const turnCard = document.createElement('article');
        turnCard.className = 'turn-card';

        const actionsMarkup = (turn.actions || []).length === 0
            ? '<div class="action-row"><div class="empty-state">Sin acciones registradas en este turno.</div></div>'
            : turn.actions.map(action => `
                <div class="action-row">
                    <img src="${action.Sprite_path}" alt="${action.Card_name}" loading="lazy">
                    <div class="action-meta">
                        <strong>${action.Card_name || `Carta ${action.Card_id}`}</strong>
                        <span>${action.Used_by} · ${action.Action_type} · danio ${formatNumber(action.Damage_dealt)}</span>
                        <span>HP ${action.HP_before ?? '-'} → ${action.HP_after ?? '-'}${action.Card_dead ? ' · KO' : ''}</span>
                    </div>
                    <div class="action-extra">
                        <div>Sangre: ${formatNumber(action.Blood_spent)}</div>
                        <div>${formatDate(action.Created_at)}</div>
                    </div>
                </div>
            `).join('');

        turnCard.innerHTML = `
            <div class="turn-header">
                <div>
                    <strong>Turno ${turn.Turn_number}</strong>
                    <span>${turn.Active_player} activo</span>
                </div>
                <div class="action-extra">
                    <div>Sangre del turno: ${formatNumber(turn.Blood_spent)}</div>
                    <div>${formatDate(turn.Turn_timestamp)}</div>
                </div>
            </div>
            <div class="turn-actions">${actionsMarkup}</div>
        `;

        elements.turnTimeline.appendChild(turnCard);
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'No se pudo completar la consulta');
    }
    return data;
}

async function loadStats() {
    clearFeedback();
    setApiStatus('Cargando estadisticas...');

    try {
        const params = new URLSearchParams({ limit: '12' });
        if (elements.playerId.value.trim()) {
            params.set('playerId', elements.playerId.value.trim());
        }

        const data = await fetchJson(`${API_URL}/combat/stats?${params.toString()}`);
        renderMetricSummary(data.summary);
        renderBarList(elements.levelChart, data.by_level, 'total_combats', row => `${formatNumber(row.total_combats)} combates · ${formatNumber(row.victories)} victorias`);
        renderBarList(elements.enemyChart, data.by_enemy, 'total_combats', row => `${formatNumber(row.total_combats)} combates · ${formatNumber(row.avg_turns)} turnos prom.`);
        renderBarList(elements.actionChart, data.by_action_type, 'total_actions', row => `${formatNumber(row.total_actions)} usos · ${formatNumber(row.total_damage)} dano`);
        renderRecentCombats(data.recent_combats);
        setApiStatus('Estadisticas actualizadas');

        if (data.recent_combats.length > 0 && !elements.combatId.value.trim()) {
            elements.combatId.value = data.recent_combats[0].Combat_id;
            await loadCombatLog(data.recent_combats[0].Combat_id, true);
        }
    } catch (error) {
        setApiStatus('Error de consulta');
        showFeedback(error.message, true);
    }
}

async function loadCombatLog(combatId, silent = false) {
    const finalCombatId = String(combatId || elements.combatId.value || '').trim();
    if (!finalCombatId) {
        showFeedback('Escribe un Combat_id o selecciona uno de la tabla.', true);
        return;
    }

    if (!silent) {
        clearFeedback();
    }
    setApiStatus(`Cargando combate #${finalCombatId}...`);

    try {
        const data = await fetchJson(`${API_URL}/combat/${finalCombatId}/log`);
        renderCombatSummary(data.combat, data.summary);
        renderTimeline(data.turns);
        setApiStatus(`Combate #${finalCombatId} cargado`);
    } catch (error) {
        setApiStatus('Error de consulta');
        showFeedback(error.message, true);
    }
}

elements.loadStatsBtn.addEventListener('click', () => {
    loadStats();
});

elements.loadLogBtn.addEventListener('click', () => {
    loadCombatLog();
});

elements.combatId.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        loadCombatLog();
    }
});

elements.playerId.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        loadStats();
    }
});

loadStats();