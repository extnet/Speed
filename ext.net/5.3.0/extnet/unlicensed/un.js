Ext.onReady(function () {
    Ext.Function.defer(function () {
        var el = Ext.DomHelper.createDom({
            tag: "div",
            children: [{
                tag: "div",
                class: "ul-title-icon",
                children: [{
                    tag: "img",
                    width: 48,
                    height: 48,
                    src: Ext.net.ResourceMgr.resolveUrl("~/extnet/unlicensed/images/attention-png/ext.axd")
                }]
            }, {
                tag: "div",
                class: "ul-title",
                html: "UNLICENSED!"
            }, {
                tag: "hr",
                class: "ul-hr"
            }, {
                tag: "div",
                class: "ul-body",
                html: "Your copy of Ext.NET is unlicensed!<br />Ext.NET can be used without a license only on a local development environment."
            }, {
                tag: "a",
                class: "ul-btn",
                href: "https://ext.net/pricing/",
                target: "_blank",
                html: "PURCHASE LICENSE"
            }, {
                tag: "div",
                class: "ul-footer",
                html: "Free Minor Version Upgrades Included!"
            }]
        }, true);

        Ext.toast({
            contentEl: el,
            id: 'unlicensed',
            align: 'br',
            showDuration: 1000,
            hideDuration: 2000,
            autoCloseDelay: 20000
        });
    }, 500, window);
});
