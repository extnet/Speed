
Ext.define('Ext.ux.form.MultiSelect', {

    extend: 'Ext.form.FieldContainer',

    mixins: [
        'Ext.util.StoreHolder',
        'Ext.form.field.Field'
    ],

    alternateClassName: 'Ext.ux.Multiselect',
    alias: ['widget.multiselectfield', 'widget.multiselect'],

    requires: ['Ext.panel.Panel', 'Ext.view.BoundList', 'Ext.layout.container.Fit'],

    uses: ['Ext.view.DragZone', 'Ext.view.DropZone'],

    layout: 'anchor',

    

    

    

    
    ddReorder: false,

    

    
    appendOnly: false,

    
    displayField: 'text',

    

    
    allowBlank: true,

    
    minSelections: 0,

    
    maxSelections: Number.MAX_VALUE,

    
    blankText: 'This field is required',

    
    minSelectionsText: 'Minimum {0} item(s) required',

    
    maxSelectionsText: 'Maximum {0} item(s) required',

    
    delimiter: ',',

    
    dragText: '{0} Item{1}',

    

    ignoreSelectChange: 0,

    

    
    pageSize: 10,

    initComponent: function(){
        var me = this;

        me.items = me.setupItems();

        me.bindStore(me.store, true);

        me.callParent();
        me.initField();
    },

    setupItems: function() {
        var me = this;

        me.boundList = new Ext.view.BoundList(Ext.apply({
            anchor: 'none 100%',
            border: 1,
            multiSelect: true,
            store: me.store,
            displayField: me.displayField,
            disabled: me.disabled,
            tabIndex: 0,
            navigationModel: {
                type: 'default'
            }
        }, me.listConfig));

        me.boundList.getNavigationModel().addKeyBindings({
            pageUp: me.onKeyPageUp,
            pageDown: me.onKeyPageDown,
            scope: me
        });

        me.boundList.getSelectionModel().on('selectionchange', me.onSelectChange, me);

        // Boundlist expects a reference to its pickerField for when an item is selected (see Boundlist#onItemClick).
        me.boundList.pickerField = me;

        // Only need to wrap the BoundList in a Panel if we have a title.
        if (!me.title) {
            return me.boundList;
        }

        // Wrap to add a title
        me.boundList.border = false;

        return {
            xtype: 'panel',
            isAriaRegion: false,
            border: true,
            anchor: 'none 100%',
            layout: 'anchor',
            title: me.title,
            tbar: me.tbar,
            items: me.boundList
        };
    },

    onSelectChange: function(selModel, selections){
        if (!this.ignoreSelectChange) {
            this.setValue(selections);
        }
    },

    getSelected: function(){
        return this.boundList.getSelectionModel().getSelection();
    },

    // compare array values
    isEqual: function(v1, v2) {
        var fromArray = Ext.Array.from,
            i = 0,
            len;

        v1 = fromArray(v1);
        v2 = fromArray(v2);
        len = v1.length;

        if (len !== v2.length) {
            return false;
        }

        for(; i < len; i++) {
            if (v2[i] !== v1[i]) {
                return false;
            }
        }

        return true;
    },

    afterRender: function(){
        var me = this,
            boundList, scrollable, records, panel;

        me.callParent();

        boundList = me.boundList;
        scrollable = boundList && boundList.getScrollable();

        if (me.selectOnRender) {
            records = me.getRecordsForValue(me.value);
            if (records.length) {
                ++me.ignoreSelectChange;
                boundList.getSelectionModel().select(records);
                --me.ignoreSelectChange;
            }
            delete me.toSelect;
        }

        if (me.ddReorder && !me.dragGroup && !me.dropGroup){
            me.dragGroup = me.dropGroup = 'MultiselectDD-' + Ext.id();
        }

        if (me.draggable || me.dragGroup){
            me.dragZone = Ext.create('Ext.view.DragZone', {
                view: boundList,
                ddGroup: me.dragGroup,
                dragText: me.dragText,
                containerScroll: !!scrollable,
                scrollEl: scrollable && scrollable.getElement()
            });
        }
        if (me.droppable || me.dropGroup){
            me.dropZone = Ext.create('Ext.view.DropZone', {
                view: boundList,
                ddGroup: me.dropGroup,
                handleNodeDrop: function(data, dropRecord, position) {
                    var view = this.view,
                        store = view.getStore(),
                        records = data.records,
                        index;

                    // remove the Models from the source Store
                    data.view.store.remove(records);

                    index = store.indexOf(dropRecord);
                    if (position === 'after') {
                        index++;
                    }
                    store.insert(index, records);
                    view.getSelectionModel().select(records);
                    me.fireEvent('drop', me, records);
                }
            });
        }

        panel = me.down('panel');

        if (panel && boundList) {
            boundList.ariaEl.dom.setAttribute('aria-labelledby', panel.header.id + '-title-textEl');
        }
    },

    onKeyPageUp: function(e) {
        var me = this,
            pageSize = me.pageSize,
            boundList = me.boundList,
            nm = boundList.getNavigationModel(),
            oldIdx, newIdx;

        oldIdx = nm.recordIndex;

        // Unlike up arrow, pgUp does not wrap but goes to the first item
        newIdx = oldIdx > pageSize ? oldIdx - pageSize : 0;

        nm.setPosition(newIdx, e);
    },

    onKeyPageDown: function(e) {
        var me = this,
            pageSize = me.pageSize,
            boundList = me.boundList,
            nm = boundList.getNavigationModel(),
            count, oldIdx, newIdx;

        count = boundList.getStore().getCount();
        oldIdx = nm.recordIndex;

        // Unlike down arrow, pgDown does not wrap but goes to the last item
        newIdx = oldIdx < (count - pageSize) ? oldIdx + pageSize : count - 1;

        nm.setPosition(newIdx, e);
    },

    isValid : function() {
        var me = this,
            disabled = me.disabled,
            validate = me.forceValidation || !disabled;


        return validate ? me.validateValue(me.value) : disabled;
    },

    validateValue: function(value) {
        var me = this,
            errors = me.getErrors(value),
            isValid = Ext.isEmpty(errors);

        if (!me.preventMark) {
            if (isValid) {
                me.clearInvalid();
            } else {
                me.markInvalid(errors);
            }
        }

        return isValid;
    },

    markInvalid : function(errors) {
        // Save the message and fire the 'invalid' event
        var me = this,
            oldMsg = me.getActiveError();
        me.setActiveErrors(Ext.Array.from(errors));
        if (oldMsg !== me.getActiveError()) {
            me.updateLayout();
        }
    },

    
    clearInvalid : function() {
        // Clear the message and fire the 'valid' event
        var me = this,
            hadError = me.hasActiveError();
        me.unsetActiveError();
        if (hadError) {
            me.updateLayout();
        }
    },

    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            }
        }
        return data;
    },

    
    getSubmitValue: function() {
        var me = this,
            delimiter = me.delimiter,
            val = me.getValue();

        return Ext.isString(delimiter) ? val.join(delimiter) : val;
    },

    getValue: function(){
        return this.value || [];
    },

    getRecordsForValue: function(value){
        var me = this,
            records = [],
            all = me.store.getRange(),
            valueField = me.valueField,
            i = 0,
            allLen = all.length,
            rec,
            j,
            valueLen;

        for (valueLen = value.length; i < valueLen; ++i) {
            for (j = 0; j < allLen; ++j) {
                rec = all[j];
                if (rec.get(valueField) == value[i]) {
                    records.push(rec);
                }
            }
        }

        return records;
    },

    setupValue: function(value){
        var delimiter = this.delimiter,
            valueField = this.valueField,
            i = 0,
            out,
            len,
            item;

        if (Ext.isDefined(value)) {
            if (delimiter && Ext.isString(value)) {
                value = value.split(delimiter);
            } else if (!Ext.isArray(value)) {
                value = [value];
            }

            for (len = value.length; i < len; ++i) {
                item = value[i];
                if (item && item.isModel) {
                    value[i] = item.get(valueField);
                }
            }
            out = Ext.Array.unique(value);
        } else {
            out = [];
        }
        return out;
    },

    setValue: function(value){
        var me = this,
            selModel = me.boundList.getSelectionModel(),
            store = me.store;

        // Store not loaded yet - we cannot set the value
        if (!store.getCount()) {
            store.on({
                load: Ext.Function.bind(me.setValue, me, [value]),
                single: true
            });
            return;
        }

        value = me.setupValue(value);
        me.mixins.field.setValue.call(me, value);

        if (me.rendered) {
            ++me.ignoreSelectChange;
            selModel.deselectAll();
            if (value.length) {
                selModel.select(me.getRecordsForValue(value));
            }
            --me.ignoreSelectChange;
        } else {
            me.selectOnRender = true;
        }
    },

    clearValue: function(){
        this.setValue([]);
    },

    onEnable: function(){
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.enable();
        }
    },

    onDisable: function(){
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.disable();
        }
    },

    getErrors : function(value) {
        var me = this,
            format = Ext.String.format,
            errors = [],
            numSelected;

        value = Ext.Array.from(value || me.getValue());
        numSelected = value.length;

        if (!me.allowBlank && numSelected < 1) {
            errors.push(me.blankText);
        }
        if (numSelected < me.minSelections) {
            errors.push(format(me.minSelectionsText, me.minSelections));
        }
        if (numSelected > me.maxSelections) {
            errors.push(format(me.maxSelectionsText, me.maxSelections));
        }
        return errors;
    },

    doDestroy: function(){
        var me = this;

        me.bindStore(null);
        Ext.destroy(me.dragZone, me.dropZone, me.keyNav);
        me.callParent();
    },

    onBindStore: function(store){
        var me = this,
            boundList = this.boundList;

        if (store.autoCreated) {
            me.resolveDisplayField();
        }

        if (!Ext.isDefined(me.valueField)) {
            me.valueField = me.displayField;
        }

        if (boundList) {
            boundList.bindStore(store);
        }
    },

    
    resolveDisplayField: function() {
        var me = this,
            boundList = me.boundList,
            store = me.getStore();

        me.valueField = me.displayField = 'field1';

        if (!store.expanded) {
            me.displayField = 'field2';
        }

        if (boundList) {
            boundList.setDisplayField(me.displayField);
        }
    }
});




