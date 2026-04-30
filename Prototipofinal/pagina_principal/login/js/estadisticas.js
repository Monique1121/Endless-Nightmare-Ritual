"use strict";

const API_URL = 'http://localhost:3000/api';
const DASHBOARD_REFRESH_INTERVAL_MS = 5000;

let dashboardRefreshTimer = null;
let dashboardRequestInFlight = false;

// Este dashboard junta varias graficas para que admin vea el estado general sin picarle tanto.

// Separamos referencias al DOM desde el inicio porque este archivo mueve medio panel solo.
const elements = {
	sessionLabel: document.getElementById('admin-session-label'),
	locked: document.getElementById('admin-locked'),
	dashboard: document.getElementById('admin-dashboard'),
	activeUsers: document.getElementById('summary-active-users'),
	players: document.getElementById('summary-players'),
	runs: document.getElementById('summary-runs'),
	completedRuns: document.getElementById('summary-completed-runs'),
	combats: document.getElementById('summary-combats'),
	winRate: document.getElementById('summary-win-rate'),
	playerProgressChart: document.getElementById('player-progress-chart'),
	runStatusChart: document.getElementById('run-status-chart'),
	runsByLevelChart: document.getElementById('runs-by-level-chart'),
	combatByLevelChart: document.getElementById('combat-by-level-chart'),
	resourceTotalsChart: document.getElementById('resource-totals-chart'),
	topPlayersChart: document.getElementById('top-players-chart'),
	usersManagementCaption: document.getElementById('users-management-caption'),
	usersManagementList: document.getElementById('users-management-list')
};

function getStoredUsername() {
	return String(localStorage.getItem('username') || '').trim();
}

function getStoredUserId() {
	const value = Number.parseInt(localStorage.getItem('userId'), 10);
	return Number.isInteger(value) && value > 0 ? value : null;
}

function formatNumber(value) {
	return Number(value || 0).toLocaleString('es-MX');
}

function formatChartTick(value) {
	const numericValue = Number(value || 0);
	if (Number.isInteger(numericValue)) {
		return formatNumber(numericValue);
	}
	return numericValue.toFixed(1).replace(/\.0$/, '');
}

function formatChartLabel(label) {
	// Aqui recortamos etiquetas largas para que la grafica no se vea toda amontonada.
	const normalizedLabel = String(label || '').trim().toLowerCase();
	const shortLabels = {
		'perfiles creados': 'Perfiles',
		'escuela desbloqueada': 'Escuela',
		'laboratorio desbloqueado': 'Lab.',
		'hospital desbloqueado': 'Hospital',
		'runs completados': 'Completados',
		'runs fallidos': 'Fallidos',
		'runs activos': 'Activos',
		'secretos descubiertos': 'Secretos',
		'cofres abiertos': 'Cofres',
		'cartas obtenidas': 'Cartas',
		'logros desbloqueados': 'Logros'
	};

	if (shortLabels[normalizedLabel]) {
		return shortLabels[normalizedLabel];
	}

	const cleanedLabel = String(label || '')
		.replace(/^Runs\s+/i, '')
		.replace(/\s+desbloquead[oa]s?$/i, '')
		.replace(/\s+descubiertos?$/i, '')
		.replace(/\s+obtenidas?$/i, '')
		.replace(/\s+desbloqueados?$/i, '')
		.replace(/\s+creados?$/i, '')
		.trim();

	if (!cleanedLabel) {
		return String(label || '');
	}

	const sentenceCaseLabel = cleanedLabel.charAt(0).toUpperCase() + cleanedLabel.slice(1);
	return sentenceCaseLabel.length > 12 ? `${sentenceCaseLabel.slice(0, 11)}…` : sentenceCaseLabel;
}

function formatCountLabel(value, singularLabel, pluralLabel = `${singularLabel}s`) {
	const numericValue = valueOrZero(value);
	const unitLabel = numericValue === 1 ? singularLabel : pluralLabel;
	return `${formatNumber(numericValue)} ${unitLabel}`;
}

