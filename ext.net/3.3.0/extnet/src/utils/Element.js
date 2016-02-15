
// @source core/utils/Element.js

Ext.dom.Element.override({
    singleSelect: function (selector, unique) {
        return Ext.get(Ext.select(selector, unique).elements[0]);
    },

    setValue: function (val) {
        if (Ext.isDefined(this.dom.value)) {
            this.dom.value = val;
        }

        return this;
    },

    getValue: function (asNumber) {
        var value = this.dom.value;

        return Ext.isDefined(value) ? (asNumber ? parseInt(value, 10) : value) : null;
    },

    removeAttribute: function (attr) {
        this.dom.removeAttribute(attr);
    },

    removeStyleProperty: function (prop) {
        this.dom.style[Ext.isIE8m ? "removeAttribute" : "removeProperty"](prop);
    },

    getById: function (id, asDom) {
        if (Ext.isEmpty(id)) {
            return null;
        }

        return this.callParent(arguments);
    },

    is: function (selector) {
        var dom = this.dom,
            is,
            children,
            i,
            len;

        if (!selector) {
            // In Ext 4 is() called through to DomQuery methods, and would always
            // return true if the selector was ''.  The new query() method in v5 uses
            // querySelector/querySeletorAll() which consider '' to be an invalid
            // selector and throw an error as a result.  To maintain compatibility
            // with the various users of is() we have to return true if the selector
            // is an empty string.  For example: el.up('') should return the element's
            // direct parent.
            is = true;
        } else if (!dom.tagName) {
            // document and window objects can never match a selector
            is = false;
        } else if (Ext.isFunction(selector)) {
            is = selector(dom);
        } else if (dom[Ext.supports.matchesSelector]) { // #659
            is = dom[Ext.supports.matchesSelector](selector);
        } else if (document.documentElement[Ext.supports.matchesSelector]) { // #659
            is = document.documentElement[Ext.supports.matchesSelector].call(dom, selector); 
        } else if (Ext.isIE8) { // #728
            children = this.dom.parentNode.querySelectorAll(selector);
            len = children.length;
            is = false;

            for (i = 0; i < len; i++) {
                if (children[i] === dom) {
                    is = true;
                    break;
                }
            }
        } else { // There is a possibility that a check on selector fails.
            is = false;
            Ext.Error.raise(Ext.String.format("The element '{0}' could not be ckecked on matching the selector", this.id));
        }

        return is;
    }
});

// #827
Ext.define('Ext.override.dom.Element', {
    override: 'Ext.dom.Element',
    compatability: '5.1.1',


    wrap: function (config, returnDom, selector) {
        var me = this,
            dom = me.dom,
            newEl = Ext.DomHelper.insertBefore(dom, config || { tag: "div" }, !returnDom),
            target = newEl,
            activeElement = Ext.get(Ext.Element.getActiveElement()), // #827, .get() instead of .fly()
            resumeFocus;

        if (selector) {
            target = newEl.selectNode(selector, returnDom);
        }

        if (me.contains(activeElement)) {
            Ext.GlobalEvents.suspendEvent('focus');
            activeElement.suspendEvent('focus', 'blur');
            resumeFocus = true;
        }

        target.appendChild(dom);

        if (resumeFocus) {
            activeElement.focus();
            activeElement.resumeEvent('focus', 'blur');
            Ext.GlobalEvents.resumeEvent('focus');
        }

        return newEl;
    }
});