Ext.define('Ext.ux.form.ItemSelector', {
    extend: 'Ext.ux.form.MultiSelect',
    alias: ['widget.itemselectorfield', 'widget.itemselector'],
    alternateClassName: ['Ext.ux.ItemSelector'],
    requires: [
        'Ext.button.Button',
        'Ext.ux.form.MultiSelect'
    ],

    
    hideNavIcons:false,

    
    buttons: ['top', 'up', 'add', 'remove', 'down', 'bottom'],

    
    buttonsText: {
        top: "Move to Top",
        up: "Move Up",
        add: "Add to Selected",
        remove: "Remove from Selected",
        down: "Move Down",
        bottom: "Move to Bottom"
    },

    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    ariaRole: 'group',

    initComponent: function() {
        var me = this;

        me.ddGroup = me.id + '-dd';
        me.ariaRenderAttributes = me.ariaRenderAttributes || {};
        me.ariaRenderAttributes['aria-labelledby'] = me.id + '-labelEl';

        me.callParent();

        // bindStore must be called after the fromField has been created because
        // it copies records from our configured Store into the fromField's Store
        me.bindStore(me.store);
    },

    createList: function(title){
        var me = this;

        return Ext.create('Ext.ux.form.MultiSelect', {
            // We don't want the multiselects themselves to act like fields,
            // so override these methods to prevent them from including
            // any of their values
            submitValue: false,
            getSubmitData: function(){
                return null;
            },
            getModelData: function(){
                return null;
            },
            flex: 1,
            dragGroup: me.ddGroup,
            dropGroup: me.ddGroup,
            title: title,
            store: {
                model: me.store.model,
                data: []
            },
            displayField: me.displayField,
            valueField: me.valueField,
            disabled: me.disabled,
            listeners: {
                boundList: {
                    scope: me,
                    itemdblclick: me.onItemDblClick,
                    drop: me.syncValue
                }
            }
        });
    },

    setupItems: function() {
        var me = this;

        me.fromField = me.createList(me.fromTitle);
        me.toField = me.createList(me.toTitle);

        return [
            me.fromField,
            {
                xtype: 'toolbar',
                margin: '0 4',
                padding: 0,
                layout: {
                    type: 'vbox',
                    pack: 'center'
                },
                items: me.createButtons()
            },
            me.toField
        ];
    },

    createButtons: function() {
        var me = this,
            buttons = [];

        if (!me.hideNavIcons) {
            Ext.Array.forEach(me.buttons, function(name) {
                buttons.push({
                    xtype: 'button',
                    ui: 'default',
                    tooltip: me.buttonsText[name],
                    ariaLabel: me.buttonsText[name],
                    handler: me['on' + Ext.String.capitalize(name) + 'BtnClick'],
                    cls: Ext.baseCSSPrefix + 'form-itemselector-btn',
                    iconCls: Ext.baseCSSPrefix + 'form-itemselector-' + name,
                    navBtn: true,
                    scope: me,
                    margin: '4 0 0 0'
                });
            });
        }
        return buttons;
    },

    
    getSelections: function(list) {
        var store = list.getStore();

        return Ext.Array.sort(list.getSelectionModel().getSelection(), function(a, b) {
            a = store.indexOf(a);
            b = store.indexOf(b);

            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });
    },

    onTopBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list);

        store.suspendEvents();
        store.remove(selected, true);
        store.insert(0, selected);
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },

    onBottomBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list);

        store.suspendEvents();
        store.remove(selected, true);
        store.add(selected);
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },

    onUpBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list),
            rec,
            i = 0,
            len = selected.length,
            index = 0;

        // Move each selection up by one place if possible
        store.suspendEvents();
        for (; i < len; ++i, index++) {
            rec = selected[i];
            index = Math.max(index, store.indexOf(rec) - 1);
            store.remove(rec, true);
            store.insert(index, rec);
        }
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },

    onDownBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list),
            rec,
            i = selected.length - 1,
            index = store.getCount() - 1;

        // Move each selection down by one place if possible
        store.suspendEvents();
        for (; i > -1; --i, index--) {
            rec = selected[i];
            index = Math.min(index, store.indexOf(rec) + 1);
            store.remove(rec, true);
            store.insert(index, rec);
        }
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },

    onAddBtnClick : function() {
        var me = this,
            selected = me.getSelections(me.fromField.boundList);

        me.moveRec(true, selected);
        me.toField.boundList.getSelectionModel().select(selected);
    },

    onRemoveBtnClick : function() {
        var me = this,
            selected = me.getSelections(me.toField.boundList);

        me.moveRec(false, selected);
        me.fromField.boundList.getSelectionModel().select(selected);
    },

    moveRec: function(add, recs) {
        var me = this,
            fromField = me.fromField,
            toField   = me.toField,
            fromStore = add ? fromField.store : toField.store,
            toStore   = add ? toField.store   : fromField.store;

        fromStore.suspendEvents();
        toStore.suspendEvents();
        fromStore.remove(recs);
        toStore.add(recs);
        fromStore.resumeEvents();
        toStore.resumeEvents();

        // If the list item was focused when moved (e.g. via double-click)
        // then removing it will cause the focus to be thrown back to the
        // document body. Which might disrupt things if ItemSelector is
        // contained by a floating thingie like a Menu.
        // Focusing the list itself will prevent that.
        if (fromField.boundList.containsFocus) {
            fromField.boundList.focus();
        }

        fromField.boundList.refresh();
        toField.boundList.refresh();

        me.syncValue();
    },

    // Synchronizes the submit value with the current state of the toStore
    syncValue: function() {
        var me = this;
        me.mixins.field.setValue.call(me, me.setupValue(me.toField.store.getRange()));
    },

    onItemDblClick: function(view, rec) {
        this.moveRec(view === this.fromField.boundList, rec);
    },

    setValue: function(value) {
        var me = this,
            fromField = me.fromField,
            toField = me.toField,
            fromStore = fromField.store,
            toStore = toField.store,
            selected;

        // Wait for from store to be loaded
        if (!me.fromStorePopulated) {
            me.fromField.store.on({
                load: Ext.Function.bind(me.setValue, me, [value]),
                single: true
            });
            return;
        }

        value = me.setupValue(value);
        me.mixins.field.setValue.call(me, value);

        selected = me.getRecordsForValue(value);

        // Clear both left and right Stores.
        // Both stores must not fire events during this process.
        fromStore.suspendEvents();
        toStore.suspendEvents();
        fromStore.removeAll();
        toStore.removeAll();

        // Reset fromStore
        me.populateFromStore(me.store);

        // Copy selection across to toStore
        Ext.Array.forEach(selected, function(rec){
            // In the from store, move it over
            if (fromStore.indexOf(rec) > -1) {
                fromStore.remove(rec);
            }
            toStore.add(rec);
        });

        // Stores may now fire events
        fromStore.resumeEvents();
        toStore.resumeEvents();

        // Refresh both sides and then update the app layout
        Ext.suspendLayouts();
        fromField.boundList.refresh();
        toField.boundList.refresh();
        Ext.resumeLayouts(true);
    },

    onBindStore: function(store, initial) {
        var me = this,
            fromField = me.fromField,
            toField = me.toField;

        if (fromField) {
            fromField.store.removeAll();
            toField.store.removeAll();

            if (store.autoCreated) {
                fromField.resolveDisplayField();
                toField.resolveDisplayField();
                me.resolveDisplayField();
            }

            if (!Ext.isDefined(me.valueField)) {
                me.valueField = me.displayField;
            }

            // Add everything to the from field as soon as the Store is loaded
            if (store.getCount()) {
                me.populateFromStore(store);
            } else {
                me.store.on('load', me.populateFromStore, me);
            }
        }
    },

    populateFromStore: function(store) {
        var fromStore = this.fromField.store;

        // Flag set when the fromStore has been loaded
        this.fromStorePopulated = true;

        fromStore.add(store.getRange());

        // setValue waits for the from Store to be loaded
        fromStore.fireEvent('load', fromStore);
    },

    onEnable: function(){
        var me = this;

        me.callParent();
        me.fromField.enable();
        me.toField.enable();

        Ext.Array.forEach(me.query('[navBtn]'), function(btn){
            btn.enable();
        });
    },

    onDisable: function(){
        var me = this;

        me.callParent();
        me.fromField.disable();
        me.toField.disable();

        Ext.Array.forEach(me.query('[navBtn]'), function(btn){
            btn.disable();
        });
    },

    doDestroy: function(){
        this.bindStore(null);
        this.callParent();
    }
});

