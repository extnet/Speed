/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define("Ext.net.VerticalMarker",{extend:'Ext.util.Observable',alias:"plugin.verticalmarker",xLabelCls:"x-vmarker-xfieldlabel",yLabelCls:"x-vmarker-yfieldlabel",snap:false,showXLabel:true,buffer:0,constructor:function(config){Ext.apply(this,config);this.callParent(arguments);},init:function(chart){var me=this;me.chart=chart;if(chart.rendered){me.initialize();}else{me.chart.on("afterrender",me.initialize,me,{single:true,delay:500});}},initialize:function(){var me=this;if(me.disabled){return;}
me.chart.addElementListener("mousemove",me.onMouseMove,me);me.chart.addElementListener("mouseleave",me.onMouseLeave,me);me.markerSprite=me.chart.getSurface().add(Ext.apply({type:'path',path:['M',0,0],zIndex:1001,opacity:0.6,hidden:true,stroke:'#00f',cursor:'crosshair'},me.markerConfig||{}));me.chart.redraw=Ext.Function.createSequence(me.chart.redraw,function(){me.hideVisibleStuff();},me);},initLabels:function(){if(this.labels){return;}
var me=this,seriesItems=me.chart.getSeries(),series,i,len,style,fill,legendColor,cmp;me.xFieldLabel=new Ext.Component({floating:true,renderTo:document.body,cls:this.xLabelCls,hidden:true});me.xFieldLabel.mon(me.xFieldLabel.el,"mouseover",this.cancelHideStuffTask,this);me.labels=[];for(i=0,ln=seriesItems.length;i<ln;i++){series=seriesItems[i];style=series.getSubStyleWithTheme(),fill=style.fillStyle,legendColor=(Ext.isObject(fill)?fill.stops&&fill.stops[0].color:fill)||style.strokeStyle||'black'
cmp=new Ext.Component({floating:true,style:"background-color: "+legendColor+";",renderTo:document.body,hidden:true,cls:this.yLabelCls});me.labels.push(cmp);cmp.mon(cmp.el,"mouseover",this.cancelHideStuffTask,this);}
if(me.buffer>0){me.eArg=[{getXY:Ext.Function.bind(me.eGetXY,me),getX:Ext.Function.bind(me.eGetPageX,me)}];}
this.fireEvent("labelsready",this);},cancelHideStuffTask:function(){if(this.hideStuffTask){this.hideStuffTask.cancel();delete this.hideStuffTask;}},onMouseMove:function(e){var me=this,position=me.chart.getEventXY(e),rect=me.chart.getInnerRect(),bbox={x:rect[0],y:rect[1],width:rect[2],height:rect[3]},seriesItems=me.chart.getSeries(),label,x=bbox.x,y=bbox.y,height=Math.floor(y+bbox.height),width=Math.floor(x+bbox.width),chartX=me.chart.el.getX(),chartY=me.chart.el.getY(),staticX=e.getX()-chartX-x,staticY=0,series,item,items,nearestItem,nearestX,minDist,i,ln,xy,lastItemFound=false,surfaceExt=Ext.get(me.chart.getSurface().getId()),surfacePosition=surfaceExt.getXY(),sprite,path;me.initLabels();staticX=Math.min(staticX,width);if(me.buffer<=0||((new Date().getTime()-(me.lastTime||0))>me.buffer)){me.lastTime=new Date().getTime();if(me.updateTask){me.updateTask.cancel();}
items=[];minDist=Number.MAX_VALUE;for(i=0,ln=seriesItems.length;i<ln;i++){series=seriesItems[i];label=me.labels[i];item=me.getItemForX(series,position[0],position[1]);items.push(item);if(item&&item.dist<minDist){nearestItem=item;minDist=item.dist;nearestX=item.item.record.get(series.getXField());}}
for(i=0,ln=seriesItems.length;i<ln;i++){item=items[i];if(item&&item.item.record.get(seriesItems[i].getXField())!==nearestX){items[i]=null;}}
for(i=0,ln=seriesItems.length;i<ln;i++){series=seriesItems[i];label=me.labels[i];item=items[i];if(item){if(!me.lastItem||me.lastItem.item.record.getId()!=item.item.record.getId()){me.labelXAdj=0;lastItemFound=true;me.lastItem=item;me.lastField=series.getXField();}
else if(!lastItemFound){continue;}
sprite=item.item.sprite;x=surfacePosition[0]+parseInt(item.item.point[0],10);y=surfacePosition[1]+(bbox.height-parseInt(item.item.point[1],10));if(me.snap){staticX=x-chartX-bbox.x;if(staticX<0){staticX=0;}}
label.show();if(me.yLabelRenderer){me.updateLabel(label,me.yLabelRenderer.call(me.yLabelScope||me,me,label,item.item.record.get(series.getYField()),item.item.record,series.getYField(),series));}
else{me.updateLabel(me.labels[i],item.item.record.get(series.getYField()));}
label.el.setXY(me.checkY(i,x+5,y,chartY,chartY+bbox.height),false);}
else{label.hide();}}}
else if(me.buffer>0){if(!me.updateTask){me.updateTask=new Ext.util.DelayedTask(function(e){this.onMouseMove(e);},me);}
me._eXY=e.getXY();me._ePageX=e.getX();me.updateTask.delay(me.buffer,undefined,undefined,me.eArg);}
path=['M',staticX,staticY,'L',staticX,height];if(!me.snap||lastItemFound){me.markerSprite.setAttributes({path:path,'stroke-width':1,hidden:false});me.markerSprite.getSurface().renderFrame();}
if(me.showXLabel){me.xFieldLabel.show();}
if(lastItemFound){if(me.xLabelRenderer){me.updateLabel(me.xFieldLabel,me.xLabelRenderer.call(me.xLabelScope||me,me,me.xFieldLabel,me.lastItem.item.record.get(me.lastField),me.lastItem.item.record,me.lastField));}
else{me.updateLabel(me.xFieldLabel,me.lastItem.item.record.get(me.lastField));}}
if((!me.snap||lastItemFound)&&me.showXLabel){x=surfacePosition[0]+staticX;y=surfacePosition[1]+bbox.height;if(x<(chartX+bbox.x)){x=chartX+bbox.x;}
me.xFieldLabel.el.setXY([x-me.xFieldLabel.getWidth()/2,y]);}},updateLabel:function(el,value){if(!Ext.isString(value)&&!Ext.isEmpty(value)){value=value.toString();}
el.update(value);},eGetXY:function(){return this._eXY;},eGetPageX:function(){return this._ePageX;},checkY:function(ind,x,y,minY,maxY){var me=this,i,box,height=me.labels[ind].getHeight(),t,b;y=y-height/2;for(i=0;i<ind;i++){if(me.labels[i].rendered){box=me.labels[i].getBox();t=Math.max(y,box.y);b=Math.min(y+height,box.y+box.height);if(b>t){me.labelXAdj=me.labelXAdj+box.width+2;y=box.y;x=x+me.labelXAdj;break;}}}
if(y<minY){y=minY;}
if(y>maxY){y=maxY;}
return[x,y];},withinBoxX:function(x,box){box=box||{};return x>=box.x&&x<=(box.x+box.width);},getItemForX:function(series,x,y){if(!series||!series.sprites||series.getHidden()){return null;}
var me=this,t,tX,point,store=series.getStore(),sprite=series.sprites[0],items=sprite.attr.dataX,dataY=sprite.attr.dataY,foundItem=items[0],foundDist=Number.MAX_VALUE,foundDistInd=-1,item,dist,lastItem=items[items.length-1],i,ln,imat=sprite.attr.matrix.clone().prependMatrix(sprite.surfaceMatrix).inverse(),mat=sprite.attr.matrix.clone(),elements=imat.elements;t=imat.transformPoint([x,y]);tX=t[0];for(i=0,ln=items.length;i<ln;i++){item=items[i];if(item||item===0){dist=Math.abs(item-tX);if(dist>foundDist){point=mat.transformPoint([items[foundDistInd],dataY[foundDistInd]]);return{item:{record:store.getData().items[foundDistInd],point:point,sprite:sprite},i:i,dist:Math.abs(point[0]-x),length:items.length};}
foundDist=dist;foundDistInd=i;}}
point=mat.transformPoint([items[foundDistInd],dataY[foundDistInd]]);foundItem={record:store.getData().items[foundDistInd],point:point,sprite:sprite};return{item:foundItem,dist:foundDist,i:items.length-1,length:items.length};},onMouseLeave:function(e){if(!this.hideStuffTask){this.hideStuffTask=new Ext.util.DelayedTask(this.hideVisibleStuff,this);}
this.hideStuffTask.delay(500);},hideVisibleStuff:function(){var me=this;if(me.updateTask){me.updateTask.cancel();}
if(me.markerSprite){me.markerSprite.hide();me.markerSprite.getSurface().renderFrame();}
if(me.xFieldLabel){me.xFieldLabel.hide();}
delete me.lastItem;if(me.labels){for(var i=0,ln=me.labels.length;i<ln;i++){me.labels[i].rendered&&me.labels[i].hide();}}
this.cancelHideStuffTask();},disable:function(){var me=this;if(me.disabled===true){return;}
if(me.updateTask){me.updateTask.cancel();}
me.chart.un({mousemove:me.onMouseMove,mouseleave:me.onMouseLeave,scope:me});me.hideVisibleStuff();me.disabled=true;},enable:function(){var me=this;if(me.disabled===true){me.disabled=false;me.initialize();}},destroy:function(){var me=this,i,ln;if(me.xFieldLabel){me.xFieldLabel.destroy();}
if(me.labels){for(i=0,ln=me.labels.length;i<ln;i++){me.labels[i].destroy();}}
this.callParent(arguments);}});
