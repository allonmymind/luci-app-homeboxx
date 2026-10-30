'use strict';
'require view';
'require ui';
'require rpc';
'require dom';

var callRcInit = rpc.declare({
	object: 'rc',
	method: 'init',
	params: ['name', 'action'],
	reject: true
});

var callRcList = rpc.declare({
	object: 'rc',
	method: 'list',
	params: ['name', 'skip_running_check'],
	expect: { '': {} },
	reject: true
});

var callSvcList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} },
	reject: true
});

function toast(msg, kind) {
	try { ui.addNotification(kind || 'info', msg); }
	catch (e) { try { notify(msg, kind); } catch (e2) { window.alert(msg); } }
}

function parseRcState(res, name) {
	if (!res || typeof res !== 'object') return { hasInit: false, enabled: null };
	var entry = res[name] || null;
	if (!entry) return { hasInit: false, enabled: null };
	return { hasInit: true, enabled: !!(entry.enabled) };
}

function svcRunning(res, name) {
	try {
		var svc = res && res[name];
		if (!svc || !svc.instances) return null;
		for (var k in svc.instances) {
			if (svc.instances[k] && svc.instances[k].running) return true;
		}
		return false;
	} catch (e) { return null; }
}

return view.extend({
	load: function () {
		var rl = callRcList('homebox', true).then(function (r) {
			return parseRcState(r, 'homebox');
		}).catch(function () {
			return { hasInit: false, enabled: null };
		});
		var sl = callSvcList('homebox').then(function (r) {
			return svcRunning(r, 'homebox');
		}).catch(function () {
			return null;
		});
		return Promise.all([rl, sl]).then(function (a) {
			var st = a[0];
			st.running = (a[1] !== null) ? a[1] : null;
			return st;
		});
	},

	render: function (state) {
		var self = this;
		var st = state || { hasInit: false, enabled: null, running: null };
		self._state = st;

		var url = 'http://' + window.location.hostname + ':3300/';

		var running = st.running, enabled = st.enabled, unknown = (running == null);
		var statusStr = unknown ? _('状态未知（无法读取服务状态）')
			: (running ? _('运行中') : _('已停止'));
		var statusText = E('span', { 'id': 'homebox-state-text' }, [ statusStr ]);

		var btnStart = E('button', { 'class': 'cbi-button cbi-button-apply', 'id': 'homebox-start' }, [ _('启动') ]);
		var btnStop = E('button', { 'class': 'cbi-button cbi-button-negative', 'id': 'homebox-stop' }, [ _('停止') ]);
		var btnRestart = E('button', { 'class': 'cbi-button cbi-button-action', 'id': 'homebox-restart' }, [ _('重启') ]);
		var btnAuto = E('button', { 'class': 'cbi-button cbi-button-reload', 'id': 'homebox-auto' },
			[ (enabled === true) ? _('禁用开机自启') : _('启用开机自启') ]);

		btnStart.disabled = (running === true);
		btnStop.disabled = (running === false);
		btnRestart.disabled = (running === false);

		btnStart.addEventListener('click', function () { self.svcAction('start'); });
		btnStop.addEventListener('click', function () { self.svcAction('stop'); });
		btnRestart.addEventListener('click', function () { self.svcAction('restart'); });
		btnAuto.addEventListener('click', function () {
			self.svcAction(self._state.enabled ? 'disable' : 'enable');
		});

		var btnRow = E('div', { 'class': 'cbi-page-actions' }, [
			btnStart, ' ', btnStop, ' ', btnRestart, ' ', btnAuto
		]);

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Homebox 内网测速')),

			E('div', { 'class': 'cbi-section' }, [
				E('p', {}, _('Homebox 提供浏览器内网测速服务。')),
				E('p', {}, [
					_('测速页面: '),
					E('a', { 'href': url, 'target': '_blank', 'rel': 'noopener noreferrer' }, [ url ])
				]),
				E('div', { 'class': 'right' }, [
					E('a', { 'class': 'btn cbi-button cbi-button-action', 'href': url, 'target': '_blank', 'rel': 'noopener noreferrer' }, [ _('打开测速页面') ])
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('服务控制')),
				E('p', {}, [ _('当前状态: '), statusText ])
			]),

			btnRow,

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('说明')),
				E('p', {}, _('也可在 系统 → 启动项 中管理 homebox 服务。')),
				E('pre', {}, [
					'/etc/init.d/homebox enable\n',
					'/etc/init.d/homebox start\n',
					'/etc/init.d/homebox status'
				])
			])
		]);
	},

	_updateUi: function () {
		var st = this._state || {};
		var running = st.running, enabled = st.enabled, unknown = (running == null);
		var txt = unknown ? _('状态未知（无法读取服务状态）')
			: (running ? _('运行中') : _('已停止'));
		var stEl = document.getElementById('homebox-state-text');
		if (stEl) stEl.textContent = txt;

		var bS = document.getElementById('homebox-start'),
			bT = document.getElementById('homebox-stop'),
			bR = document.getElementById('homebox-restart'),
			bA = document.getElementById('homebox-auto');
		if (bS) bS.disabled = (running === true);
		if (bT) bT.disabled = (running === false);
		if (bR) bR.disabled = (running === false);
		if (bA) {
			bA.textContent = (enabled === true) ? _('禁用开机自启') : _('启用开机自启');
		}
	},

	svcAction: function (action) {
		var self = this;
		ui.showModal(_('请稍候'), [ E('p', {}, _('正在执行: %s').format(action)) ]);
		callRcInit('homebox', action)
			.then(function () { return new Promise(function (r) { setTimeout(r, 1000); }); })
			.then(function () { return self.refreshStatus(); })
			.catch(function (e) { toast(_('操作失败: %s').format(e), 'error'); })
			.finally(function () { ui.hideModal(); });
	},

	refreshStatus: function () {
		var self = this;
		var rl = callRcList('homebox', true).then(function (r) {
			return parseRcState(r, 'homebox');
		}).catch(function () {
			return { hasInit: false, enabled: null };
		});
		var sl = callSvcList('homebox').then(function (r) {
			return svcRunning(r, 'homebox');
		}).catch(function () {
			return null;
		});
		return Promise.all([rl, sl]).then(function (a) {
			var st = a[0];
			st.running = (a[1] !== null) ? a[1] : null;
			self._state = st;
			self._updateUi();
		}).catch(function () {
			self._state = { hasInit: false, enabled: null, running: null };
			self._updateUi();
		});
	}
});
