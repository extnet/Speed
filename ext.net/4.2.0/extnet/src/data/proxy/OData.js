/**
 * Class for construction the OData proxy for ExtJS 4.1.
 * @extends Ext.data.proxy.Ajax
 * @author Maicon Schelter
 * @example
 * Ext.create('Ext.data.Store',{
 * 		 autoLoad	: true
 * 		,autoSync	: true
 * 		,proxy : {
 * 			 type	: 'odata'
 * 			,url	: 'DTE/services/ListCars'
 * 			,params : {
 * 				type : 'DTE.Model.Cars'
 * 			}
 * 		}
 * 	});
 */
Ext.define("Ext.data.proxy.OData", {

    extend: "Ext.data.proxy.Ajax",
	alternateClassName: "Ext.data.OData",
	alias: "proxy.odata",
    isODataProxy : true,
    enablePagingParams : true,
    appendAction : false,

    /**
    * @cfg {Boolean} appendId
    * Indicate if concat ID at URL request.
    */
	appendId: true,	

	constructor: function () {
	    this.callParent(arguments);
	    Ext.net.reconfigure(this, this.initialConfig, {
	        /**
            * @cfg {Boolean} batchActions
            * Indicate if execute the batch action of request.
            */
	        batchActions: false,

	        actionMethods: {
	            create: "POST",
	            read: "GET",
	            update: "PUT",
	            destroy: "DELETE"
	        },

	        headers: {
	            "Accept": "application/json"
	        },

	        reader: {
	            type: 'odata'
	        },

	        pageParam: undefined,

	        noCache: false
	    });
	},

    /**
    * Method using with create the url of Ajax.
    * @method buildUrl
    * @param {Object} request Request options.
    * @private
    */
	buildUrl: function (request) {
	    var me = this,
			operation = request.getOperation(),
			records = operation.getRecords() || [],
			record = records[0],
			format = me.format,
			url = me.getUrl(request),
            params     = request.getParams() || {},            
			id = record && !record.phantom ? record.getId() : null;

	    if (me.appendId && id) {
	        if (url.match(/\/$/)) {
                url = url.substring(0, url.length - 1);
            }
            url = url + "(" + id + ")";
	    }

        if (request.getAction() == "read") {
            request.setParams(Ext.apply(params, { "$inlinecount": "allpages" }));
        }

	    if (format) {
	        if (!url.match(/\.$/)) {
	            url += ".";
	        }

	        url += format;
	    }

	    request.setUrl(url);

	    delete params[me.getIdParam()];

	    return me.callParent(arguments);
	},

    doRequest: function(operation) {
        var scope = operation.getInternalScope();

        if (operation.getAction() === "read") {
            this.setSortParam(scope.getRemoteSort() ? "$orderby" : null);
            this.setFilterParam(scope.getRemoteFilter() ? "$filter" : null);
            this.setStartParam(this.enablePagingParams ? "$skip" : null);
            this.setLimitParam(this.enablePagingParams ? "$top" : null);
        }

        this.getWriter().setAllowSingle(true);
        this.json = true;

        return this.callParent(arguments);
    },

    /**
    * Method using with create of sorters.
    * @method encodeSorters
    * @param {Array} sorters Request sorters.
    * @private
    */
    encodeSorters: function (sorters) {
	    var min = [],
			length = sorters.length,
			i = 0;

	    for (; i < length; i++) {
	        min[i] = sorters[i].getProperty();

	        if (sorters[i].getDirection().toLowerCase() == "desc") {
	            min[i] += " desc";
	        }
	    }

	    return min.join(",");
	},

    /**
    * Method using with create of filters.
    * @method encodeFilters
    * @param {Array} filters Request filters.
    * @private
    */
	encodeFilters: function (filters) {
	    var filter = "",
            logical = "",
			length = filters.length,
			sq = "'",
			type = "",
            op = "",
            prop = "",
            val = "",
            item,
			i;

	    for (i = 0; i < length; i++) {
            item = filters[i];
	        type = item.type || "";
            logical = item.logical || "and";

            if (i > 0){
                filter += " " + logical + " ";
            }

	        switch (type) {
	            case "int":
	            case "bool":
	                type = "";
	                sq = "";
	                break;
	            case "guid":
	                type = "guid";
	                sq = "'";
	                break;
	            default:
	                type = "";
	                sq = "'";
	                break;
	        }
	        op = item.getOperator() || "eq";
	        prop = item.getProperty();
	        val = item.getValue();

	        if (op == "like") {
	            prop = "substringof('" + val + "', " + prop + ")";
	            val = "true";
	            op = "eq";
	            sq = "";
	        }

	        filter += prop + " " + op + " " + type + sq + val + sq;
	    }

	    return filter;
	},

    processResponse: function(success, operation, request, response) {
        var me = this,
            action = operation.getAction(),
            reader,
            resultSet;
        
        if (action === 'read' || action === 'create') {
            this.callParent(arguments);
        }                
        else {            
            if (response.status !== 204 && response.status !== 202 && response.status !== 1223) {
                operation.setException(response.statusText);
                me.fireEvent('exception', this, response, operation);
            }
            else {
                reader = me.getReader();

                resultSet = reader.read(me.extractResponseData(response), {
                    recordCreator: operation.getRecordCreator()
                });

                operation.process(resultSet, request, response);
            }

            me.afterRequest(request, success);
        }
    }
});