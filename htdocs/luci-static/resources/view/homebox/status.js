'use strict';
'require form';
'require uci';
'require rpc';
'require ui';

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

var m = new form.Map('homebox', _('内网测速'), _('Homebox是一个局域网测速工具'));

/* 加载服务运行状态，供状态显示使用 */
m.load = function () {
	return uci.load('homebox').then(function () {
		return Promise.all([callRcList('homebox', true), callSvcList('homebox')])
			.then(function (a) {
				var st = parseRcState(a[0], 'homebox');
				st.running = svcRunning(a[1], 'homebox');
				return st;
			})
			.catch(function () {
				return { hasInit: false, enabled: null, running: null };
			});
	});
};

/* 全局设置 */
var s = m.section(form.NamedSection, 'main', 'homebox', _('全局设置'));
s.anonymous = true;

var dvState = s.option(form.DummyValue, '_state', _('运行状态'));
dvState.cfgvalue = function (sid, data) {
	data = data || {};
	var running = data.running;
	if (running === true) return _('运行中');
	if (running === false) return _('Homebox服务未启动');
	return _('状态未知（无法读取服务状态）');
};

var o = s.option(form.Flag, 'enabled', _('启用'),
	_('勾选并点击“保存&应用”后，开机自启并启动 Homebox 服务；取消勾选并保存&应用，将停止并禁用服务。'));
o.default = '1';
o.rmempty = false;

var dvUrl = s.option(form.DummyValue, 'port', _('访问地址'));
dvUrl.cfgvalue = function () {
	var port = uci.get('homebox', 'main', 'port') || '3300';
	var host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
	return 'http://' + host + ':' + port + '/';
};

/* 保存&应用时，根据启用状态启停服务 */
var _apply = m.apply.bind(m);
m.apply = function () {
	var args = arguments;
	return _apply.apply(null, args).then(function (res) {
		return uci.get('homebox', 'main', 'enabled').then(function (v) {
			var en = (v === '1' || v === true || v === 1);
			return callRcInit('homebox', en ? 'enable' : 'disable')
				.then(function () { return callRcInit('homebox', 'restart'); })
				.then(function () { return res; });
		});
	}).catch(function (e) {
		try { ui.addNotification('error', _('保存应用后启停服务失败: %s').format(e)); } catch (e2) {}
	});
};

return m;