function formatMinutes(seconds) {
	const totalSeconds = Math.max(Math.round(Number(valueOrZero(seconds))), 0);
	const minutes = Math.floor(totalSeconds / 60);
	const remainingSeconds = totalSeconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

function formatHours(seconds) {
	const totalSeconds = Number(valueOrZero(seconds));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (hours <= 0) {
		return `${minutes}m`;
	}
	return `${hours}h ${minutes}m`;
}

function valueOrZero(value) {
	return Number(value || 0);
}

function showError(message) {
	elements.sessionLabel.textContent = message;
	elements.locked.classList.remove('hidden');
	elements.dashboard.classList.add('hidden');
}

function showDashboard(message) {
	elements.sessionLabel.textContent = message;
	elements.locked.classList.add('hidden');
	elements.dashboard.classList.remove('hidden');
}

function renderSummary(overview) {
	elements.activeUsers.textContent = formatNumber(overview.active_users);
	elements.players.textContent = formatNumber(overview.total_players);
	elements.runs.textContent = formatNumber(overview.total_runs);
	elements.completedRuns.textContent = formatNumber(overview.completed_runs);
	elements.combats.textContent = formatNumber(overview.total_combats);
	elements.winRate.textContent = `${formatNumber(overview.combat_win_rate)}%`;
}

function buildChartTicks(maxValue, tickCount = 5) {
	return Array.from({ length: tickCount + 1 }, (_, index) => {
		const tickValue = (maxValue / tickCount) * (tickCount - index);
		return formatChartTick(tickValue);
	});
}

function buildAxisLabels(ticks) {
	return `
		<div class="ritual-chart-axis-labels">
			${ticks.map((tick) => `<span class="ritual-chart-axis-label">${tick}</span>`).join('')}
		</div>
	`;
}

function buildDetailCards(rows, palette, detailBuilder, options = {}) {
	if (typeof detailBuilder !== 'function') {
		return '';
	}

	const wrapperClass = options.wrapperClass || 'ritual-chart-insights';
	const itemClass = options.itemClass || 'ritual-chart-insight';
	const dotClass = options.dotClass || 'ritual-chart-insight-dot';

	return `
		<div class="${wrapperClass}">
			${rows.map((row, index) => `
				<article class="${itemClass}">
					<span class="${dotClass}" style="--dot-color:${palette[index % palette.length]};"></span>
					<div>
						<strong>${escapeHtml(row.label)}</strong>
						<p>${escapeHtml(detailBuilder(row))}</p>
					</div>
				</article>
			`).join('')}
		</div>
	`;
}

function formatChartShare(value, total) {
	const safeTotal = valueOrZero(total);
	if (safeTotal <= 0) {
		return '0%';
	}

	const share = (valueOrZero(value) / safeTotal) * 100;
	return `${share.toFixed(1).replace(/\.0$/, '')}%`;
}

function buildDonutFill(rows, valueKey, palette) {
	const totalValue = rows.reduce((sum, row) => sum + valueOrZero(row[valueKey]), 0);
	if (totalValue <= 0) {
		return 'conic-gradient(rgba(74, 12, 12, 0.85) 0 100%)';
	}

	let currentStop = 0;
	const segments = rows
		.filter((row) => valueOrZero(row[valueKey]) > 0)
		.map((row, index) => {
			const value = valueOrZero(row[valueKey]);
			const nextStop = currentStop + ((value / totalValue) * 100);
			const color = palette[index % palette.length];
			const segment = `${color} ${currentStop.toFixed(2)}% ${nextStop.toFixed(2)}%`;
			currentStop = nextStop;
			return segment;
		});

	return `conic-gradient(${segments.join(', ')})`;
}

function renderBarList(container, rows, valueKey, detailBuilder, options = {}) {
	container.innerHTML = '';

	if (!rows || rows.length === 0) {
		container.innerHTML = '<div class="admin-empty-state">Sin datos suficientes todavía.</div>';
		return;
	}

	const palette = options.palette || ['#1ea7ff', '#ff4d4d', '#f7e21b', '#18b65d', '#9aa77c', '#f58a4e', '#e19abb', '#8b5cf6'];
	const visibleRows = rows.slice(0, options.maxBars || rows.length);
	const maxValue = Math.max(...visibleRows.map((row) => valueOrZero(row[valueKey])), 1);
	const ticks = buildChartTicks(maxValue);

	const chart = document.createElement('section');
	chart.className = 'ritual-chart-shell';
	chart.innerHTML = `
		<div class="ritual-chart-frame">
			${buildAxisLabels(ticks)}
			<div class="ritual-chart-plot">
				<div class="ritual-chart-bars" style="--bar-count:${visibleRows.length};">
					${visibleRows.map((row, index) => {
						const value = valueOrZero(row[valueKey]);
						const height = value > 0 ? Math.max((value / maxValue) * 100, 8) : 3;
						const color = palette[index % palette.length];
						const chartLabel = formatChartLabel(row.label);
						return `
							<article class="ritual-chart-column">
								<strong class="ritual-chart-value">${formatNumber(value)}</strong>
								<div class="ritual-chart-bar-slot">
									<div class="ritual-chart-bar" style="--bar-height:${height}%; --bar-color:${color};"></div>
								</div>
								<span class="ritual-chart-label" title="${escapeHtml(row.label)}">${escapeHtml(chartLabel)}</span>
							</article>
						`;
					}).join('')}
				</div>
			</div>
		</div>
		${buildDetailCards(visibleRows, palette, detailBuilder)}
	`;

	container.appendChild(chart);
}

function renderFunnelChart(container, rows, valueKey, detailBuilder, options = {}) {
	container.innerHTML = '';

	if (!rows || rows.length === 0) {
		container.innerHTML = '<div class="admin-empty-state">Sin datos suficientes todavía.</div>';
		return;
	}

	const palette = options.palette || ['#1ea7ff', '#4db0ff', '#7fc2ff', '#adcfff', '#d1dfff'];
	const visibleRows = rows.slice(0, options.maxSteps || rows.length);
	const maxValue = Math.max(...visibleRows.map((row) => valueOrZero(row[valueKey])), 1);

	const chart = document.createElement('section');
	chart.className = 'ritual-chart-shell';
	chart.innerHTML = `
		<div class="ritual-funnel-list">
			${visibleRows.map((row, index) => {
				const value = valueOrZero(row[valueKey]);
				const width = value > 0 ? Math.max((value / maxValue) * 100, 18) : 12;
				const color = palette[index % palette.length];
				const detailText = typeof detailBuilder === 'function'
					? detailBuilder(row)
					: `${formatNumber(value)} registros en esta fase.`;

				return `
					<article class="ritual-funnel-step">
						<div class="ritual-funnel-meta">
							<span class="ritual-funnel-order">${index + 1}</span>
							<div>
								<strong>${escapeHtml(row.label)}</strong>
								<p>${escapeHtml(detailText)}</p>
							</div>
						</div>
						<div class="ritual-funnel-track">
							<div class="ritual-funnel-bar" style="--funnel-width:${width}%; --step-color:${color};">
								<span class="ritual-funnel-value">${formatNumber(value)}</span>
							</div>
						</div>
					</article>
				`;
			}).join('')}
		</div>
	`;

	container.appendChild(chart);
}

function renderDonutChart(container, rows, valueKey, detailBuilder, options = {}) {
	container.innerHTML = '';

	if (!rows || rows.length === 0) {
		container.innerHTML = '<div class="admin-empty-state">Sin datos suficientes todavía.</div>';
		return;
	}

	const palette = options.palette || ['#1ea7ff', '#ff4d4d', '#f7e21b', '#18b65d', '#9aa77c', '#f58a4e'];
	const visibleRows = rows.slice(0, options.maxSlices || rows.length);
	const totalValue = visibleRows.reduce((sum, row) => sum + valueOrZero(row[valueKey]), 0);
	const donutFill = buildDonutFill(visibleRows, valueKey, palette);
	const centerLabel = options.centerLabel || 'Total';
	const centerValue = typeof options.centerValueFormatter === 'function'
		? options.centerValueFormatter(totalValue)
		: formatNumber(totalValue);

	const chart = document.createElement('section');
	chart.className = 'ritual-chart-shell';
	chart.innerHTML = `
		<div class="ritual-donut-layout">
			<div class="ritual-donut" style="--donut-fill:${donutFill};">
				<div class="ritual-donut-hole">
					<span>${escapeHtml(centerLabel)}</span>
					<strong>${escapeHtml(centerValue)}</strong>
				</div>
			</div>
			<div class="ritual-donut-legend">
				${visibleRows.map((row, index) => {
					const value = valueOrZero(row[valueKey]);
					const color = palette[index % palette.length];
					const chartLabel = formatChartLabel(row.label);
					const detailText = typeof detailBuilder === 'function'
						? detailBuilder(row)
						: `${formatNumber(value)} registros.`;
					return `
						<article class="ritual-donut-item">
							<span class="ritual-donut-dot" style="--dot-color:${color};"></span>
							<div>
								<strong title="${escapeHtml(row.label)}">${escapeHtml(chartLabel)}</strong>
								<p>${escapeHtml(detailText)} · ${formatChartShare(value, totalValue)}</p>
							</div>
						</article>
					`;
				}).join('')}
			</div>
		</div>
	`;

	container.appendChild(chart);
}

function renderGroupedBarChart(container, rows, series, detailBuilder, options = {}) {
	container.innerHTML = '';

	if (!rows || rows.length === 0) {
		container.innerHTML = '<div class="admin-empty-state">Sin datos suficientes todavía.</div>';
		return;
	}

	const visibleRows = rows.slice(0, options.maxGroups || rows.length);
	const maxValue = Math.max(
		...visibleRows.flatMap((row) => series.map((item) => valueOrZero(row[item.key]))),
		1
	);
	const ticks = buildChartTicks(maxValue);
	const notePalette = options.notePalette || ['#1ea7ff', '#ff4d4d', '#f7e21b', '#18b65d', '#9aa77c'];

	const chart = document.createElement('section');
	chart.className = 'ritual-chart-shell';
	chart.innerHTML = `
		<div class="ritual-chart-frame">
			${buildAxisLabels(ticks)}
			<div class="ritual-chart-plot">
				<div class="ritual-chart-groups" style="--group-count:${visibleRows.length};">
					${visibleRows.map((row) => `
						<article class="ritual-chart-group">
							<div class="ritual-chart-group-columns" style="--series-count:${series.length};">
								${series.map((item) => {
									const value = valueOrZero(row[item.key]);
									const height = value > 0 ? Math.max((value / maxValue) * 100, 8) : 3;
									return `
										<div class="ritual-chart-series-column">
											<span class="ritual-chart-series-value">${formatNumber(value)}</span>
											<div class="ritual-chart-series-bar-slot">
												<div class="ritual-chart-series-bar" style="--bar-height:${height}%; --series-color:${item.color};"></div>
											</div>
										</div>
									`;
								}).join('')}
							</div>
							<span class="ritual-chart-group-label" title="${escapeHtml(row.label)}">${escapeHtml(formatChartLabel(row.label))}</span>
						</article>
					`).join('')}
				</div>
			</div>
		</div>
		<div class="ritual-chart-legend">
			${series.map((item) => `
				<span class="ritual-chart-legend-item">
					<span class="ritual-chart-legend-swatch" style="--swatch-color:${item.color};"></span>
					${escapeHtml(item.label)}
				</span>
			`).join('')}
		</div>
		${buildDetailCards(visibleRows, notePalette, detailBuilder, {
			wrapperClass: 'ritual-chart-notes',
			itemClass: 'ritual-chart-note',
			dotClass: 'ritual-chart-note-dot'
		})}
	`;

	container.appendChild(chart);
}

function renderRankingChart(container, rows, valueKey, detailBuilder, options = {}) {
	container.innerHTML = '';

	if (!rows || rows.length === 0) {
		container.innerHTML = '<div class="admin-empty-state">Sin datos suficientes todavía.</div>';
		return;
	}

	const palette = options.palette || ['#f7e21b', '#1ea7ff', '#ff4d4d', '#18b65d', '#9aa77c'];
	const visibleRows = rows.slice(0, options.maxRows || 5);
	const maxValue = Math.max(...visibleRows.map((row) => valueOrZero(row[valueKey])), 1);
	const scoreFormatter = typeof options.scoreFormatter === 'function'
		? options.scoreFormatter
		: (value) => formatNumber(value);

	const chart = document.createElement('section');
	chart.className = 'ritual-chart-shell';
	chart.innerHTML = `
		<div class="ritual-ranking-list">
			${visibleRows.map((row, index) => {
				const value = valueOrZero(row[valueKey]);
				const color = palette[index % palette.length];
				const width = value > 0 ? Math.max((value / maxValue) * 100, 10) : 5;
				const detailText = typeof detailBuilder === 'function'
					? detailBuilder(row)
					: `${formatNumber(value)} puntos acumulados.`;

				return `
					<article class="ritual-ranking-row">
						<div class="ritual-ranking-head">
							<span class="ritual-ranking-place">#${index + 1}</span>
							<strong>${escapeHtml(row.label)}</strong>
							<span class="ritual-ranking-score">${escapeHtml(scoreFormatter(value, row))}</span>
						</div>
						<div class="ritual-ranking-track">
							<div class="ritual-ranking-bar" style="--rank-width:${width}%; --rank-color:${color};"></div>
						</div>
						<p class="ritual-ranking-meta">${escapeHtml(detailText)}</p>
					</article>
				`;
			}).join('')}
		</div>
	`;

	container.appendChild(chart);
}

function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatDate(dateString) {
	if (!dateString) {
		return 'Sin fecha';
	}

	return new Date(dateString).toLocaleString('es-MX', {
		dateStyle: 'short',
		timeStyle: 'short'
	});
}

function renderUsersList(rows, canDeleteUsers, viewerUserId) {
	elements.usersManagementList.innerHTML = '';
	elements.usersManagementCaption.textContent = canDeleteUsers
		? 'Modo admin: puedes borrar usuarios no administradores'
		: 'Modo ejecutivo: visible para todos. El borrado solo aparece para administradores';

	if (!rows || rows.length === 0) {
		elements.usersManagementList.innerHTML = '<div class="admin-empty-state">No hay usuarios para mostrar.</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('article');
		item.className = 'user-management-row';
		const statusLabel = row.Is_active ? 'Activo' : 'Eliminado';
		const resolvedRole = row.user_role || (row.is_admin ? 'admin' : 'ejecutivo');
		const roleLabel = resolvedRole === 'admin' ? 'Admin' : 'Ejecutivo';
		const roleBadge = `<span class="user-role-badge ${resolvedRole === 'admin' ? 'is-admin' : 'is-executive'}">${roleLabel}</span>`;
		const deleteButton = canDeleteUsers && !row.is_admin && row.Is_active
			? `<button class="user-delete-button" data-user-id="${row.User_id}">Borrar usuario</button>`
			: '';

		item.innerHTML = `
			<div class="user-management-info">
				<div class="user-management-head">
					<strong>${escapeHtml(row.Username)}</strong>
					<span class="user-status-badge">${statusLabel}</span>
					${roleBadge}
				</div>
				<p>Jugador: ${escapeHtml(row.Player_name || 'Sin perfil')} · Runs: ${formatNumber(row.total_runs)} · Completados: ${formatNumber(row.completed_runs)} · Cartas: ${formatNumber(row.total_cards)}</p>
				<p>Último acceso: ${escapeHtml(formatDate(row.Last_login))}</p>
			</div>
			<div class="user-management-actions">${deleteButton}</div>
		`;
		elements.usersManagementList.appendChild(item);
	});

	if (canDeleteUsers) {
		for (const button of elements.usersManagementList.querySelectorAll('[data-user-id]')) {
			button.addEventListener('click', async () => {
				const targetUserId = button.getAttribute('data-user-id');
				if (!confirm('¿Seguro que quieres borrar este usuario?')) {
					return;
				}

				button.disabled = true;
				try {
					const response = await fetch(`${API_URL}/admin/users/${targetUserId}?userId=${viewerUserId}`, {
						method: 'DELETE',
						headers: {
							'X-User-Id': String(viewerUserId)
						}
					});
					const data = await response.json();

					if (!response.ok || !data.success) {
						throw new Error(data.message || 'No se pudo borrar el usuario.');
					}

					await loadAdminDashboard();
				} catch (error) {
					console.error('Error borrando usuario:', error);
					alert(error.message || 'No se pudo borrar el usuario.');
					button.disabled = false;
				}
			});
		}
	}
}

