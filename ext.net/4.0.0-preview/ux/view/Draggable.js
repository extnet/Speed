/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define('Ext.ux.DataView.Draggable',{requires:'Ext.dd.DragZone',ghostCls:'x-dataview-draggable-ghost',ghostTpl:['<tpl for=".">','{title}','</tpl>'],constructor:function(config){Ext.apply(this,config);this.callParent(arguments);},init:function(dataview,config){this.dataview=dataview;dataview.on('render',this.onRender,this);Ext.apply(this,{itemSelector:dataview.itemSelector,ghostConfig:{}},config||{});Ext.applyIf(this.ghostConfig,{itemSelector:'img',cls:this.ghostCls,tpl:this.ghostTpl});},onRender:function(){var config=Ext.apply({},this.ddConfig||{},{dvDraggable:this,dataview:this.dataview,getDragData:this.getDragData,getTreeNode:this.getTreeNode,afterRepair:this.afterRepair,getRepairXY:this.getRepairXY});this.dragZone=Ext.create('Ext.dd.DragZone',this.dataview.getEl(),config);},getDragData:function(e){var draggable=this.dvDraggable,dataview=this.dataview,selModel=dataview.getSelectionModel(),target=e.getTarget(draggable.itemSelector),selected,dragData;if(target){if(!dataview.isSelected(target)){selModel.select(dataview.getRecord(target));}
selected=dataview.getSelectedNodes();dragData={copy:true,nodes:selected,records:selModel.getSelection(),item:true};if(selected.length===1){dragData.single=true;dragData.ddel=target;}else{dragData.multi=true;dragData.ddel=draggable.prepareGhost(selModel.getSelection());}
return dragData;}
return false;},getTreeNode:function(){},afterRepair:function(){this.dragging=false;var nodes=this.dragData.nodes,length=nodes.length,i;for(i=0;i<length;i++){Ext.get(nodes[i]).frame('#8db2e3',1);}},getRepairXY:function(e){if(this.dragData.multi){return false;}else{var repairEl=Ext.get(this.dragData.ddel),repairXY=repairEl.getXY();repairXY[0]+=repairEl.getPadding('t')+repairEl.getMargin('t');repairXY[1]+=repairEl.getPadding('l')+repairEl.getMargin('l');return repairXY;}},prepareGhost:function(records){return this.createGhost(records).getEl().dom;},createGhost:function(records){var me=this,store;if(me.ghost){(store=me.ghost.store).loadRecords(records);}else{store=Ext.create('Ext.data.Store',{model:records[0].self});store.loadRecords(records);me.ghost=Ext.create('Ext.view.View',Ext.apply({renderTo:document.createElement('div'),store:store},me.ghostConfig));me.ghost.container.skipGarbageCollection=me.ghost.el.skipGarbageCollection=true;}
store.clearData();return me.ghost;},destroy:function(){var ghost=this.ghost;if(ghost){ghost.container.destroy();ghost.destroy();}
this.callParent();}});
