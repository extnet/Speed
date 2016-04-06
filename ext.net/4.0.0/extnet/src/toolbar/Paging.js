// @source core/toolbar/Paging.js

Ext.toolbar.Paging.override({
    initComponent: function () {
        this.originalOnLoad = this.onLoad;
        this.onLoad = Ext.Function.createBuffered(this.onLoad, 50); // #727
        this.callParent(arguments);

        if (this.hideRefresh) {
            this.child("#refresh").hide();
        }
    },

    bindStore: function (store, initial, propertyName) {
        var isEmpty = store === 'ext-empty-store' && initial;

        if (store && !isEmpty) {
            store = Ext.data.StoreManager.lookup(store);
        }

        if (!store || isEmpty) {
            if (this.ownerCt) {
                store = this.findStore();
            }
            else {
                store = 'ext-empty-store';
                this.needFindStore = true;
            }
        }

        this.callParent([store, initial, propertyName]);
    },

    findStore: function () {
        var storeOwner = this.up('{store}');
        return storeOwner ? storeOwner.store : 'ext-empty-store';
    },

    onAdded: function () {
        this.callParent(arguments);

        if (this.needFindStore) {
            this.bindStore(this.findStore());
            delete this.needFindStore;
        }
    },

    getStoreListeners: function () {
        return {
            beforeload: this.beforeLoad,
            load: this.onStoreLoad,
            exception: this.onLoadError,
            datachanged: this.onLoad,
            add: this.onLoad,
            remove: this.onLoad,
            clear: this.onClear
        };
    },

    onClear: function () {
        this.store.currentPage = 1;
        this.onLoad();
    },

    doRefresh: function () {
        var me = this,
            current = me.store.currentPage;

        if (me.fireEvent('beforechange', me, current) !== false) {
            if (me.store.isPagingStore) {
                me.store.reload();
            } else {
                me.store.loadPage(current);
            }
            return true;
        }

        return false;
    },

    onStoreLoad: function () {
        this.onLoad(true);
    },

    onLoad: function (isLoad) {
        var me = this,
            pageData,
            currPage,
            pageCount,
            afterText,
            count,
            isEmpty,
            item;

        if (!me.rendered) {
            if (!me.updateAfterRender) {
                me.updateAfterRender = true;
                this.on("afterrender", me.onLoad, me, { single: true });
            }
            return;
        }

        delete me.updateAfterRender;

        count = me.store.getCount();
        isEmpty = count === 0;
        if (!isEmpty) {
            pageData = me.getPageData();
            currPage = pageData.currentPage;
            pageCount = pageData.pageCount;

            // Check for invalid current page.
            if (currPage > pageCount) {
                // If the surrent page is beyond the loaded end,
                // jump back to the loaded end if there is a valid page count.
                if (pageCount > 0) {
                    me.store.loadPage(pageCount);
                }
                    // If no pages, reset the page field.
                else {
                    me.getInputItem().reset();
                }

                return;
            }

            afterText = Ext.String.format(me.afterPageText, isNaN(pageCount) ? 1 : pageCount);
        } else {
            currPage = 0;
            pageCount = 0;
            afterText = Ext.String.format(me.afterPageText, 0);
        }

        Ext.suspendLayouts();
        item = me.child('#afterTextItem');
        if (item) {
            item.update(afterText);
        }
        item = me.getInputItem();
        if (item) {
            item.setDisabled(isEmpty).setValue(currPage);
        }
        me.setChildDisabled('#first', currPage === 1 || isEmpty);
        me.setChildDisabled('#prev', currPage === 1 || isEmpty);
        me.setChildDisabled('#next', currPage === pageCount || isEmpty);
        me.setChildDisabled('#last', currPage === pageCount || isEmpty);
        me.setChildDisabled('#refresh', false);
        me.updateInfo();
        Ext.resumeLayouts(true);

        if (me.rendered && isLoad === true && !me.calledInternal) {
            me.fireEvent('change', me, pageData || me.emptyPageData);
        }
    },

    updateInfo: function () {
        var me = this,
            displayItem = me.child('#displayItem'),
            pageData = me.getPageData(),
            msg;

        if (displayItem) {
            if (pageData.pageCount === 0) {
                msg = me.emptyMsg;
            } else {
                msg = Ext.String.format(
                    me.displayMsg,
                    pageData.fromRecord,
                    pageData.toRecord,
                    pageData.total
                );
            }
            displayItem.setText(msg);
        }
    }
});