// @source multiselect/overrides/MultiSelect.js
Ext.define('Ext.ux.form.MultiSelect', {
    override: 'Ext.ux.form.MultiSelect',

    multiSelect: false,
    showCheckbox: false,
    simpleSelect: true,
    simpleSubmit: false,
    singleSelect: false,
    useHiddenField: true,

    afterLayout: function () {
        this.callParent(arguments);

        if (this.labelAlign == "top" && this.boundList) {
            Ext.suspendLayouts();
            var td = this.boundList.el.parent();
            this.boundList.el.setHeight(td.getHeight() - td.getBorderWidth("tb") - td.getPadding("tb"));
            Ext.resumeLayouts();
        }
    },

    findRecord: function (field, value) {
        var ds = this.store,
            idx = ds.findExact(field, value);
        return idx !== -1 ? ds.getAt(idx) : false;
    },
    findRecordByDisplay: function (value) {
        return this.findRecord(this.displayField, value);
    },
    findRecordByValue: function (value) {
        return this.findRecord(this.valueField, value);
    },

    getHiddenState: function (value) {
        if (this.simpleSubmit) {
            return this.getValue();
        }

        var state = this.getSubmitArray();

        return state.length > 0 ? Ext.encode(state) : "";
    },

    getHiddenStateName: function () {
        return this.getName();
    },

    getSubmitArray: function () {
        if (!this.isItemsReady()) {
            return [];
        }

        var state = [],
            valueModels = this.getRecordsForValue(this.getValue());

        if (!valueModels || valueModels.length == 0) {
            return state;
        }

        Ext.each(valueModels, function (model) {
            state.push({
                value: model.get(this.valueField),
                text: model.get(this.displayField),
                index: this.store.indexOf(model)
            });
        }, this);

        return state;
    },

    getValues: function (full) {
        var records = this.store.getRange() || [],
            record,
            values = [];

        for (var i = 0; i < records.length; i++) {
            record = records[i];
            values.push(full ? {
                value: record.get(this.valueField),
                text: record.get(this.displayField),
                index: i
            } : { value: record.get(this.valueField) });
        }

        return values;
    },

    initComponent: function () {
        var me = this,
            retVal = me.callParent(arguments);

        if (Ext.net.ResourceMgr.isMVC) {
            me.includeHiddenStateToSubmitData = !me.simpleSubmit;
        }
    },

    isItemsReady: function () {
        return !!this.boundList;
    },

    setInitValue: function (value) {
        if (this.store.getCount() > 0) {
            this.setSelectedItems(value);
        } else {
            this.store.on("load", Ext.Function.bind(this.setSelectedItems, this, [value]), this, { single: true });
        }
    },

    setSelectedItems: function (items) {
        if (items) {
            items = Ext.Array.from(items);

            if (!this.rendered) {
                this.selectedItems = items;
                return;
            }

            var rec,
                values = [];

            Ext.each(items, function (item) {
                if (Ext.isDefined(item.value)) {
                    rec = this.findRecordByValue(item.value);
                    if (rec) {
                        values.push(rec);
                    }
                }
                else if (Ext.isDefined(item.text)) {
                    rec = this.findRecordByDisplay(item.text);
                    if (rec) {
                        values.push(rec);
                    }
                }
                else if (Ext.isDefined(item.index)) {
                    rec = this.store.getAt(item.index);
                    if (rec) {
                        values.push(rec);
                    }
                }
            }, this);

            this.setValue(values);
        }
    },

    setupItems: function () {
        var me = this,
            config = {
                multiSelect: this.multiSelect,
                singleSelect: this.singleSelect,
                simpleSelect: (this.multiSelect || this.singleSelect) ? false :
                    this.simpleSelect
            };

        if (me.showCheckbox) {
            config.cls = "x-multiselect-with-checkbox";

            if (me.listConfig && me.listConfig.cls) {
                config.cls += " " + me.listConfig.cls;
                delete me.listConfig.cls;
            }
        }

        if (!me.listConfig) {
            me.listConfig = {};
        }

        me.listConfig = Ext.apply(me.listConfig, config);

        return Ext.apply(me.callParent(arguments), { border: this.border });
    }
});

// @source multiselect/overrides/ItemSelector.js
Ext.define('Ext.ux.form.ItemSelector', {
    override: 'Ext.ux.form.ItemSelector',

    getSelected: function () {
        return this.getSelections(this.toField.boundList);
    },

    isItemsReady: function () {
        return !!this.fromField;
    }
});
