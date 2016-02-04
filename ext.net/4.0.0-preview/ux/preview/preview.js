/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define('Ext.ux.PreviewPlugin',{extend:'Ext.plugin.Abstract',alias:'plugin.preview',requires:['Ext.grid.feature.RowBody'],hideBodyCls:'x-grid-row-body-hidden',bodyField:'',previewExpanded:true,setCmp:function(target){this.callParent(arguments);var me=this,grid=me.cmp=target.isXType('gridview')?target.grid:target,bodyField=me.bodyField,hideBodyCls=me.hideBodyCls,feature=Ext.create('Ext.grid.feature.RowBody',{grid:grid,getAdditionalData:function(data,idx,model,rowValues){var getAdditionalData=Ext.grid.feature.RowBody.prototype.getAdditionalData,additionalData={rowBody:data[bodyField],rowBodyCls:grid.getView().previewExpanded?'':hideBodyCls};if(Ext.isFunction(getAdditionalData)){Ext.apply(additionalData,getAdditionalData.apply(this,arguments));}
return additionalData;}}),initFeature=function(grid,view){view.previewExpanded=me.previewExpanded;view.featuresMC.add(feature);feature.init(grid);};if(grid.view){initFeature(grid,grid.view);}
else{grid.on({viewcreated:initFeature,single:true});}},toggleExpanded:function(expanded){var grid=this.getCmp(),view=grid&&grid.getView(),bufferedRenderer=view.bufferedRenderer,scrollManager=view.scrollManager;if(grid&&view&&expanded!==view.previewExpanded){this.previewExpanded=view.previewExpanded=!!expanded;view.refreshView();if(scrollManager){if(bufferedRenderer){bufferedRenderer.stretchView(view,bufferedRenderer.getScrollHeight(true));}else{scrollManager.refresh(true);}}}}});
