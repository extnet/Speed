/**
 * A control that allows selection of multiple items in a list.
 */
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

    /**
     * @cfg {String} [dragGroup=""] The ddgroup name for the MultiSelect DragZone.
     */

    /**
     * @cfg {String} [dropGroup=""] The ddgroup name for the MultiSelect DropZone.
     */

    /**
     * @cfg {String} [title=""] A title for the underlying panel.
     */

    /**
     * @cfg {Boolean} [ddReorder=false] Whether the items in the MultiSelect list are drag/drop reorderable.
     */
    ddReorder: false,

    /**
     * @cfg {Object/Array} tbar An optional toolbar to be inserted at the top of the control's selection list.
     * This can be a {@link Ext.toolbar.Toolbar} object, a toolbar config, or an array of buttons/button configs
     * to be added to the toolbar. See {@link Ext.panel.Panel#tbar}.
     */

    /**
     * @cfg {String} [appendOnly=false] `true` if the list should only allow append drops when drag/drop is enabled.
     * This is useful for lists which are sorted.
     */
    appendOnly: false,

    /**
     * @cfg {String} [displayField="text"] Name of the desired display field in the dataset.
     */
    displayField: 'text',

    /**
     * @cfg {String} [valueField="text"] Name of the desired value field in the dataset.
     */

    /**
     * @cfg {Boolean} [allowBlank=true] `false` to require at least one item in the list to be selected, `true` to allow no
     * selection.
     */
    allowBlank: true,

    /**
     * @cfg {Number} [minSelections=0] Minimum number of selections allowed.
     */
    minSelections: 0,

    /**
     * @cfg {Number} [maxSelections=Number.MAX_VALUE] Maximum number of selections allowed.
     */
    maxSelections: Number.MAX_VALUE,

    /**
     * @cfg {String} [blankText="This field is required"] Default text displayed when the control contains no items.
     */
    blankText: 'This field is required',

    /**
     * @cfg {String} [minSelectionsText="Minimum {0}item(s) required"] 
     * Validation message displayed when {@link #minSelections} is not met. 
     * The {0} token will be replaced by the value of {@link #minSelections}.
     */
    minSelectionsText: 'Minimum {0} item(s) required',

    /**
     * @cfg {String} [maxSelectionsText="Maximum {0}item(s) allowed"] 
     * Validation message displayed when {@link #maxSelections} is not met
     * The {0} token will be replaced by the value of {@link #maxSelections}.
     */
    maxSelectionsText: 'Maximum {0} item(s) required',

    /**
     * @cfg {String} [delimiter=","] The string used to delimit the selected values when {@link #getSubmitValue submitting}
     * the field as part of a form. If you wish to have the selected values submitted as separate
     * parameters rather than a single delimited parameter, set this to `null`.
     */
    delimiter: ',',

    /**
     * @cfg {String} [dragText="{0} Item{1}"] The text to show while dragging items.
     * {0} will be replaced by the number of items. {1} will be replaced by the plural
     * form if there is more than 1 item.
     */
    dragText: '{0} Item{1}',

    /**
     * @cfg {Ext.data.Store/Array} store The data source to which this MultiSelect is bound (defaults to `undefined`).
     * Acceptable values for this property are:
     * <div class="mdetail-params"><ul>
     * <li><b>any {@link Ext.data.Store Store} subclass</b></li>
     * <li><b>an Array</b> : Arrays will be converted to a {@link Ext.data.ArrayStore} internally.
     * <div class="mdetail-params"><ul>
     * <li><b>1-dimensional array</b> : (e.g., <tt>['Foo','Bar']</tt>)<div class="sub-desc">
     * A 1-dimensional array will automatically be expanded (each array item will be the combo
     * {@link #valueField value} and {@link #displayField text})</div></li>
     * <li><b>2-dimensional array</b> : (e.g., <tt>[['f','Foo'],['b','Bar']]</tt>)<div class="sub-desc">
     * For a multi-dimensional array, the value in index 0 of each item will be assumed to be the combo
     * {@link #valueField value}, while the value at index 1 is assumed to be the combo {@link #displayField text}.
     * </div></li></ul></div></li></ul></div>
     */

    ignoreSelectChange: 0,

    /**
     * @cfg {Number} [pageSize=10] The number of items to advance on pageUp and pageDown
     */
    pageSize: 10,

    useHiddenField: true,

    multiSelect: false,
    singleSelect: false,
    simpleSelect: true,
    simpleSubmit: false,
    showCheckbox: false,

    getHiddenStateName: function () {
        return this.getName();
    },

    isItemsReady: function () {
        return !!this.boundList;
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

    getHiddenState: function (value) {
        if (this.simpleSubmit) {
            return this.getValue();
        }

        var state = this.getSubmitArray();

        return state.length > 0 ? Ext.encode(state) : "";
    },

    // private
    initComponent: function () {
        var me = this;

        me.items = me.setupItems();
        me.bindStore(me.store, true);

        if (me.store.autoCreated) {
            me.valueField = me.displayField = 'field1';
            if (!me.store.expanded) {
                me.displayField = 'field2';
            }
        }

        if (!Ext.isDefined(me.valueField)) {
            me.valueField = me.displayField;
        }

        me.items = me.setupItems(); // #717

        me.callParent();
        me.initField();

        if (Ext.net.ResourceMgr.isMVC) {
            this.includeHiddenStateToSubmitData = !this.simpleSubmit;
        }
    },

    setupItems: function () {
        var me = this,
            config = {
                anchor: 'none 100%',
                border: 1,
                multiSelect: this.multiSelect,
                singleSelect: this.singleSelect,
                simpleSelect: (this.multiSelect || this.singleSelect) ? false : this.simpleSelect,
                displayField: me.displayField,
                store: me.store,
                disabled: me.disabled,
                tabIndex: 0,
                navigationModel: {
                    type: 'default'
                }
            };

        if (me.showCheckbox) {
            config.cls = "x-multiselect-with-checkbox";

            if (me.listConfig && me.listConfig.cls) {
                config.cls += " " + me.listConfig.cls;
                delete me.listConfig.cls;
            }
        }

        me.boundList = new Ext.view.BoundList(Ext.apply(config, me.listConfig));

        me.boundList.getNavigationModel().addKeyBindings({
            pageUp: me.onKeyPageUp,
            pageDown: me.onKeyPageDown,
            scope: me
        })

        me.boundList.getSelectionModel().on('selectionchange', me.onSelectChange, me);

        // Boundlist expects a reference to its pickerField for when an item is selected (see Boundlist#onItemClick).
        me.boundList.pickerField = me;

        // Only need to wrap the BoundList in a Panel if we have a title.
        if (!me.title) {
            me.boundList.border = this.border;
            return me.boundList;
        }

        // Wrap to add a title
        me.boundList.border = false;

        return {
            xtype: 'panel',
            isAriaRegion: false,
            border: this.border,
            anchor: 'none 100%',
            layout: 'anchor',
            title: me.title,
            tbar: me.tbar,
            items: me.boundList
        };
    },

    onSelectChange: function (selModel, selections) {
        if (!this.ignoreSelectChange) {
            this.setValue(selections);
        }
    },

    getSelected: function () {
        return this.boundList.getSelectionModel().getSelection();
    },

    // compare array values
    isEqual: function (v1, v2) {
        var fromArray = Ext.Array.from,
            i = 0,
            len;

        v1 = fromArray(v1);
        v2 = fromArray(v2);
        len = v1.length;

        if (len !== v2.length) {
            return false;
        }

        for (; i < len; i++) {
            if (v2[i] !== v1[i]) {
                return false;
            }
        }

        return true;
    },

    // private
    afterRender: function () {
        var me = this,
            boundList = me.boundList,
            records, panel;

        me.callParent();

        if (!Ext.isEmpty(this.selectedItems) && this.store) {
            this.setInitValue(this.selectedItems);
        }

        if (me.ddReorder && !me.dragGroup && !me.dropGroup) {
            me.dragGroup = me.dropGroup = 'MultiselectDD-' + Ext.id();
        }

        if (me.draggable || me.dragGroup) {
            me.dragZone = Ext.create('Ext.view.DragZone', {
                view: me.boundList,
                ddGroup: me.dragGroup,
                dragText: me.dragText
            });
        }
        if (me.droppable || me.dropGroup) {
            me.dropZone = Ext.create('Ext.view.DropZone', {
                view: me.boundList,
                ddGroup: me.dropGroup,
                handleNodeDrop: function (data, dropRecord, position) {
                    if (me.fireEvent('beforedrop', me, data, dropRecord, position) === false) {
                        return false;
                    }

                    var view = this.view,
                        store = view.getStore(),
                        records = data.records,
                        copyRecords,
                        index;

                    /*---ADDED---*/
                    if (data.view.ownerCt.copy) {
                        copyRecords = [];
                        Ext.each(records, function (record) {
                            copyRecords.push(record.copy());
                        });
                        records = copyRecords;
                    } else {
                        // remove the Models from the source Store
                        data.view.store.remove(records);
                    }
                    /*---END ADDED---*/

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

    onKeyPageDown: function (e) {
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

    isValid: function () {
        var me = this,
            disabled = me.disabled,
            validate = me.forceValidation || !disabled;


        return validate ? me.validateValue(me.value) : disabled;
    },

    validateValue: function (value) {
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

    markInvalid: function (errors) {
        // Save the message and fire the 'invalid' event
        var me = this,
            oldMsg = me.getActiveError();
        me.setActiveErrors(Ext.Array.from(errors));
        if (oldMsg !== me.getActiveError()) {
            me.updateLayout();
        }
    },

    /**
     * Clear any invalid styles/messages for this field.
     *
     * __Note:__ this method does not cause the Field's {@link #validate} or {@link #isValid} methods to return `true`
     * if the value does not _pass_ validation. So simply clearing a field's errors will not necessarily allow
     * submission of forms submitted with the {@link Ext.form.action.Submit#clientValidation} option set.
     */
    clearInvalid: function () {
        // Clear the message and fire the 'valid' event
        var me = this,
            hadError = me.hasActiveError();
        me.unsetActiveError();
        if (hadError) {
            me.updateLayout();
        }
    },

    getSubmitData: function () {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            }
        }
        return data;
    },

    /**
     * Returns the value that would be included in a standard form submit for this field.
     *
     * @return {String} The value to be submitted, or `null`.
     */
    getSubmitValue: function () {
        var me = this,
            delimiter = me.delimiter,
            val = me.getValue();
        return Ext.isString(delimiter) ? val.join(delimiter) : val;
    },

    getValue: function () {
        return this.value || [];
    },

    getRecordsForValue: function (value) {
        var me = this,
            records = [],
            all = me.store.getRange(),
            valueField = me.valueField,
            i = 0,
            allLen = all.length,
            rec,
            j,
            valueLen;

        value = value || [];

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

    setupValue: function (value) {
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

    setValue: function (value) {
        var me = this,
            selModel = me.boundList.getSelectionModel(),
            originalPreventFocus;

        // Store not loaded yet - we cannot set the value
        if (!me.store.getCount()) {
            me.store.on({
                load: Ext.Function.bind(me.setValue, me, [value]),
                single: true
            });
            return;
        }

        value = me.setupValue(value);
        me.mixins.field.setValue.call(me, value);

        if (me.rendered) {
            originalPreventFocus = selModel.preventFocus;
            selModel.preventFocus = true;
            ++me.ignoreSelectChange;
            selModel.deselectAll();

            if (value.length) {
                selModel.select(me.getRecordsForValue(value));
            }

            --me.ignoreSelectChange;
            selModel.preventFocus = originalPreventFocus;
        } else {
            me.selectOnRender = true;
        }
    },

    clearValue: function () {
        this.setValue([]);
    },

    onEnable: function () {
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.enable();
        }
    },

    onDisable: function () {
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.disable();
        }
    },

    getErrors: function (value) {
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

    onDestroy: function () {
        var me = this;

        me.bindStore(null);
        Ext.destroy(me.dragZone, me.dropZone, me.keyNav);
        me.callParent();
    },

    onBindStore: function (store) {
        var boundList = this.boundList;

        if (boundList) {
            boundList.bindStore(store);
        }
    },

    setInitValue: function (value) {
        if (this.store.getCount() > 0) {
            this.setSelectedItems(value);
        } else {
            this.store.on("load", Ext.Function.bind(this.setSelectedItems, this, [value]), this, { single: true });
        }
    },

    findRecord: function (field, value) {
        var ds = this.store,
            idx = ds.findExact(field, value);
        return idx !== -1 ? ds.getAt(idx) : false;
    },
    findRecordByValue: function (value) {
        return this.findRecord(this.valueField, value);
    },
    findRecordByDisplay: function (value) {
        return this.findRecord(this.displayField, value);
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

    afterLayout: function () {
        this.callParent(arguments);

        if (this.labelAlign == "top" && this.boundList) {
            Ext.suspendLayouts();
            var td = this.boundList.el.parent();
            this.boundList.el.setHeight(td.getHeight() - td.getBorderWidth("tb") - td.getPadding("tb"));
            Ext.resumeLayouts();
        }
    }
});

/*
 * Note that this control will most likely remain as an example, and not as a core Ext form
 * control.  However, the API will be changing in a future release and so should not yet be
 * treated as a final, stable API at this time.
 */

/**
 * A control that allows selection of between two Ext.ux.form.MultiSelect controls.
 */
Ext.define('Ext.ux.form.ItemSelector', {
    extend: 'Ext.ux.form.MultiSelect',
    alias: ['widget.itemselectorfield', 'widget.itemselector'],
    alternateClassName: ['Ext.ux.ItemSelector'],
    requires: [
        'Ext.button.Button',
        'Ext.ux.form.MultiSelect'
    ],

    /**
     * @cfg {Boolean} [hideNavIcons=false] True to hide the navigation icons
     */
    hideNavIcons: false,

    /**
     * @cfg {Array} buttons Defines the set of buttons that should be displayed in between the ItemSelector
     * fields. Defaults to <tt>['top', 'up', 'add', 'remove', 'down', 'bottom']</tt>. These names are used
     * to build the button CSS class names, and to look up the button text labels in {@link #buttonsText}.
     * This can be overridden with a custom Array to change which buttons are displayed or their order.
     */
    buttons: ['top', 'up', 'add', 'remove', 'down', 'bottom'],

    /**
     * @cfg {Object} buttonsText The tooltips for the {@link #buttons}.
     * Labels for buttons.
     */
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

    initComponent: function () {
        var me = this;

        me.store = Ext.StoreMgr.lookup(me.store); // #717
        me.ddGroup = me.id + '-dd';
        me.ariaRenderAttributes = me.ariaRenderAttributes || {};
        me.ariaRenderAttributes['aria-labelledby'] = me.id + '-labelEl';
        me.callParent();
    },

    createList: function (title) {
        var me = this;

        return Ext.create('Ext.ux.form.MultiSelect', {
            // We don't want the multiselects themselves to act like fields,
            // so override these methods to prevent them from including
            // any of their values
            submitValue: false,
            useHiddenField: false,
            getSubmitData: function () {
                return null;
            },
            getModelData: function () {
                return null;
            },
            flex: 1,
            border: 1,
            multiSelect: me.multiSelect,
            singleSelect: me.singleSelect,
            simpleSelect: me.simpleSelect,
            dragGroup: me.ddGroup,
            dropGroup: me.ddGroup,
            title: title,
            store: {
                model: me.store.getModel(),
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

    isItemsReady: function () {
        return !!this.fromField;
    },

    setupItems: function () {
        var me = this;

        if (me.fromField) { // #717
            me.fromField.destroy();
        }

        if (me.toField) { // #717
            me.toField.destroy();
        }

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

    createButtons: function () {
        var me = this,
            buttons = [];

        if (!me.hideNavIcons) {
            Ext.Array.forEach(me.buttons, function (name) {
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

    /**
     * Get the selected records from the specified list.
     * 
     * Records will be returned *in store order*, not in order of selection.
     * @param {Ext.view.BoundList} list The list to read selections from.
     * @return {Ext.data.Model[]} The selected records in store order.
     * 
     */
    getSelections: function (list) {
        var store = list.getStore();

        return Ext.Array.sort(list.getSelectionModel().getSelection(), function (a, b) {
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

    getSelected: function () {
        return this.getSelections(this.toField.boundList);
    },

    onTopBtnClick: function () {
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

    onBottomBtnClick: function () {
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

    onUpBtnClick: function () {
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

    onDownBtnClick: function () {
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

    onAddBtnClick: function () {
        var me = this,
            selected = me.getSelections(me.fromField.boundList);

        me.moveRec(true, selected);
        me.toField.boundList.getSelectionModel().select(selected);
    },

    onRemoveBtnClick: function () {
        var me = this,
            selected = me.getSelections(me.toField.boundList);

        me.moveRec(false, selected);
        me.fromField.boundList.getSelectionModel().select(selected);
    },

    moveRec: function (add, recs) {
        var me = this,
            fromField = me.fromField,
            toField = me.toField,
            fromStore = add ? fromField.store : toField.store,
            toStore = add ? toField.store : fromField.store;

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
    syncValue: function () {
        var me = this;
        me.mixins.field.setValue.call(me, me.setupValue(me.toField.store.getRange()));
    },

    onItemDblClick: function (view, rec) {
        this.moveRec(view === this.fromField.boundList, rec);
    },

    setValue: function (value) {
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
        Ext.Array.forEach(selected, function (rec) {
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

    onBindStore: function (store, initial) {
        var me = this;

        if (me.fromField) {
            me.fromField.store.removeAll();
            me.toField.store.removeAll();

            // Add everything to the from field as soon as the Store is loaded
            if (store.getCount()) {
                me.populateFromStore(store);
            } else {
                me.store.on('load', me.populateFromStore, me);
            }
        }
    },

    populateFromStore: function (store) {
        var fromStore = this.fromField.store;

        // Flag set when the fromStore has been loaded
        this.fromStorePopulated = true;

        this.fromField.store.removeAll();
        this.toField.store.removeAll();

        fromStore.add(store.getRange());

        // setValue waits for the from Store to be loaded
        fromStore.fireEvent('load', fromStore);
    },

    onEnable: function () {
        var me = this;

        me.callParent();
        me.fromField.enable();
        me.toField.enable();

        Ext.Array.forEach(me.query('[navBtn]'), function (btn) {
            btn.enable();
        });
    },

    onDisable: function () {
        var me = this;

        me.callParent();
        me.fromField.disable();
        me.toField.disable();

        Ext.Array.forEach(me.query('[navBtn]'), function (btn) {
            btn.disable();
        });
    },

    onDestroy: function () {
        this.bindStore(null);
        this.callParent();
    }
});