async function loadAdminDashboard() {
	if (dashboardRequestInFlight) {
		return;
	}

	dashboardRequestInFlight = true;
	const userId = getStoredUserId();

	try {
		const query = userId ? `?userId=${userId}` : '';
		const headers = userId ? { 'X-User-Id': String(userId) } : {};
		const response = await fetch(`${API_URL}/admin/dashboard${query}`, { headers });

		const data = await response.json();

		if (!response.ok || !data.success) {
			throw new Error(data.message || 'No se pudo cargar el panel admin.');
		}

		const canDeleteUsers = Boolean(data.management && data.management.can_delete_users);
		const viewerRole = data.viewer
			? (data.viewer.userRole || (data.viewer.isAdmin ? 'admin' : 'ejecutivo'))
			: null;
		const viewerLabel = data.viewer
			? `Modo ${viewerRole === 'admin' ? 'admin' : 'ejecutivo'}: ${data.viewer.username}`
			: 'Vista pública de estadísticas';

		showDashboard(viewerLabel);
		renderSummary(data.overview);

		renderFunnelChart(
			elements.playerProgressChart,
			data.player_progress,
			'total',
			(row) => `${formatCountLabel(row.total, 'jugador')} con este hito.`
		);

		renderDonutChart(
			elements.runStatusChart,
			data.run_status,
			'total',
			(row) => `${formatCountLabel(row.total, 'registro')} en este estado.`,
			{ centerLabel: 'Runs' }
		);

		renderGroupedBarChart(
			elements.runsByLevelChart,
			data.runs_by_level,
			[
				{ key: 'total_runs', label: 'Total', color: '#1ea7ff' },
				{ key: 'completed_runs', label: 'Completados', color: '#18b65d' },
				{ key: 'failed_runs', label: 'Fallidos', color: '#ff4d4d' }
			],
			(row) => `Completados: ${formatNumber(row.completed_runs)} · Fallidos: ${formatNumber(row.failed_runs)} · Tiempo prom.: ${formatMinutes(row.avg_time)}`
		);

		renderGroupedBarChart(
			elements.combatByLevelChart,
			data.combat_by_level,
			[
				{ key: 'total_combats', label: 'Combates', color: '#1ea7ff' },
				{ key: 'victories', label: 'Victorias', color: '#f7e21b' },
				{ key: 'defeats', label: 'Derrotas', color: '#ff4d4d' }
			],
			(row) => `Victorias: ${formatNumber(row.victories)} · Derrotas: ${formatNumber(row.defeats)}`
		);

		renderBarList(
			elements.resourceTotalsChart,
			data.resource_totals,
			'total',
			(row) => `${formatCountLabel(row.total, 'elemento')} registrados en la BD.`
		);

		renderRankingChart(
			elements.topPlayersChart,
			data.top_players,
			'completed_runs',
			(row) => `Cartas: ${formatNumber(row.total_cards)} · Secretos: ${formatNumber(row.total_secrets)} · Tiempo: ${formatHours(row.Total_playtime)}`,
			{ scoreFormatter: (value) => `${formatNumber(value)} runs` }
		);

		renderUsersList(data.users, canDeleteUsers, data.viewer ? data.viewer.userId : null);
	} catch (error) {
		console.error('Error cargando dashboard admin:', error);
		showError(error.message || 'No se pudo cargar el panel de estadísticas.');
	} finally {
		dashboardRequestInFlight = false;
	}
}

function startDashboardAutoRefresh() {
	if (dashboardRefreshTimer) {
		return;
	}

	dashboardRefreshTimer = window.setInterval(() => {
		if (!document.hidden) {
			loadAdminDashboard();
		}
	}, DASHBOARD_REFRESH_INTERVAL_MS);
}

function stopDashboardAutoRefresh() {
	if (!dashboardRefreshTimer) {
		return;
	}

	window.clearInterval(dashboardRefreshTimer);
	dashboardRefreshTimer = null;
}

window.addEventListener('DOMContentLoaded', () => {
	loadAdminDashboard();
	startDashboardAutoRefresh();

	document.addEventListener('visibilitychange', () => {
		if (!document.hidden) {
			loadAdminDashboard();
		}
	});

	window.addEventListener('beforeunload', stopDashboardAutoRefresh);
});
