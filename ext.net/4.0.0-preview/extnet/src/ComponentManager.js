
// @source core/ComponentMgr.js

Ext.net.ComponentManager = {
    registerId : function (cmp) {
        if (cmp.initialConfig || cmp.isStore || cmp.proxyId) {
            var cfg = cmp.initialConfig || {},
                id = cmp.isStore ? cmp.storeId : (cmp.proxyId || cfg.proxyId || cfg.id),
                ns = cmp.ns || (Ext.isArray(Ext.net.ResourceMgr.ns) ? Ext.net.ResourceMgr.ns[0] : Ext.net.ResourceMgr.ns),
                hasId = (!Ext.isEmpty(id, false) && id.indexOf("-") === -1);
            
            if (cmp.forbidIdScoping !== true && ( hasId || (cmp.ns && !Ext.isEmpty(cmp.itemId, false)) ) ) {
                if (ns) {                    
                    (Ext.isObject(ns) ? ns : Ext.ns(ns))[hasId ? id : cfg.itemId] = cmp;
                    cmp.nsId = (Ext.isObject(ns) ? "" : (ns + ".")) + (hasId ? id : cfg.itemId);
                } else {
                    window[id] = cmp;
                    cmp.nsId = id;
                }
            }
        }
    },
    
    unregisterId : function (cmp) {        
        if (cmp.forbidIdScoping !== true) {
            var cfg = cmp.initialConfig || {},
                ns = cmp.ns || (Ext.isArray(Ext.net.ResourceMgr.ns) ? Ext.net.ResourceMgr.ns[0] : Ext.net.ResourceMgr.ns),
                id = cmp.proxyId || cmp.storeId || cmp.id,
                hasId = (!Ext.isEmpty(id, false) && id.indexOf("-") === -1),
                nsObj;

            if(!hasId && cfg.ns && cmp.itemId) {
                id = cmp.itemId;
            }
            
            if (ns && id) {                
                if (Ext.isObject(ns) && ns[id]) {
                    try {
                        delete ns[id];
                    } catch (e) {
                        ns[id] = undefined;
                    }
                } else if (Ext.net.ResourceMgr.getCmp(ns + "." + id)) {
                    try {
                        delete Ext.ns(ns)[id];
                    } catch (e) {
                        Ext.ns(ns)[id] = undefined;
                    }
                }
            } 
            else if (window[cmp.proxyId || cmp.storeId || cmp.id]) {
                window[cmp.proxyId || cmp.storeId || cmp.id] = null;
            }

            delete cmp.nsId;
        }
    }
};

Ext.ComponentManager.unregister = Ext.Function.createSequence(Ext.ComponentManager.unregister, function (component) {    
    Ext.net.ComponentManager.unregisterId(component);   
});

Ext.data.StoreManager.register = Ext.Function.createSequence(Ext.data.StoreManager.register, function () {    
    for (var i = 0, s; (s = arguments[i]); i++) {
        Ext.net.ComponentManager.registerId(s);
    }    
});

Ext.data.StoreManager.unregister = Ext.Function.createSequence(Ext.data.StoreManager.unregister, function () {    
    for (var i = 0, s; (s = arguments[i]); i++) {
        Ext.net.ComponentManager.unregisterId(s);
    }    
});

(function (fn) {
    Ext.PluginManager.create = function () {
        var p = fn.apply(Ext.PluginManager, arguments);

        Ext.net.ComponentManager.registerId(p);

        if (Ext.isFunction(p.on)) {
            p.on("destroy", function () {
                Ext.net.ComponentManager.unregisterId(this);
            });
        }

        return p;
    };
})(Ext.PluginManager.create);