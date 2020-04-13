/*
 * @version   : 5.2.0 - Ext.NET License
 * @author    : Object.NET, Inc. https://object.net/
 * @date      : 2020-04-13
 * @copyright : Copyright (c) 2008-2020, Object.NET, Inc. (https://object.net/). All rights reserved.
 * @license   : See license.txt and https://ext.net/license/.
 */


Ext.define('gh1543',{override:'Ext.chart.legend.SpriteLegend',performLayout:function(){var me=this,sprites=me.getSprites(),surface=me.getSurface(),surfaceRect=surface.getRect(),gap=4*me.getPadding(),i,sprite,bbox,rec,name;if(!surface||!surfaceRect){return false;}
var docked=me.getDocked(),surfaceWidth=surfaceRect[2],legendMaxWidth=surfaceWidth-gap,surfaceHeight=surfaceRect[3],bboxes=[];Ext.each(sprites,function(sprite){bboxes.push(sprite.getBBox());})
switch(docked){case'bottom':case'top':if(!surfaceWidth){return false;}
for(i=0;i<bboxes.length;i++){bbox=bboxes[i];sprite=sprites[i];while(bbox.width>legendMaxWidth){rec=sprite.getRecord();name=rec.get('name');name=name.substr(0,name.length-1);rec.set('name',name);if(name.length<1){Ext.Error.raise("Chart is way too narrow to draw any legend text at all.");}
sprite.getBBox();}}
break;}
return me.callParent(arguments);}});Ext.define('gh1606',{override:'Ext.chart.legend.SpriteLegend',isXType:function(){return false;}});

Ext.define('gh1486',{override:'Ext.chart.series.Cartesian',dataGapsHandling:false,getYRange:function(){var me=this;if(me.dataGapsHandling){return(me.dataRange[1]===null||me.dataRange[3]===null)?null:[me.dataRange[1],me.dataRange[3]];}else{return me.callParent(arguments);}},getRangeOfData:function(data,range){var me=this;if(me.dataGapsHandling){var i,length=data.length,value,min=range.min,max=range.max;for(i=0;i<length;i++){value=data[i];if(Ext.isNumeric(value)){if(value<min){min=value;}
if(value>max){max=value;}}}
range.min=min;range.max=max;}else{return me.callParent(arguments);}},coordinateData:function(items,field,axis){var me=this;if(me.dataGapsHandling){var data=this.callParent(arguments),lim=data.length,i;for(i=0;i<lim;i++){if(!Ext.isNumeric(data[i])){data[i]=NaN;}}
return data;}else{return me.callParent(arguments);}}});

Ext.define('gh1497',{override:'Ext.chart.series.Pie3D',coordinateX:function(){var me=this,retVal=me.callParent(arguments),chart=me.getChart();if(!chart.isConfiguring){chart.refreshLegendStore();};return retVal;}});Ext.define('gh1646',{override:'Ext.chart.series.Pie3D',getItemByIndex:function(idx){var me=this,sprites=me.getSprites(),spritesPerSlice=me.spritesPerSlice,result=null,store,records,hidden,sprite,topPartIndex;if(!sprites){return result;}
store=me.getStore();records=store.getData().items;hidden=me.getHidden();if(!hidden[idx]){topPartIndex=idx*spritesPerSlice;sprite=sprites[topPartIndex];if(sprite){result={series:me,sprite:sprites.slice(topPartIndex,topPartIndex+spritesPerSlice),index:idx,record:records[idx],category:'sprites',field:me.getXField()};}}
return result;}});
