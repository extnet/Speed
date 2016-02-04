Ext.ns("Ext.net", "Ext.ux", "Ext.ux.plugins", "Ext.ux.layout");
Ext.net.Version = "4.0.0-preview";

Ext.validIdRe = /^[a-z_][a-z0-9\-_\.]*$/i;
Ext.dom.Element.prototype.validIdRe = Ext.validIdRe;
Ext.mixin.Observable.prototype.validIdRe = Ext.validIdRe;
Ext.Component.prototype.validIdRe = Ext.validIdRe;
Ext.form.trigger.Trigger.prototype.validIdRe = Ext.validIdRe;

if (Ext.os.deviceType == "Desktop" && Ext.isIE) { // #624
    Ext.define('EXTJS-13775', {
        override: 'Ext.dom.Element'
    }, function (Element) {
        var eventMap = Element.prototype.eventMap;

        eventMap.click = 'click';
        eventMap.dblclick = 'dblclick';
    });
}

Ext.net.reconfigure = function (inst, initConfig, config) {
    var property,
        defaults = {},
        apply = false;

    if (initConfig) {
        for (property in config) {
            if (config.hasOwnProperty(property)) {
                if (typeof initConfig[property] === 'undefined') {
                    defaults[property] = config[property];
                    apply = true;
                }
            }
        }
    } else {
        defaults = config;
        apply = true;
    }

    if (apply) {
        inst.getConfigurator().reconfigure(inst, defaults);
    }
};

// #496
Ext.Array.each(Ext.feature.tests, function(test) {
    if (test.name === "RightMargin") {
        test.fn = function(doc, div) {
            var view = doc.defaultView;

            if (Ext.isGecko) {
                return true;
            } else {
                return !(view && view.getComputedStyle(div.firstChild.firstChild, null).marginRight != '0px');
            }

            return true;

        }
    }

    if (test.name === "TransparentColor") {
        test.fn = function(doc, div) {
            var view = doc.defaultView;

            if (Ext.isGecko) {
                return true;
            } else {
                return !(view && view.getComputedStyle(div.lastChild, null).backgroundColor != 'transparent');
            }

            return true;
        }
    }
});