
// @source core/utils/TaskManager.js

Ext.net.TaskResponse = {
    stopTask: -1,
    stopAjax: -2
};

Ext.define("Ext.net.TaskManager", {
    extend: "Ext.util.Observable",

    constructor: function (config) {
        this.callParent(arguments);
        this.initManager();
    },

    getTasks: function () {
        return this.tasks;
    },

    initManager: function () {
        this.runner = new Ext.util.TaskRunner(this.interval || 10);

        var task;
        this.tasks = [];
        this.tasksConfig = this.tasksConfig || [];

        for (var i = 0; i < this.tasksConfig.length; i++) {
            task = this.createTask(this.tasksConfig[i]);
            this.tasks.push(task);

            if (task.autoRun) {
                Ext.Function.defer(this.startTask, this.autoRunDelay || 50, this, [task]);
            }
        }
    },

    addTask: function (taskConfig) {
        var task = this.createTask(taskConfig);
        this.tasks.push(task);

        if (task.autoRun) {
            this.startTask(task);
        }
    },

    removeTask: function (task) {
        task = this.getTask(task);
        if (!Ext.isEmpty(task)) {
            this.stopTask(task);
            Ext.Array.remove(this.tasks, task);
        }
    },

    getTask: function (id) {
        if (typeof id == "object") {
            return id;
        } else if (typeof id == "string") {
            for (var i = 0; this.tasks.length; i++) {
                if (this.tasks[i].id == id) {
                    return this.tasks[i];
                }
            }
        } else if (typeof id == "number") {
            return this.tasks[id];
        }
        return null;
    },

    startTask: function (task) {
        task = this.getTask(task);
        task.executing = true;

        if (task.onstart) {
            task.onstart.apply(task.scope || task);
        }

        this.runner.start(task);
    },

    stopTask: function (task) {
        this.runner.stop(this.getTask(task));
    },

    startAll: function () {
        for (var i = 0; i < this.tasks.length; i++) {
            this.startTask(this.tasks[i]);
        }
    },

    stopAll: function () {
        this.runner.stopAll();
    },

    //private
    createTask: function (config) {
        return Ext.apply({}, config, {
            owner: this,
            executing: false,
            interval: 1000,
            autoRun: true,
            waitPreviousRequest: false,

            onStop: function (t) {
                this.executing = false;

                if (this.onstop) {
                    this.onstop();
                }
                if (this._ts && this.owner.destroying) {
                    Ext.net.DirectEvent.abort(this._ts);
                }
            },

            onRemoteComplete: function () {
                delete this._ts;
                if (this.runOnComplete && this.executing) {
                    this.runOnComplete = false;
                    this.run();
                }

                if (!this.executing) {
                    this.runOnComplete = false;
                }
            },

            run: function () {
                if (!this.executing) {
                    return;
                }

                if (this.clientRun) {
                    var rt = this.clientRun.apply(arguments);

                    if (rt === Ext.net.TaskResponse.stopAjax) {
                        return;
                    } else if (rt === Ext.net.TaskResponse.stopTask) {
                        return false;
                    }
                }

                if (this.waitPreviousRequest && this._ts) {
                    this.runOnComplete = true;
                    return;
                }

                if (this.serverRun) {
                    var o = this.serverRun();
                    if (!o.alreadySetComplete) {
                        if (o.userComplete && Ext.isFunction(o.userComplete)) {
                            o.userComplete = Ext.Function.createSequence(o.userComplete, Ext.Function.bind(this.onRemoteComplete, this), this);
                        }
                        else {
                            o.userComplete = Ext.Function.bind(this.onRemoteComplete, this);
                        }
                        o.alreadySetComplete = true;
                    }
                    o.control = this.owner;
                    this._ts = Ext.net.DirectEvent.request(o);
                }
            }
        });
    },

    setTaskInterval: function (taskId, newInterval) {
        var task = this.getTask(taskId),
            restart = false;

        if (task.executing) {
            this.stopTask(task);
            restart = true;
        }

        task.interval = newInterval;

        if (restart) {
            this.startTask(task);
        }
    },

    destroy: function () {
        this.destroying = true;
        this.stopAll();
        Ext.net.ComponentManager.unregisterId(this);
        delete this.tasks;
        delete this.runner;
    }
});