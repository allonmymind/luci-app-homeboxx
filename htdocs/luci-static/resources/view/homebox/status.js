
'use strict';
'require view';
'require ui';

return view.extend({
    render: function () {
        var url = 'http://' + window.location.hostname + ':3300/';

        return E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('Homebox 内网测速')),

            E('div', { 'class': 'cbi-section' }, [
                E('p', {}, _(
                    'Homebox provides a browser-based LAN speed test.'
                )),

                E('p', {}, [
                    _('Speed test address: '),
                    E('a', {
                        'href': url,
                        'target': '_blank',
                        'rel': 'noopener noreferrer'
                    }, [ url ])
                ]),

                E('div', { 'class': 'right' }, [
                    E('a', {
                        'class': 'btn cbi-button cbi-button-action',
                        'href': url,
                        'target': '_blank',
                        'rel': 'noopener noreferrer'
                    }, [ _('打开测速页面') ])
                ])
            ]),

            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('服务管理')),
                E('p', {}, _(
                    'The Homebox service is managed by procd. ' +
                    'Use the router terminal to start, stop or restart it.'
                )),
                E('pre', {}, [
                    '/etc/init.d/homebox enable\n',
                    '/etc/init.d/homebox start\n',
                    '/etc/init.d/homebox status'
                ])
            ])
        ]);
    }
});
