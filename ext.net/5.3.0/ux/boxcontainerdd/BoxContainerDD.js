/*
 * @version   : 5.3.0 - Ext.NET License
 * @author    : Object.NET, Inc. https://object.net/
 * @date      : 2020-11-06
 * @copyright : Copyright (c) 2008-2020, Object.NET, Inc. (https://object.net/). All rights reserved.
 * @license   : See license.txt and https://ext.net/license/
 */


Ext.define('Ext.ux.dd.BoxContainerDD',{extend:'Ext.dd.DD',alignElWithMouse:function(el,iPageX,iPageY){var me=this,oCoord=me.getTargetCoord(iPageX,iPageY),x=oCoord.x,y=oCoord.y,fly=el.dom?el:Ext.fly(el,'_dd'),aCoord,newLeft,newTop;if(!me.deltaSetXY){aCoord=[Math.max(0,x),Math.max(0,y)];fly.setXY(aCoord);newLeft=me.getLocalX(fly);newTop=fly.getLocalY();me.deltaSetXY=[newLeft-x,newTop-y];}
else{me.setLocalXY(fly,Math.max(0,x+me.deltaSetXY[0]),Math.max(0,y+me.deltaSetXY[1]));}
me.cachePosition(x,y);me.autoScroll(x,y,el.offsetHeight,el.offsetWidth);return oCoord;}});
