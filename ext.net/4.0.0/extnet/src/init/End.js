
// @source core/init/End.js

(function () {
    var buf = [];

    if (!Ext.isIE6) {
        buf.push(".x-label-icon{width:16px;height:16px;margin-left:3px;margin-right:3px;vertical-align:middle;border:0px !important;}");
    }

    if (Ext.isIE8) {
        buf.push(".x-item-disabled span.x-btn-icon-el { filter: alpha(opacity=50); }");
    }
    
    buf.push("input.x-tree-node-cb{margin-left:1px;height:18px;vertical-align:bottom;}.x-tree-node .x-tree-node-inline-icon{background:transparent;height:16px !important;}");
    buf.push(".x-toolbar-flat{padding:0px !important;border:0px !important;background:none !important;background-color: transparent !important; background-image: none !important;}");
	buf.push(".x-grid-row-checker-on{background-position:-25px 0 !important;}");
	buf.push(".x-grid-header-widgets{border-top-width:0px;} .x-grid-header-widgets .x-form-item{margin-bottom:1px;} .x-border-box .x-ie9 .x-grid-header-ct{padding-left:0px;}");

    if (Ext.platformTags.ios) { // #117
        buf.push(".ios-iframe-scroll-fix { -webkit-overflow-scrolling: touch; overflow-y: scroll; }");
    }

	Ext.net.ResourceMgr.registerCssClass("Ext.Net.CSS", buf.join(""));
})();