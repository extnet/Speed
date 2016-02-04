/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define('Ext.ux.CellDragDrop',{extend:'Ext.plugin.Abstract',alias:'plugin.celldragdrop',uses:['Ext.view.DragZone'],enforceType:false,applyEmptyText:false,emptyText:'',dropBackgroundColor:'green',noDropBackgroundColor:'red',dragText:'{0} selected row{1}',ddGroup:"GridDD",enableDrop:true,enableDrag:true,containerScroll:false,notSupportedText:"The cell from a Column without a DataIndex cannot be used for drag&drop",init:function(view){var me=this;view.on('render',me.onViewRender,me,{single:true});},destroy:function(){var me=this;me.dragZone=me.dropZone=Ext.destroy(me.dragZone,me.dropZone);me.callParent();},enable:function(){var me=this;if(me.dragZone){me.dragZone.unlock();}
if(me.dropZone){me.dropZone.unlock();}
me.callParent();},disable:function(){var me=this;if(me.dragZone){me.dragZone.lock();}
if(me.dropZone){me.dropZone.lock();}
me.callParent();},onViewRender:function(view){var me=this,scrollEl;if(me.enableDrag){if(me.containerScroll){scrollEl=view.getEl();}
me.dragZone=new Ext.view.DragZone({view:view,ddGroup:me.dragGroup||me.ddGroup,dragText:me.dragText,containerScroll:me.containerScroll,scrollEl:scrollEl,notSupportedText:me.notSupportedText,getDragData:function(e){var view=this.view,item=e.getTarget(view.getItemSelector()),record=view.getRecord(item),cell=e.getTarget(view.getCellSelector()),dragEl,header;if(item){dragEl=document.createElement('div');dragEl.className='x-form-text';dragEl.appendChild(document.createTextNode(cell.textContent||cell.innerText));header=view.getHeaderByCell(cell);return{event:new Ext.EventObjectImpl(e),ddel:dragEl,item:e.target,columnName:header.dataIndex,record:record};}},onInitDrag:function(x,y){var self=this,data=self.dragData,view=self.view,selectionModel=view.getSelectionModel(),record=data.record,el=data.ddel;if(!selectionModel.isSelected(record)){selectionModel.select(record,true);}
if(data.columnName){Ext.fly(self.ddel).update(el.textContent||el.innerText);}else{Ext.fly(self.ddel).update(self.notSupportedText);}
self.proxy.update(self.ddel);self.onStartDrag(x,y);return true;}});}
if(me.enableDrop){me.dropZone=new Ext.dd.DropZone(view.el,{view:view,ddGroup:me.dropGroup||me.ddGroup,containerScroll:true,getTargetFromEvent:function(e){var self=this,view=self.view,cell=e.getTarget(view.cellSelector),row,header;if(cell){row=view.findItemByChild(cell);header=view.getHeaderByCell(cell);if(row&&header){return{node:cell,record:view.getRecord(row),columnName:header.dataIndex};}}},onNodeEnter:function(target,dd,e,dragData){var self=this,destType=target.columnName?target.record.getField(target.columnName).type.toUpperCase():null,sourceType=dragData.columnName?dragData.record.getField(dragData.columnName).type.toUpperCase():null;delete self.dropOK;if(!target||target.node===dragData.item.parentNode){return;}
if(destType==null||me.enforceType&&destType!==sourceType){self.dropOK=false;if(me.noDropCls){Ext.fly(target.node).addCls(me.noDropCls);}else{Ext.fly(target.node).applyStyles({backgroundColor:me.noDropBackgroundColor});}
return false;}
self.dropOK=true;if(me.dropCls){Ext.fly(target.node).addCls(me.dropCls);}else{Ext.fly(target.node).applyStyles({backgroundColor:me.dropBackgroundColor});}},onNodeOver:function(target,dd,e,dragData){return this.dropOK?this.dropAllowed:this.dropNotAllowed;},onNodeOut:function(target,dd,e,dragData){var cls=this.dropOK?me.dropCls:me.noDropCls;if(cls){Ext.fly(target.node).removeCls(cls);}else{Ext.fly(target.node).applyStyles({backgroundColor:''});}},onNodeDrop:function(target,dd,e,dragData){if(this.dropOK){target.record.set(target.columnName,dragData.record.get(dragData.columnName));if(me.applyEmptyText){dragData.record.set(dragData.columnName,me.emptyText);}
return true;}},onCellDrop:Ext.emptyFn});}}});
