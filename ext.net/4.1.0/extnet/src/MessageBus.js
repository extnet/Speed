//http://www.openajax.org/member/wiki/OpenAjax_Hub_2.0_Specification
//http://www.openajax.org/member/wiki/OpenAjax_Hub_2.0_Specification_Topic_Names

Ext.define("Ext.net.MessageBus", {    
    mixins: {
        observable: 'Ext.util.Observable'
    }, 
     
    statics: { 
        initEvents : function (owner) {                        
            if (owner.messageBusListeners) {                
                var busListeners = [];
                Ext.each(owner.messageBusListeners, function (listener) {
                    var bus = listener.bus ? Ext.net.ResourceMgr.getCmp(listener.bus) : Ext.net.Bus,
                        name = listener.name || "**";

                    if (owner instanceof Ext.net.MessageBus) {
                        bus = owner;
                    }

                    if (!bus) {
                        throw new Error("Bus is not found: " + listener.bus);
                    }

                    listener.scope = listener.scope || owner;

                    busListeners.push({name : name, fn : bus.subscribe(name, listener), bus: bus, scope: listener.scope});                    
                });

                if (owner.on && busListeners.length) {
                    owner.on("destroy", function () {
                        Ext.each(busListeners, function (item) {
                            item.bus.unsubscribe(item.name, item.fn, item.scope);
                        });
                    });
                }

                owner.messageBusListeners = null;
            }

            if (owner.messageBusDirectEvents) {
               var busDirectEvents = [];
                Ext.each(owner.messageBusDirectEvents, function (listener) {
                    var bus = listener.bus ? Ext.net.ResourceMgr.getCmp(listener.bus) : Ext.net.Bus,
                        name = listener.name || "**";

                    if (owner instanceof Ext.net.MessageBus) {
                        bus = owner;
                    }

                    if (!bus) {
                        throw new Error("Bus is not found: " + listener.bus);
                    }
                    listener.isDirect = true;                    
                    listener.scope = listener.scope || owner;
                    busDirectEvents.push({name : name, fn : bus.subscribe(name, listener), bus: bus, scope: listener.scope});
                });

                if (owner.on && busDirectEvents.length) {
                    owner.on("destroy", function () {
                        Ext.each(busDirectEvents, function (item) {
                            var _events = item.bus.events;
                            item.bus.events = item.bus.directListeners;
                            item.bus.unsubscribe(item.name, item.fn, item.scope);
                            item.bus.events = _events;
                        });
                    });
                }

                owner.messageBusDirectEvents = null;
            }
        }
    },   
    
    constructor : function (config) {
        var isDefault = !Ext.net.Bus;
        Ext.apply(this, config || {});

        if (this.defaultBus) {
            Ext.net.Bus = this;
        }

        Ext.net.ComponentManager.registerId(this);

                
        this.mixins.observable.constructor.call(this);        
    },

    destroy : function () {
        Ext.net.ComponentManager.unregisterId(this);   
    },
     
    messageFilter : function (name) {
        var tokens = name.split('.'),
            len = tokens.length,
            tokenRe = /^\w+$/,
            token,
            i;

        for (i = 0; i < len; i++) {
            token = tokens[i];

            if (!tokenRe.test(token) && token !== "*" && (token !== "**" || i !== (len - 1)) ) {
                throw new Error('Incorrect event name: ' + name);
            }

            if (token === "**") {
                tokens[i] = ".*";
            } else if (token === "*") {
                tokens[i] = "\\w+";
            }
        }

        return new RegExp("^" + tokens.join("\\.") + "$");
    }, 

    subscribe : function (name, fn, config) {        
        config = config || {};

        if (Ext.isObject(fn)) {
            config = fn;
        } else {
            config.fn = fn;
        }

        config.filter = this.messageFilter(name);
        config.name = name;
        var fn = Ext.bind(this.onMessage, this);

        if (config.isDirect) {
            if (!Ext.isDefined(config.delay)) {
                config.delay = 20;
            }

            if (config.delay <= 0) {
                delete config.delay;
            }
            config.priority = -999;
        }

        this.on("message", fn, config.scope || this, config);
        return fn;
    },

    unsubscribe : function (name, fn, scope) {
        this.un("message", fn, scope || this);
    },

    publish : function (name, data, /*private*/target, /*private*/fromParent) {
        //!!! do not replace == by ===
        if (target == this) {
            return;
        }
        
        this.fireEvent("message", name, data);

        if (!target) {
            target = this;
        }
        
        //!!! do not replace != by !===
        if (parent != window && fromParent !== true) {
            this.publishToFrame(parent, name, data, target);            
        }

        var frames = window.frames,
            i;
        for (i = 0; i < frames.length; i++) {   
            this.publishToFrame(frames[i], name, data, target, true);            
        }  
    },

    publishToFrame : function (frame, name, data, target, fromParent) {
        var bus;

        try {
           if (this.defaultBus && frame.Ext && frame.Ext.net && frame.Ext.net.Bus) {
               bus = frame.Ext.net.Bus;        
           }
           else if (frame.Ext && frame.Ext.net && frame.Ext.net.ResourceMgr) {
               bus = frame.Ext.net.ResourceMgr.getCmp(this.nsId);
           }   

           if (bus) {
               bus.publish(name, data, target, fromParent);
           }
        }
        catch (e) {
        }        
    },

    onMessage : function (name, data, config) {
        if (config.filter.test(name)) {
            (config.fn || Ext.emptyFn).call(config.scope || this, name, data, config);
        }
    }
}, function () {
   //create default message bus
   Ext.net.Bus = Ext.create("Ext.net.MessageBus"); 
   Ext.net.Bus.defaultBus = true;
});