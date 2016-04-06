// @source core/utils/DirectObservable.js

Ext.define('Ext.Configurator_override', {
    override: "Ext.Configurator",

    _initDirectEvents : function () {
        delete this._checkInitDirectEvents;
        if (this.directEvents) {
            
            if (!this.hasListeners) {// it might be for Plugins
                this.hasListeners = new this.HasListeners();
            }

            Ext.iterate(this.directEvents, function (name, e) {
                if (!Ext.isDefined(e.delay)) {
                    e.delay = 20;
                }

                if (e.delay <= 0) {
                    delete e.delay;
                }
                e.priority = -999;
            });
            this.addListener(this.directEvents);
            delete this.directEvents;
        }

        if (Ext.net && Ext.net.MessageBus) {
            Ext.net.MessageBus.initEvents(this);
        }
    },

    _addBusListener: function (ename, fn, scope, options, caller) {
        if (this._checkInitDirectEvents) {            
            Ext.Configurator.prototype._initDirectEvents.call(this);
        }

        var obj,
            name,
            config;

        if (typeof ename !== 'string') {
            obj = ename;
            for (name in obj) {
                config = obj[name];
                if (config.broadcastOnBus && !this.eventOptionsRe.test(name)) {
                    if (!config.fn) {
                        config.fn = this._generateBusFn(config);
                    }
                    else {
                        config.fn = Ext.Function.createSequence(config.fn, this._generateBusFn(config), config.scope || options.scope);
                    }

                    delete config.broadcastOnBus;
                }
            }

            return this._origAddListener(ename, fn, scope, options, caller);
        }
        else {
            if (options && options.broadcastOnBus)
            {
                if (!fn) {
                    fn = this._generateBusFn(options);
                }
                else {
                    fn = Ext.Function.createSequence(fn, this._generateBusFn(options), scope);
                }

                delete config.broadcastOnBus;
            }

            return this._origAddListener(ename, fn, scope, options, caller);
        }
    },

    _generateBusFn: function (options) {
        if (options && options.broadcastOnBus) {
            var parts = options.broadcastOnBus.split(":"),
                bus,
                name;

            if (parts.length == 1) {
                bus = Ext.net.Bus;
                name = parts[0];
            } else {
                bus = Ext.net.ResourceMgr.getCmp(parts[0]);
                name = parts[1];
            }

            fn = Ext.Function.bind(function () {
                var bus = arguments[arguments.length - 2],
                    name = arguments[arguments.length - 1],
                    options = arguments[arguments.length - 3],
                    data = arguments,
                    i,
                    len;

                if (!options.argumentsList) {
                    options = arguments[arguments.length - 4]
                }

                if (options && options.argumentsList) {
                    data = {};

                    for (i = 0, len = options.argumentsList.length; i < len; i++) {
                        data[options.argumentsList[i]] = arguments[i];
                    }
                }

                bus.publish(name, data);
            }, this, [bus, name], true);

            return fn;
        }
    }
});

Ext.Configurator.prototype.configure = Ext.Function.createInterceptor(Ext.Configurator.prototype.configure, function (instance, instanceConfig) {
    if (instance.isObservable && instance.addListener && !instance._generateBusFn) {
        instance._origAddListener = instance.addListener;
        
        if (!instance.eventOptionsRe) {
            instance.eventOptionsRe = /^(?:scope|delay|buffer|onFrame|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate|element|destroyable|vertical|horizontal|priority)$/;
        }
        instance.addListener = this._addBusListener;
        instance._generateBusFn = this._generateBusFn;
    }
});

Ext.Configurator.prototype.configure = Ext.Function.createSequence(Ext.Configurator.prototype.configure, function (instance, instanceConfig) {
    if (instance.isObservable) {
        this._initDirectEvents.call(instance);
    }
});

Ext.mixin.Observable.override({
    constructor: function (config) {
        var me = this;

        if (me.isObservable && me.addListener && !me._generateBusFn) {
            me._origAddListener = me.addListener;
            me.addListener = Ext.Configurator.prototype._addBusListener;
            me._generateBusFn = Ext.Configurator.prototype._generateBusFn;

            if (!me.eventOptionsRe) {
                me.eventOptionsRe = /^(?:scope|delay|buffer|onFrame|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate|element|destroyable|vertical|horizontal|priority)$/;
            }

            me._checkInitDirectEvents = true;            
        }

        this.callParent(arguments);
    }
});