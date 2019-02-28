/*
 * @version   : 4.8.0 - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2019-02-23
 * @copyright : Copyright (c) 2008-2019, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/.
 */


Ext.define('Ext.ux.colorpick.Selection', {
    mixinId: 'colorselection',

    
    config: {
        
        format: 'hex6',
        

        
        value: 'FF0000',

        
        color: null,
        previousColor: null,

        
        alphaDecimalFormat: '#.##'
    },

    applyColor: function(color) {
        var c = color;

        if (Ext.isString(c)) {
            c = Ext.ux.colorpick.ColorUtils.parseColor(color, this.getAlphaDecimalFormat());
        }

        return c;
    },

    applyFormat: function(format) {
        var formats = Ext.ux.colorpick.ColorUtils.formats;

        if (!formats.hasOwnProperty(format)) {
            //<debug>
            Ext.raise('The specified format "' + format + '" is invalid.');
            //</debug>

            return;
        }

        return format;
    },

    applyValue: function(color) {
        // Transform whatever incoming color we get to the proper format
        var c = Ext.ux.colorpick.ColorUtils.parseColor(
            color || '#000000', this.getAlphaDecimalFormat()
        );

        return this.formatColor(c);
    },

    formatColor: function(color) {
        return Ext.ux.colorpick.ColorUtils.formats[this.getFormat()](color);
    },

    updateColor: function(color) {
        var me = this;

        // If the "color" is changed (via internal changes in the UI), update "value" as
        // well. Since these are always tracking each other, we guard against the case
        // where we are being updated *because* "value" is being set.
        if (!me.syncing) {
            me.syncing = true;
            me.setValue(me.formatColor(color));
            me.syncing = false;
        }
    },

    updateValue: function(value, oldValue) {
        var me = this;

        // If the "value" is changed, update "color" as well. Since these are always
        // tracking each other, we guard against the case where we are being updated
        // *because* "color" is being set.
        if (!me.syncing) {
            me.syncing = true;
            me.setColor(value);
            me.syncing = false;
        }

        this.fireEvent('change', me, value, oldValue);
    }
});


Ext.define('Ext.ux.colorpick.ColorUtils', function(ColorUtils) {
    var oldIE = Ext.isIE && Ext.ieVersion < 10;

    return {
        singleton: true,

        constructor: function() {
            ColorUtils = this;
        },

        backgroundTpl: oldIE
            ? 'filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0, ' +
                'startColorstr=\'#{alpha}{hex}\', endColorstr=\'#{alpha}{hex}\');'
            : 'background: {rgba};',

        setBackground: oldIE
            ? function(el, color) {
                var tpl, data, bgStyle;

                if (el) {
                    tpl = Ext.XTemplate.getTpl(ColorUtils, 'backgroundTpl');
                    data = {
                        hex: ColorUtils.rgb2hex(color.r, color.g, color.b),
                        alpha: Math.floor(color.a * 255).toString(16)
                    };

                    bgStyle = tpl.apply(data);
                    el.applyStyles(bgStyle);
                }
            }
            : function(el, color) {
                var tpl, data, bgStyle;

                if (el) {
                    tpl = Ext.XTemplate.getTpl(ColorUtils, 'backgroundTpl');
                    data = {
                        rgba: ColorUtils.getRGBAString(color)
                    };

                    bgStyle = tpl.apply(data);
                    el.applyStyles(bgStyle);
                }
            },

        // parse and format functions under objects that match supported format config
        // values of the color picker; parse() methods receive the supplied color value
        // as a string (i.e "FFAAAA") and return an object form, just like the one
        // ColorPickerModel vm "selectedColor" uses. That same object form is used as a
        // parameter to the format() methods, where the appropriate string form is expected
        // for the return result
        formats: {
            // "RGB(100,100,100)"
            RGB: function(colorO) {
                return ColorUtils.getRGBString(colorO).toUpperCase();
            },

            // "RGBA(100,100,100,0.5)"
            RGBA: function(colorO) {
                return ColorUtils.getRGBAString(colorO).toUpperCase();
            },

            // "FFAA00"
            HEX6: function(colorO) {
                return ColorUtils.rgb2hex(colorO.r, colorO.g, colorO.b);
            },

            // "FFAA00FF" (last 2 are opacity)
            HEX8: function(colorO) {
                var hex = ColorUtils.rgb2hex(colorO.r, colorO.g, colorO.b),
                    opacityHex = Math.round(colorO.a * 255).toString(16);

                if (opacityHex.length < 2) {
                    hex += '0';
                }

                hex += opacityHex.toUpperCase();

                return hex;
            }
        },

        
        hexRe: /^#?(([0-9a-f]{8})|((?:[0-9a-f]{3}){1,2}))$/i,
        rgbaAltRe: /^rgba\(\s*([\w#\d]+)\s*,\s*([\d\.]+)\s*\)$/i,
        rgbaRe: /^rgba\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)$/i,
        rgbRe: /^rgb\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)$/i,
        

        
        parseColor: function(color, alphaFormat) {
            if (!color) {
                return null;
            }

            // eslint-disable-next-line vars-on-top
            var me = this,
                rgb = me.colorMap[color],
                match, ret, hsv;

            if (rgb) {
                ret = {
                    r: rgb[0],
                    g: rgb[1],
                    b: rgb[2],
                    a: 1
                };
            }
            else if (color === 'transparent') {
                ret = {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 0
                };
            }
            else {
                match = me.hexRe.exec(color);

                if (match) {
                    match = match[1]; // the captured hex

                    switch (match.length) {
                        default:
                            return null;

                        case 3:
                            ret = {
                                // double the number (e.g. 6 - > 66, a -> aa) and convert to decimal
                                r: parseInt(match[0] + match[0], 16),
                                g: parseInt(match[1] + match[1], 16),
                                b: parseInt(match[2] + match[2], 16),
                                a: 1
                            };
                            break;

                        case 6:
                        case 8:
                            ret = {
                                r: parseInt(match.substr(0, 2), 16),
                                g: parseInt(match.substr(2, 2), 16),
                                b: parseInt(match.substr(4, 2), 16),
                                a: parseInt(match.substr(6, 2) || 'ff', 16) / 255
                            };
                            break;
                    }
                }
                else {
                    match = me.rgbaRe.exec(color);

                    if (match) {
                        // proper css => rgba(r,g,b,a)
                        ret = {
                            r: parseFloat(match[1]),
                            g: parseFloat(match[2]),
                            b: parseFloat(match[3]),
                            a: parseFloat(match[4])
                        };
                    }
                    else {
                        match = me.rgbaAltRe.exec(color);

                        if (match) {
                            // scss shorthands = rgba(red, 0.4), rgba(#222, 0.9), rgba(#444433, 0.8)
                            ret = me.parseColor(match[1]);

                            // we have HSV filled in, so poke on "a" and we're done
                            ret.a = parseFloat(match[2]);

                            return ret;
                        }

                        match = me.rgbRe.exec(color);

                        if (match) {
                            ret = {
                                r: parseFloat(match[1]),
                                g: parseFloat(match[2]),
                                b: parseFloat(match[3]),
                                a: 1
                            };
                        }
                        else {
                            return null;
                        }
                    }
                }
            }

            // format alpha channel
            if (alphaFormat) {
                ret.a = Ext.util.Format.number(ret.a, alphaFormat);
            }

            hsv = this.rgb2hsv(ret.r, ret.g, ret.b);

            return Ext.apply(ret, hsv);
        },

        isValid: function(color) {
            return ColorUtils.parseColor(color) !== null;
        },

        
        getRGBAString: function(rgba) {
            return "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")";
        },

        
        getRGBString: function(rgb) {
            return "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
        },

        
        hsv2rgb: function(h, s, v) {
            h = h * 360;

            if (h === 360) {
                h = 0;
            }

            // eslint-disable-next-line vars-on-top
            var c = v * s,
                hprime = h / 60,
                x = c * (1 - Math.abs(hprime % 2 - 1)),
                rgb = [0, 0, 0],
                m;

            switch (Math.floor(hprime)) {
                case 0:
                    rgb = [c, x, 0];
                    break;

                case 1:
                    rgb = [x, c, 0];
                    break;

                case 2:
                    rgb = [0, c, x];
                    break;

                case 3:
                    rgb = [0, x, c];
                    break;

                case 4:
                    rgb = [x, 0, c];
                    break;

                case 5:
                    rgb = [c, 0, x];
                    break;

                default:
                    // <debug>
                    console.error("unknown color " + h + ' ' + s + " " + v);
                    // </debug>
                    break;
            }

            m = v - c;

            rgb[0] += m;
            rgb[1] += m;
            rgb[2] += m;

            rgb[0] = Math.round(rgb[0] * 255);
            rgb[1] = Math.round(rgb[1] * 255);
            rgb[2] = Math.round(rgb[2] * 255);

            return {
                r: rgb[0],
                g: rgb[1],
                b: rgb[2]
            };
        },

        
        rgb2hsv: function(r, g, b) {
            r = r / 255;
            g = g / 255;
            b = b / 255;

            // eslint-disable-next-line vars-on-top
            var M = Math.max(r, g, b),
                m = Math.min(r, g, b),
                c = M - m,
                hprime = 0,
                s = 0,
                h, v;

            if (c !== 0) {
                if (M === r) {
                    hprime = ((g - b) / c) % 6;
                }
                else if (M === g) {
                    hprime = ((b - r) / c) + 2;
                }
                else if (M === b) {
                    hprime = ((r - g) / c) + 4;
                }
            }

            h = hprime * 60;

            if (h === 360) {
                h = 0;
            }

            v = M;

            if (c !== 0) {
                s = c / v;
            }

            h = h / 360;

            if (h < 0) {
                h = h + 1;
            }

            return {
                h: h,
                s: s,
                v: v
            };
        },

        
        rgb2hex: function(r, g, b) {
            r = r.toString(16);
            g = g.toString(16);
            b = b.toString(16);

            if (r.length < 2) {
                r = '0' + r;
            }

            if (g.length < 2) {
                g = '0' + g;
            }

            if (b.length < 2) {
                b = '0' + b;
            }

            return (r + g + b).toUpperCase();
        },

        colorMap: {
            aliceblue: [240, 248, 255],
            antiquewhite: [250, 235, 215],
            aqua: [0, 255, 255],
            aquamarine: [127, 255, 212],
            azure: [240, 255, 255],
            beige: [245, 245, 220],
            bisque: [255, 228, 196],
            black: [0, 0, 0],
            blanchedalmond: [255, 235, 205],
            blue: [0, 0, 255],
            blueviolet: [138, 43, 226],
            brown: [165, 42, 42],
            burlywood: [222, 184, 135],
            cadetblue: [95, 158, 160],
            chartreuse: [127, 255, 0],
            chocolate: [210, 105, 30],
            coral: [255, 127, 80],
            cornflowerblue: [100, 149, 237],
            cornsilk: [255, 248, 220],
            crimson: [220, 20, 60],
            cyan: [0, 255, 255],
            darkblue: [0, 0, 139],
            darkcyan: [0, 139, 139],
            darkgoldenrod: [184, 132, 11],
            darkgray: [169, 169, 169],
            darkgreen: [0, 100, 0],
            darkgrey: [169, 169, 169],
            darkkhaki: [189, 183, 107],
            darkmagenta: [139, 0, 139],
            darkolivegreen: [85, 107, 47],
            darkorange: [255, 140, 0],
            darkorchid: [153, 50, 204],
            darkred: [139, 0, 0],
            darksalmon: [233, 150, 122],
            darkseagreen: [143, 188, 143],
            darkslateblue: [72, 61, 139],
            darkslategray: [47, 79, 79],
            darkslategrey: [47, 79, 79],
            darkturquoise: [0, 206, 209],
            darkviolet: [148, 0, 211],
            deeppink: [255, 20, 147],
            deepskyblue: [0, 191, 255],
            dimgray: [105, 105, 105],
            dimgrey: [105, 105, 105],
            dodgerblue: [30, 144, 255],
            firebrick: [178, 34, 34],
            floralwhite: [255, 255, 240],
            forestgreen: [34, 139, 34],
            fuchsia: [255, 0, 255],
            gainsboro: [220, 220, 220],
            ghostwhite: [248, 248, 255],
            gold: [255, 215, 0],
            goldenrod: [218, 165, 32],
            gray: [128, 128, 128],
            green: [0, 128, 0],
            greenyellow: [173, 255, 47],
            grey: [128, 128, 128],
            honeydew: [240, 255, 240],
            hotpink: [255, 105, 180],
            indianred: [205, 92, 92],
            indigo: [75, 0, 130],
            ivory: [255, 255, 240],
            khaki: [240, 230, 140],
            lavender: [230, 230, 250],
            lavenderblush: [255, 240, 245],
            lawngreen: [124, 252, 0],
            lemonchiffon: [255, 250, 205],
            lightblue: [173, 216, 230],
            lightcoral: [240, 128, 128],
            lightcyan: [224, 255, 255],
            lightgoldenrodyellow: [250, 250, 210],
            lightgray: [211, 211, 211],
            lightgreen: [144, 238, 144],
            lightgrey: [211, 211, 211],
            lightpink: [255, 182, 193],
            lightsalmon: [255, 160, 122],
            lightseagreen: [32, 178, 170],
            lightskyblue: [135, 206, 250],
            lightslategray: [119, 136, 153],
            lightslategrey: [119, 136, 153],
            lightsteelblue: [176, 196, 222],
            lightyellow: [255, 255, 224],
            lime: [0, 255, 0],
            limegreen: [50, 205, 50],
            linen: [250, 240, 230],
            magenta: [255, 0, 255],
            maroon: [128, 0, 0],
            mediumaquamarine: [102, 205, 170],
            mediumblue: [0, 0, 205],
            mediumorchid: [186, 85, 211],
            mediumpurple: [147, 112, 219],
            mediumseagreen: [60, 179, 113],
            mediumslateblue: [123, 104, 238],
            mediumspringgreen: [0, 250, 154],
            mediumturquoise: [72, 209, 204],
            mediumvioletred: [199, 21, 133],
            midnightblue: [25, 25, 112],
            mintcream: [245, 255, 250],
            mistyrose: [255, 228, 225],
            moccasin: [255, 228, 181],
            navajowhite: [255, 222, 173],
            navy: [0, 0, 128],
            oldlace: [253, 245, 230],
            olive: [128, 128, 0],
            olivedrab: [107, 142, 35],
            orange: [255, 165, 0],
            orangered: [255, 69, 0],
            orchid: [218, 112, 214],
            palegoldenrod: [238, 232, 170],
            palegreen: [152, 251, 152],
            paleturquoise: [175, 238, 238],
            palevioletred: [219, 112, 147],
            papayawhip: [255, 239, 213],
            peachpuff: [255, 218, 185],
            peru: [205, 133, 63],
            pink: [255, 192, 203],
            plum: [221, 160, 203],
            powderblue: [176, 224, 230],
            purple: [128, 0, 128],
            red: [255, 0, 0],
            rosybrown: [188, 143, 143],
            royalblue: [65, 105, 225],
            saddlebrown: [139, 69, 19],
            salmon: [250, 128, 114],
            sandybrown: [244, 164, 96],
            seagreen: [46, 139, 87],
            seashell: [255, 245, 238],
            sienna: [160, 82, 45],
            silver: [192, 192, 192],
            skyblue: [135, 206, 235],
            slateblue: [106, 90, 205],
            slategray: [119, 128, 144],
            slategrey: [119, 128, 144],
            snow: [255, 255, 250],
            springgreen: [0, 255, 127],
            steelblue: [70, 130, 180],
            tan: [210, 180, 140],
            teal: [0, 128, 128],
            thistle: [216, 191, 216],
            tomato: [255, 99, 71],
            turquoise: [64, 224, 208],
            violet: [238, 130, 238],
            wheat: [245, 222, 179],
            white: [255, 255, 255],
            whitesmoke: [245, 245, 245],
            yellow: [255, 255, 0],
            yellowgreen: [154, 205, 5]
        }
    };
}, function(ColorUtils) {
    var formats = ColorUtils.formats,
        lowerized = {};

    formats['#HEX6'] = function(color) {
        return '#' + formats.HEX6(color);
    };

    formats['#HEX8'] = function(color) {
        return '#' + formats.HEX8(color);
    };

    Ext.Object.each(formats, function(name, fn) {
        lowerized[name.toLowerCase()] = function(color) {
            var ret = fn(color);

            return ret.toLowerCase();
        };
    });

    Ext.apply(formats, lowerized);
});


Ext.define('Ext.ux.colorpick.ColorMapController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.colorpickercolormapcontroller',

    requires: [
        'Ext.ux.colorpick.ColorUtils'
    ],

    // After the component is rendered
    onFirstBoxReady: function() {
        var me = this,
            colorMap = me.getView(),
            dragHandle = colorMap.down('#dragHandle'),
            dd = dragHandle.dd;

        // configure draggable constraints
        dd.constrain = true;
        dd.constrainTo = colorMap.getEl();
        dd.initialConstrainTo = dd.constrainTo; // needed otheriwse error EXTJS-13187

        // event handlers
        dd.on('drag', Ext.bind(me.onHandleDrag, me));
        me.mon(colorMap.getEl(), {
            mousedown: me.onMouseDown,
            dragstart: me.onDragStart,
            scope: me
        });
    },

    // Fires when handle is dragged; propagates "handledrag" event on the ColorMap
    // with parameters "percentX" and "percentY", both 0-1, representing the handle
    // position on the color map, relative to the container
    onHandleDrag: function(componentDragger, e) {
        var me = this,
            container = me.getView(), // the Color Map
            dragHandle = container.down('#dragHandle'),
            x = dragHandle.getX() - container.getX(),
            y = dragHandle.getY() - container.getY(),
            containerEl = container.getEl(),
            containerWidth = containerEl.getWidth(),
            containerHeight = containerEl.getHeight(),
            xRatio = x / containerWidth,
            yRatio = y / containerHeight;

        // Adjust x/y ratios for dragger always being 1 pixel from the edge on the right
        if (xRatio > 0.99) {
            xRatio = 1;
        }

        if (yRatio > 0.99) {
            yRatio = 1;
        }

        container.fireEvent('handledrag', xRatio, yRatio);
    },

    // Whenever we mousedown over the colormap area
    onMouseDown: function(e) {
        var me = this,
            container = me.getView(),
            dragHandle = container.down('#dragHandle');

        // position drag handle accordingly
        dragHandle.setY(e.getY());
        dragHandle.setX(e.getX());
        me.onHandleDrag();

        // tie into the default dd mechanism
        dragHandle.dd.onMouseDown(e, dragHandle.dd.el);
    },

    // Whenever we start a drag over the colormap area
    onDragStart: function(e) {
        var me = this,
            container = me.getView(),
            dragHandle = container.down('#dragHandle');

        // tie into the default dd mechanism
        dragHandle.dd.onDragStart(e, dragHandle.dd.el);
    },

    // Whenever the map is clicked (but not the drag handle) we need to position
    // the drag handle to the point of click
    onMapClick: function(e) {
        var me = this,
            container = me.getView(), // the Color Map
            dragHandle = container.down('#dragHandle'),
            cXY = container.getXY(),
            eXY = e.getXY(),
            left, top;

        left = eXY[0] - cXY[0];
        top = eXY[1] - cXY[1];

        dragHandle.getEl().setStyle({
            left: left + 'px',
            top: top + 'px'
        });

        me.onHandleDrag();
    },

    // Whenever the underlying binding data is changed we need to
    // update position of the dragger; active drag state has been
    // accounted for earlier
    onColorBindingChanged: function(selectedColor) {
        var me = this,
            vm = me.getViewModel(),
            rgba = vm.get('selectedColor'),
            container = me.getView(), // the Color Map
            dragHandle = container.down('#dragHandle'),
            containerEl = container.getEl(),
            containerWidth = containerEl.getWidth(),
            containerHeight = containerEl.getHeight(),
            hsv, xRatio, yRatio, left, top;

        // Color map selection really only depends on saturation and value of the color
        hsv = Ext.ux.colorpick.ColorUtils.rgb2hsv(rgba.r, rgba.g, rgba.b);

        // x-axis of color map with value 0-1 translates to saturation
        xRatio = hsv.s;
        left = containerWidth * xRatio;

        // y-axis of color map with value 0-1 translates to reverse of "value"
        yRatio = 1 - hsv.v;
        top = containerHeight * yRatio;

        // Position dragger
        dragHandle.getEl().setStyle({
            left: left + 'px',
            top: top + 'px'
        });
    },

    // Whenever only Hue changes we can update the
    // background color of the color map
    // Param "hue" has value of 0-1
    onHueBindingChanged: function(hue) {
        var me = this,
            fullColorRGB,
            hex;

        fullColorRGB = Ext.ux.colorpick.ColorUtils.hsv2rgb(hue, 1, 1);
        hex = Ext.ux.colorpick.ColorUtils.rgb2hex(fullColorRGB.r, fullColorRGB.g, fullColorRGB.b);

        me.getView().getEl().applyStyles({ 'background-color': '#' + hex });
    }
});


Ext.define('Ext.ux.colorpick.ColorMap', {
    extend: 'Ext.container.Container',
    alias: 'widget.colorpickercolormap',
    controller: 'colorpickercolormapcontroller',

    requires: [
        'Ext.ux.colorpick.ColorMapController'
    ],

    cls: Ext.baseCSSPrefix + 'colorpicker-colormap',

    // This is the drag "circle"; note it's 1x1 in size to allow full
    // travel around the color map; the inner div has the bigger image
    items: [{
        xtype: 'component',
        cls: Ext.baseCSSPrefix + 'colorpicker-colormap-draghandle-container',
        itemId: 'dragHandle',
        width: 1,
        height: 1,
        draggable: true,
        html: '<div class="' + Ext.baseCSSPrefix + 'colorpicker-colormap-draghandle"></div>'
    }],

    listeners: {
        boxready: {
            single: true,
            fn: 'onFirstBoxReady',
            scope: 'controller'
        },
        colorbindingchanged: {
            fn: 'onColorBindingChanged',
            scope: 'controller'
        },
        huebindingchanged: {
            fn: 'onHueBindingChanged',
            scope: 'controller'
        }
    },

    afterRender: function() {
        var me = this,
            src = me.mapGradientUrl,
            el = me.el;

        me.callParent();

        if (!src) {
            // We do this trick to allow the Sass to calculate resource image path for
            // our package and pick up the proper image URL here.
            src = el.getStyle('background-image');
            src = src.substring(4, src.length - 1);  // strip off outer "url(...)"

            // In IE8 this path will have quotes around it
            if (src.indexOf('"') === 0) {
                src = src.substring(1, src.length - 1);
            }

            // Then remember it on our prototype for any subsequent instances.
            Ext.ux.colorpick.ColorMap.prototype.mapGradientUrl = src;
        }

        // Now clear that style because it will conflict with the background-color
        el.setStyle('background-image', 'none');

        // Create the image with transparent PNG with black and white gradient shades;
        // it blends with the background color (which changes with hue selection). This
        // must be an IMG in order to properly stretch to fit.
        el = me.layout.getElementTarget(); // the el for items and html
        el.createChild({
            tag: 'img',
            cls: Ext.baseCSSPrefix + 'colorpicker-colormap-blender',
            src: src
        });
    },

    // Called via data binding whenever selectedColor changes; fires "colorbindingchanged"
    setPosition: function(data) {
        var me = this,
            dragHandle = me.down('#dragHandle');

        // Too early in the render cycle? Skip event
        if (!dragHandle.dd || !dragHandle.dd.constrain) {
            return;
        }

        // User actively dragging? Skip event
        if (typeof dragHandle.dd.dragEnded !== 'undefined' && !dragHandle.dd.dragEnded) {
            return;
        }

        me.fireEvent('colorbindingchanged', data);
    },

    // Called via data binding whenever selectedColor.h changes; fires "huebindingchanged" event
    setHue: function(hue) {
        var me = this;

        // Too early in the render cycle? Skip event
        if (!me.getEl()) {
            return;
        }

        me.fireEvent('huebindingchanged', hue);
    }
});


Ext.define('Ext.ux.colorpick.SelectorModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.colorpick-selectormodel',

    requires: [
        'Ext.ux.colorpick.ColorUtils'
    ],

    data: {
        selectedColor: {
            r: 255,  // red
            g: 255,  // green
            b: 255,  // blue
            h: 0,    // hue,
            s: 1,    // saturation
            v: 1,    // value
            a: 1     // alpha (opacity)
        },
        previousColor: {
            r: 0,    // red
            g: 0,    // green
            b: 0,    // blue
            h: 0,    // hue,
            s: 1,    // saturation
            v: 1,    // value
            a: 1     // alpha (opacity)
        }
    },

    formulas: {
        // Hexadecimal representation of the color
        hex: {
            get: function(get) {
                var r = get('selectedColor.r').toString(16),
                    g = get('selectedColor.g').toString(16),
                    b = get('selectedColor.b').toString(16),
                    result;

                result = Ext.ux.colorpick.ColorUtils.rgb2hex(r, g, b);

                return '#' + result;
            },

            set: function(hex) {
                var rgb = Ext.ux.colorpick.ColorUtils.parseColor(hex);

                this.changeRGB(rgb);
            }
        },

        // "R" in "RGB"
        red: {
            get: function(get) {
                return get('selectedColor.r');
            },

            set: function(r) {
                this.changeRGB({ r: r });
            }
        },

        // "G" in "RGB"
        green: {
            get: function(get) {
                return get('selectedColor.g');
            },

            set: function(g) {
                this.changeRGB({ g: g });
            }
        },

        // "B" in "RGB"
        blue: {
            get: function(get) {
                return get('selectedColor.b');
            },

            set: function(b) {
                this.changeRGB({ b: b });
            }
        },

        // "H" in HSV
        hue: {
            get: function(get) {
                return get('selectedColor.h') * 360;
            },

            set: function(hue) {
                this.changeHSV({ h: hue / 360 });
            }
        },

        // "S" in HSV
        saturation: {
            get: function(get) {
                return get('selectedColor.s') * 100;
            },

            set: function(saturation) {
                this.changeHSV({ s: saturation / 100 });
            }
        },

        // "V" in HSV
        value: {
            get: function(get) {
                var v = get('selectedColor.v');

                return v * 100;
            },

            set: function(value) {
                this.changeHSV({ v: value / 100 });
            }
        },

        alpha: {
            get: function(data) {
                var a = data('selectedColor.a');

                return a * 100;
            },

            set: function(alpha) {
                this.set('selectedColor', Ext.applyIf({
                    a: alpha / 100
                }, this.data.selectedColor));
            }
        }
    }, // formulas

    changeHSV: function(hsv) {
        var rgb;

        Ext.applyIf(hsv, this.data.selectedColor);

        rgb = Ext.ux.colorpick.ColorUtils.hsv2rgb(hsv.h, hsv.s, hsv.v);

        hsv.r = rgb.r;
        hsv.g = rgb.g;
        hsv.b = rgb.b;

        this.set('selectedColor', hsv);
    },

    changeRGB: function(rgb) {
        var hsv;

        Ext.applyIf(rgb, this.data.selectedColor);

        hsv = Ext.ux.colorpick.ColorUtils.rgb2hsv(rgb.r, rgb.g, rgb.b);

        rgb.h = hsv.h;
        rgb.s = hsv.s;
        rgb.v = hsv.v;

        this.set('selectedColor', rgb);
    }
});


Ext.define('Ext.ux.colorpick.SelectorController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.colorpick-selectorcontroller',

    requires: [
        'Ext.ux.colorpick.ColorUtils'
    ],

    destroy: function() {
        var me = this,
            view = me.getView(),
            childViewModel = view.childViewModel;

        if (childViewModel) {
            childViewModel.destroy();
            view.childViewModel = null;
        }

        me.callParent();
    },

    changeHSV: function(hsv) {
        var view = this.getView(),
            color = view.getColor(),
            rgb;

        // Put in values we are not changing (like A, but also missing HSV values)
        Ext.applyIf(hsv, color);

        // Now that HSV is complete, recalculate RGB and combine them
        rgb = Ext.ux.colorpick.ColorUtils.hsv2rgb(hsv.h, hsv.s, hsv.v);
        Ext.apply(hsv, rgb);

        view.setColor(hsv);
    },

    // Updates Saturation/Value in the model based on ColorMap; params:
    // xPercent - where is the handle relative to the color map width
    // yPercent - where is the handle relative to the color map height
    onColorMapHandleDrag: function(xPercent, yPercent) {
        this.changeHSV({
            s: xPercent,
            v: 1 - yPercent
        });
    },

    // Updates HSV Value in the model and downstream RGB settings
    onValueSliderHandleDrag: function(yPercent) {
        this.changeHSV({
            v: 1 - yPercent
        });
    },

    // Updates HSV Saturation in the model and downstream RGB settings
    onSaturationSliderHandleDrag: function(yPercent) {
        this.changeHSV({
            s: 1 - yPercent
        });
    },

    // Updates Hue in the model and downstream RGB settings
    onHueSliderHandleDrag: function(yPercent) {
        this.changeHSV({
            h: 1 - yPercent
        });
    },

    onAlphaSliderHandleDrag: function(yPercent) {
        var view = this.getView(),
            color = view.getColor(),
            newColor = Ext.applyIf({
                a: 1 - yPercent
            }, color);

        view.setColor(newColor);
        view.el.repaint();
    },

    onPreviousColorSelected: function(comp, color) {
        var view = this.getView();

        view.setColor(color);
    },

    onOK: function() {
        var me = this,
            view = me.getView();

        view.fireEvent('ok', view, view.getValue());
    },

    onCancel: function() {
        this.fireViewEvent('cancel', this.getView());
    },

    onResize: function() {
        var me = this,
            view = me.getView(),
            vm = view.childViewModel,
            refs = me.getReferences(),
            h, s, v, a;

        // Skip initial rendering resize
        if (!me.hasResizedOnce) {
            me.hasResizedOnce = true;

            return;
        }

        h = vm.get('hue');
        s = vm.get('saturation');
        v = vm.get('value');
        a = vm.get('alpha');
        // Reposition the colormap's & sliders' drag handles
        refs.colorMap.setPosition(vm.getData());
        refs.hueSlider.setHue(h);
        refs.satSlider.setSaturation(s);
        refs.valueSlider.setValue(v);
        refs.alphaSlider.setAlpha(a);
    }
});


Ext.define('Ext.ux.colorpick.ColorPreview', {
    extend: 'Ext.Component',
    alias: 'widget.colorpickercolorpreview',

    requires: [
        'Ext.util.Format',
        'Ext.XTemplate'
    ],

    // hack to solve issue with IE, when applying a filter the click listener is not being fired.
    style: 'position: relative',

    
    html: '<div class="' + Ext.baseCSSPrefix + 'colorpreview-filter" style="height:100%; width:100%; position: absolute;"></div>' +
          '<a class="btn" style="height:100%; width:100%; position: absolute;"></a>',
    
    // eo hack

    cls: Ext.baseCSSPrefix + 'colorpreview',

    height: 256,

    onRender: function() {
        var me = this;

        me.callParent(arguments);

        me.mon(me.el.down('.btn'), 'click', me.onClick, me);
    },

    onClick: function() {
        this.fireEvent('click', this, this.color);
    },

    // Called via databinding - update background color whenever ViewModel changes
    setColor: function(color) {
        var me = this,
            el = me.getEl();

        // Too early in rendering cycle; skip
        if (!el) {
            return;
        }

        me.color = color;

        me.applyBgStyle(color);
    },

    bgStyleTpl: Ext.create(
        'Ext.XTemplate',
        Ext.isIE && Ext.ieVersion < 10
            // eslint-disable-next-line max-len
            ? 'filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=\'#{hexAlpha}{hex}\', endColorstr=\'#{hexAlpha}{hex}\');' 
            : 'background: {rgba};'
    ),

    applyBgStyle: function(color) {
        var me = this,
            colorUtils = Ext.ux.colorpick.ColorUtils,
            filterSelector = '.' + Ext.baseCSSPrefix + 'colorpreview-filter',
            el = me.getEl().down(filterSelector),
            hex, alpha, rgba, bgStyle;

        hex = colorUtils.rgb2hex(color.r, color.g, color.b);
        alpha = Ext.util.Format.hex(Math.floor(color.a * 255), 2);
        rgba = colorUtils.getRGBAString(color);
        bgStyle = this.bgStyleTpl.apply({ hex: hex, hexAlpha: alpha, rgba: rgba });

        el.applyStyles(bgStyle);
    }
});


Ext.define('Ext.ux.colorpick.SliderController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.colorpick-slidercontroller',

    // After the component is rendered
    boxReady: function(view) {
        var me = this,
            container = me.getDragContainer(),
            dragHandle = me.getDragHandle(),
            dd = dragHandle.dd;

        // configure draggable constraints
        dd.constrain = true;
        dd.constrainTo = container.getEl();
        dd.initialConstrainTo = dd.constrainTo; // needed otherwise error EXTJS-13187

        // event handlers
        dd.on('drag', me.onHandleDrag, me);
    },

    getDragHandle: function() {
        return this.view.lookupReference('dragHandle');
    },

    getDragContainer: function() {
        return this.view.lookupReference('dragHandleContainer');
    },

    // Fires when handle is dragged; fires "handledrag" event on the slider
    // with parameter  "percentY" 0-1, representing the handle position on the slider
    // relative to the height
    onHandleDrag: function(e) {
        var me = this,
            view = me.getView(),
            container = me.getDragContainer(),
            dragHandle = me.getDragHandle(),
            y = dragHandle.getY() - container.getY(),
            containerEl = container.getEl(),
            containerHeight = containerEl.getHeight(),
            yRatio = y / containerHeight;

        // Adjust y ratio for dragger always being 1 pixel from the edge on the bottom
        if (yRatio > 0.99) {
            yRatio = 1;
        }

        view.fireEvent('handledrag', yRatio);
    },

    // Whenever we mousedown over the slider area
    onMouseDown: function(e) {
        var me = this,
            dragHandle = me.getDragHandle(),
            y = e.getY();

        // position drag handle accordingly
        dragHandle.setY(y);
        me.onHandleDrag();

        dragHandle.el.repaint();
        // tie into the default dd mechanism
        dragHandle.dd.onMouseDown(e, dragHandle.dd.el);
    },

    // Whenever we start a drag over the colormap area
    onDragStart: function(e) {
        var me = this,
            dragHandle = me.getDragHandle();

        // tie into the default dd mechanism
        dragHandle.dd.onDragStart(e, dragHandle.dd.el);
    },

    onMouseUp: function() {
        var dragHandle = this.getDragHandle();

        dragHandle.dd.dragEnded = true; // work around DragTracker bug
    }
});


Ext.define('Ext.ux.colorpick.Slider', {
    extend: 'Ext.container.Container',
    xtype: 'colorpickerslider',
    controller: 'colorpick-slidercontroller',

    afterRender: function() {
        var width, dragCt, dragWidth;

        this.callParent(arguments);

        width = this.width;
        dragCt = this.lookupReference('dragHandleContainer');
        dragWidth = dragCt.getWidth();

        dragCt.el.setStyle('left', ((width - dragWidth) / 2) + 'px');
    },

    baseCls: Ext.baseCSSPrefix + 'colorpicker-slider',

    requires: [
        'Ext.ux.colorpick.SliderController'
    ],

    referenceHolder: true,

    listeners: {
        element: 'el',
        mousedown: 'onMouseDown',
        mouseup: 'onMouseUp',
        dragstart: 'onDragStart'
    },

    // Container for the drag handle; needed since the slider
    // is of static size, while the parent container positions
    // it in the center; this is what receives the beautiful
    // color gradients for the visual
    items: {
        xtype: 'container',
        cls: Ext.baseCSSPrefix + 'colorpicker-draghandle-container',
        reference: 'dragHandleContainer',
        height: '100%',

        // This is the drag handle; note it's 100%x1 in size to allow full
        // vertical drag travel; the inner div has the bigger image
        items: {
            xtype: 'component',
            cls: Ext.baseCSSPrefix + 'colorpicker-draghandle-outer',
            reference: 'dragHandle',
            width: '100%',
            height: 1,
            draggable: true,
            html: '<div class="' + Ext.baseCSSPrefix + 'colorpicker-draghandle"></div>'
        }
    },

    // <debug>
    // Called via data binding whenever selectedColor.h changes;
    setHue: function() {
        Ext.raise('Must implement setHue() in a child class!');
    },
    // </debug>

    getDragHandle: function() {
        return this.lookupReference('dragHandle');
    },

    getDragContainer: function() {
        return this.lookupReference('dragHandleContainer');
    }
});


Ext.define('Ext.ux.colorpick.SliderAlpha', {
    extend: 'Ext.ux.colorpick.Slider',
    alias: 'widget.colorpickerslideralpha',
    cls: Ext.baseCSSPrefix + 'colorpicker-alpha',

    requires: [
        'Ext.XTemplate'
    ],

    
    gradientStyleTpl: Ext.create(
        'Ext.XTemplate',
        Ext.isIE && Ext.ieVersion < 10
            ? 'filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=\'#FF{hex}\', endColorstr=\'#00{hex}\');' 
            : 'background: -moz-linear-gradient(top, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' +   
              'background: -webkit-linear-gradient(top,rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' + 
              'background: -o-linear-gradient(top, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' +      
              'background: -ms-linear-gradient(top, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);' +     
              'background: linear-gradient(to bottom, rgba({r}, {g}, {b}, 1) 0%, rgba({r}, {g}, {b}, 0) 100%);'     
    ),
    

    // Called via data binding whenever selectedColor.a changes; param is 0-100
    setAlpha: function(value) {
        var me = this,
            container = me.getDragContainer(),
            dragHandle = me.getDragHandle(),
            containerEl = container.getEl(),
            containerHeight = containerEl.getHeight(),
            el, top;

        // Too early in the render cycle? Skip event
        if (!dragHandle.dd || !dragHandle.dd.constrain) {
            return;
        }

        // User actively dragging? Skip event
        if (typeof dragHandle.dd.dragEnded !== 'undefined' && !dragHandle.dd.dragEnded) {
            return;
        }

        // y-axis of slider with value 0-1 translates to reverse of "value"
        top = containerHeight * (1 - (value / 100));

        // Position dragger
        el = dragHandle.getEl();
        el.setStyle({
            top: top + 'px'
        });
    },

    // Called via data binding whenever selectedColor.h changes; hue param is 0-1
    setColor: function(color) {
        var me = this,
            container = me.getDragContainer(),
            hex, el;

        // Too early in the render cycle? Skip event
        if (!me.getEl()) {
            return;
        }

        // Determine HEX for new hue and set as background based on template
        hex = Ext.ux.colorpick.ColorUtils.rgb2hex(color.r, color.g, color.b);

        el = container.getEl().first();
        el.applyStyles(me.gradientStyleTpl.apply({ hex: hex, r: color.r, g: color.g, b: color.b }));
    }
});


Ext.define('Ext.ux.colorpick.SliderSaturation', {
    extend: 'Ext.ux.colorpick.Slider',
    alias: 'widget.colorpickerslidersaturation',
    cls: Ext.baseCSSPrefix + 'colorpicker-saturation',

    
    gradientStyleTpl: Ext.create(
        'Ext.XTemplate',
        Ext.isIE && Ext.ieVersion < 10
            ? 'filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=\'#{hex}\', endColorstr=\'#ffffff\');' 
            : 'background: -mox-linear-gradient(top, #{hex} 0%, #ffffff 100%);' +   
              'background: -webkit-linear-gradient(top, #{hex} 0%,#ffffff 100%);' + 
              'background: -o-linear-gradient(top, #{hex} 0%,#ffffff 100%);' +      
              'background: -ms-linear-gradient(top, #{hex} 0%,#ffffff 100%);' +     
              'background: linear-gradient(to bottom, #{hex} 0%,#ffffff 100%);'     
    ),
    

    // Called via data binding whenever selectedColor.s changes; saturation param is 0-100
    setSaturation: function(saturation) {
        var me = this,
            container = me.getDragContainer(),
            dragHandle = me.getDragHandle(),
            containerEl = container.getEl(),
            containerHeight = containerEl.getHeight(),
            yRatio,
            top;

        // Too early in the render cycle? Skip event
        if (!dragHandle.dd || !dragHandle.dd.constrain) {
            return;
        }

        // User actively dragging? Skip event
        if (typeof dragHandle.dd.dragEnded !== 'undefined' && !dragHandle.dd.dragEnded) {
            return;
        }

        // y-axis of slider with value 0-1 translates to reverse of "saturation"
        yRatio = 1 - (saturation / 100);
        top = containerHeight * yRatio;

        // Position dragger
        dragHandle.getEl().setStyle({
            top: top + 'px'
        });
    },

    // Called via data binding whenever selectedColor.h changes; hue param is 0-1
    setHue: function(hue) {
        var me = this,
            container = me.getDragContainer(),
            rgb, hex;

        // Too early in the render cycle? Skip event
        if (!me.getEl()) {
            return;
        }

        // Determine HEX for new hue and set as background based on template
        rgb = Ext.ux.colorpick.ColorUtils.hsv2rgb(hue, 1, 1);
        hex = Ext.ux.colorpick.ColorUtils.rgb2hex(rgb.r, rgb.g, rgb.b);
        container.getEl().applyStyles(me.gradientStyleTpl.apply({ hex: hex }));
    }
});


Ext.define('Ext.ux.colorpick.SliderValue', {
    extend: 'Ext.ux.colorpick.Slider',
    alias: 'widget.colorpickerslidervalue',
    cls: Ext.baseCSSPrefix + 'colorpicker-value',

    requires: [
        'Ext.XTemplate'
    ],

    
    gradientStyleTpl: Ext.create(
        'Ext.XTemplate',
        Ext.isIE && Ext.ieVersion < 10
            ? 'filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0, startColorstr=\'#{hex}\', endColorstr=\'#000000\');' 
            : 'background: -mox-linear-gradient(top, #{hex} 0%, #000000 100%);' +   
          'background: -webkit-linear-gradient(top, #{hex} 0%,#000000 100%);' + 
          'background: -o-linear-gradient(top, #{hex} 0%,#000000 100%);' +      
          'background: -ms-linear-gradient(top, #{hex} 0%,#000000 100%);' +     
          'background: linear-gradient(to bottom, #{hex} 0%,#000000 100%);'     
    ),
    

    // Called via data binding whenever selectedColor.v changes; value param is 0-100
    setValue: function(value) {
        var me = this,
            container = me.getDragContainer(),
            dragHandle = me.getDragHandle(),
            containerEl = container.getEl(),
            containerHeight = containerEl.getHeight(),
            yRatio,
            top;

        // Too early in the render cycle? Skip event
        if (!dragHandle.dd || !dragHandle.dd.constrain) {
            return;
        }

        // User actively dragging? Skip event
        if (typeof dragHandle.dd.dragEnded !== 'undefined' && !dragHandle.dd.dragEnded) {
            return;
        }

        // y-axis of slider with value 0-1 translates to reverse of "value"
        yRatio = 1 - (value / 100);
        top = containerHeight * yRatio;

        // Position dragger
        dragHandle.getEl().setStyle({
            top: top + 'px'
        });
    },

    // Called via data binding whenever selectedColor.h changes; hue param is 0-1
    setHue: function(hue) {
        var me = this,
            container = me.getDragContainer(),
            rgb, hex;

        // Too early in the render cycle? Skip event
        if (!me.getEl()) {
            return;
        }

        // Determine HEX for new hue and set as background based on template
        rgb = Ext.ux.colorpick.ColorUtils.hsv2rgb(hue, 1, 1);
        hex = Ext.ux.colorpick.ColorUtils.rgb2hex(rgb.r, rgb.g, rgb.b);
        container.getEl().applyStyles(me.gradientStyleTpl.apply({ hex: hex }));
    }
});


Ext.define('Ext.ux.colorpick.SliderHue', {
    extend: 'Ext.ux.colorpick.Slider',
    alias: 'widget.colorpickersliderhue',
    cls: Ext.baseCSSPrefix + 'colorpicker-hue',

    afterRender: function() {
        var me = this,
            src = me.gradientUrl,
            el = me.el;

        me.callParent();

        if (!src) {
            // We do this trick to allow the Sass to calculate resource image path for
            // our package and pick up the proper image URL here.
            src = el.getStyle('background-image');
            src = src.substring(4, src.length - 1);  // strip off outer "url(...)"

            // In IE8 this path will have quotes around it
            if (src.indexOf('"') === 0) {
                src = src.substring(1, src.length - 1);
            }

            // Then remember it on our prototype for any subsequent instances.
            Ext.ux.colorpick.SliderHue.prototype.gradientUrl = src;
        }

        // Now clear that style because it will conflict with the background-color
        el.setStyle('background-image', 'none');

        // Create the image with the background PNG
        el = me.getDragContainer().layout.getElementTarget(); // the el for items and html
        el.createChild({
            tag: 'img',
            cls: Ext.baseCSSPrefix + 'colorpicker-hue-gradient',
            src: src
        });
    },


    // Called via data binding whenever selectedColor.h changes; hue param is 0-1
    setHue: function(hue) {
        var me = this,
            container = me.getDragContainer(),
            dragHandle = me.getDragHandle(),
            containerEl = container.getEl(),
            containerHeight = containerEl.getHeight(),
            el, top;

        // Too early in the render cycle? Skip event
        if (!dragHandle.dd || !dragHandle.dd.constrain) {
            return;
        }

        // User actively dragging? Skip event
        if (typeof dragHandle.dd.dragEnded !== 'undefined' && !dragHandle.dd.dragEnded) {
            return;
        }

        // y-axis of slider with value 0-1 translates to reverse of "hue"
        top = containerHeight * (1 - hue);

        // Position dragger
        el = dragHandle.getEl();
        el.setStyle({
            top: top + 'px'
        });
    }
});


Ext.define('Ext.ux.colorpick.Selector', {
    extend: 'Ext.container.Container',
    xtype: 'colorselector',

    mixins: [
        'Ext.ux.colorpick.Selection'
    ],

    controller: 'colorpick-selectorcontroller',

    requires: [
        'Ext.layout.container.HBox',
        'Ext.form.field.Text',
        'Ext.form.field.Number',
        'Ext.ux.colorpick.ColorMap',
        'Ext.ux.colorpick.SelectorModel',
        'Ext.ux.colorpick.SelectorController',
        'Ext.ux.colorpick.ColorPreview',
        'Ext.ux.colorpick.Slider',
        'Ext.ux.colorpick.SliderAlpha',
        'Ext.ux.colorpick.SliderSaturation',
        'Ext.ux.colorpick.SliderValue',
        'Ext.ux.colorpick.SliderHue'
    ],

    config: {
        hexReadOnly: true
    },

    width: 580, // default width and height gives 255x255 color map in Crisp
    height: 337,

    cls: Ext.baseCSSPrefix + 'colorpicker',
    padding: 10,

    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    defaultBindProperty: 'value',
    twoWayBindable: [
        'value'
    ],

    
    fieldWidth: 50,

    
    fieldPad: 5,

    
    showPreviousColor: false,

    
    showOkCancelButtons: false,

    

    

    

    listeners: {
        resize: 'onResize'
    },

    constructor: function(config) {
        var me = this,
            childViewModel = Ext.Factory.viewModel('colorpick-selectormodel');

        // Since this component needs to present its value as a thing to which users can
        // bind, we create an internal VM for our purposes.
        me.childViewModel = childViewModel;
        me.items = [
            me.getMapAndHexRGBFields(childViewModel),
            me.getSliderAndHField(childViewModel),
            me.getSliderAndSField(childViewModel),
            me.getSliderAndVField(childViewModel),
            me.getSliderAndAField(childViewModel),
            me.getPreviewAndButtons(childViewModel, config)
        ];

        me.childViewModel.bind('{selectedColor}', function(color) {
            me.setColor(color);
        });

        me.callParent([config]);
    },

    updateColor: function(color) {
        var me = this;

        me.mixins.colorselection.updateColor.call(me, color);

        me.childViewModel.set('selectedColor', color);
    },

    updatePreviousColor: function(color) {
        this.childViewModel.set('previousColor', color);
    },

    // Splits up view declaration for readability
    // "Map" and HEX/R/G/B fields
    getMapAndHexRGBFields: function(childViewModel) {
        var me = this,
            fieldMargin = { top: 0, right: me.fieldPad, bottom: 0, left: 0 },
            fieldWidth = me.fieldWidth;

        return {
            xtype: 'container',
            viewModel: childViewModel,
            cls: Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            flex: 1,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            margin: '0 10 0 0',
            items: [
                // "MAP"
                {
                    xtype: 'colorpickercolormap',
                    reference: 'colorMap',
                    flex: 1,
                    bind: {
                        position: {
                            bindTo: '{selectedColor}',
                            deep: true
                        },
                        hue: '{selectedColor.h}'
                    },
                    listeners: {
                        handledrag: 'onColorMapHandleDrag'
                    }
                },
                // HEX/R/G/B FIELDS
                {
                    xtype: 'container',
                    layout: 'hbox',

                    defaults: {
                        labelAlign: 'top',
                        labelSeparator: '',
                        allowBlank: false,

                        onChange: function() {
                            // prevent data binding propagation if bad value
                            if (this.isValid()) {
                                // this is kind of dirty and ideally we would extend these fields
                                // and override the method, but works for now
                                Ext.form.field.Base.prototype.onChange.apply(this, arguments);
                            }
                        }
                    },

                    items: [{
                        xtype: 'textfield',
                        fieldLabel: 'HEX',
                        flex: 1,
                        bind: '{hex}',
                        margin: fieldMargin,
                        regex: /^#[0-9a-f]{6}$/i,
                        readonly: me.getHexReadOnly()
                    }, {
                        xtype: 'numberfield',
                        fieldLabel: 'R',
                        bind: '{red}',
                        width: fieldWidth,
                        hideTrigger: true,
                        maxValue: 255,
                        minValue: 0,
                        margin: fieldMargin
                    }, {
                        xtype: 'numberfield',
                        fieldLabel: 'G',
                        bind: '{green}',
                        width: fieldWidth,
                        hideTrigger: true,
                        maxValue: 255,
                        minValue: 0,
                        margin: fieldMargin
                    }, {
                        xtype: 'numberfield',
                        fieldLabel: 'B',
                        bind: '{blue}',
                        width: fieldWidth,
                        hideTrigger: true,
                        maxValue: 255,
                        minValue: 0,
                        margin: 0
                    }]
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and H field
    getSliderAndHField: function(childViewModel) {
        var me = this,
            fieldWidth = me.fieldWidth;

        return {
            xtype: 'container',
            viewModel: childViewModel,
            cls: Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width: fieldWidth,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [
                {
                    xtype: 'colorpickersliderhue',
                    reference: 'hueSlider',
                    flex: 1,
                    bind: {
                        hue: '{selectedColor.h}'
                    },
                    width: fieldWidth,
                    listeners: {
                        handledrag: 'onHueSliderHandleDrag'
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: 'H',
                    labelAlign: 'top',
                    labelSeparator: '',
                    bind: '{hue}',
                    hideTrigger: true,
                    maxValue: 360,
                    minValue: 0,
                    allowBlank: false,
                    margin: 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and S field
    getSliderAndSField: function(childViewModel) {
        var me = this,
            fieldWidth = me.fieldWidth;

        return {
            xtype: 'container',
            viewModel: childViewModel,
            cls: Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width: fieldWidth,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            margin: {
                right: me.fieldPad,
                left: me.fieldPad
            },
            items: [
                {
                    xtype: 'colorpickerslidersaturation',
                    reference: 'satSlider',
                    flex: 1,
                    bind: {
                        saturation: '{saturation}',
                        hue: '{selectedColor.h}'
                    },
                    width: fieldWidth,
                    listeners: {
                        handledrag: 'onSaturationSliderHandleDrag'
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: 'S',
                    labelAlign: 'top',
                    labelSeparator: '',
                    bind: '{saturation}',
                    hideTrigger: true,
                    maxValue: 100,
                    minValue: 0,
                    allowBlank: false,
                    margin: 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and V field
    getSliderAndVField: function(childViewModel) {
        var me = this,
            fieldWidth = me.fieldWidth;

        return {
            xtype: 'container',
            viewModel: childViewModel,
            cls: Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width: fieldWidth,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [
                {
                    xtype: 'colorpickerslidervalue',
                    reference: 'valueSlider',
                    flex: 1,
                    bind: {
                        value: '{value}',
                        hue: '{selectedColor.h}'
                    },
                    width: fieldWidth,
                    listeners: {
                        handledrag: 'onValueSliderHandleDrag'
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: 'V',
                    labelAlign: 'top',
                    labelSeparator: '',
                    bind: '{value}',
                    hideTrigger: true,
                    maxValue: 100,
                    minValue: 0,
                    allowBlank: false,
                    margin: 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Slider and A field
    getSliderAndAField: function(childViewModel) {
        var me = this,
            fieldWidth = me.fieldWidth;

        return {
            xtype: 'container',
            viewModel: childViewModel,
            cls: Ext.baseCSSPrefix + 'colorpicker-escape-overflow',
            width: fieldWidth,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            margin: {
                left: me.fieldPad
            },
            items: [
                {
                    xtype: 'colorpickerslideralpha',
                    reference: 'alphaSlider',
                    flex: 1,
                    bind: {
                        alpha: '{alpha}',
                        color: {
                            bindTo: '{selectedColor}',
                            deep: true
                        }
                    },
                    width: fieldWidth,
                    listeners: {
                        handledrag: 'onAlphaSliderHandleDrag'
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: 'A',
                    labelAlign: 'top',
                    labelSeparator: '',
                    bind: '{alpha}',
                    hideTrigger: true,
                    maxValue: 100,
                    minValue: 0,
                    allowBlank: false,
                    margin: 0
                }
            ]
        };
    },

    // Splits up view declaration for readability
    // Preview current/previous color squares and OK and Cancel buttons
    getPreviewAndButtons: function(childViewModel, config) {
        // selected color preview is always shown
        var items = [{
            xtype: 'colorpickercolorpreview',
            flex: 1,
            bind: {
                color: {
                    bindTo: '{selectedColor}',
                    deep: true
                }
            }
        }];

        // previous color preview is optional
        if (config.showPreviousColor) {
            items.push({
                xtype: 'colorpickercolorpreview',
                flex: 1,
                bind: {
                    color: {
                        bindTo: '{previousColor}',
                        deep: true
                    }
                },
                listeners: {
                    click: 'onPreviousColorSelected'
                }
            });
        }

        // Ok/Cancel buttons are optional
        if (config.showOkCancelButtons) {
            items.push({
                xtype: 'button',
                text: 'OK',
                margin: '10 0 0 0',
                padding: '10 0 10 0',
                handler: 'onOK'
            },
                       {
                           xtype: 'button',
                           text: 'Cancel',
                           margin: '10 0 0 0',
                           padding: '10 0 10 0',
                           handler: 'onCancel'
                       });
        }

        return {
            xtype: 'container',
            viewModel: childViewModel,
            width: 70,
            margin: '0 0 0 10',
            items: items,
            layout: {
                type: 'vbox',
                align: 'stretch'
            }
        };
    }
});


Ext.define('Ext.ux.colorpick.ButtonController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.colorpick-buttoncontroller',

    requires: [
        'Ext.window.Window',
        'Ext.layout.container.Fit',
        'Ext.ux.colorpick.Selector',
        'Ext.ux.colorpick.ColorUtils'
    ],

    afterRender: function(view) {
        view.updateColor(view.getColor());
    },

    destroy: function() {
        var view = this.getView(),
            colorPickerWindow = view.colorPickerWindow;

        if (colorPickerWindow) {
            colorPickerWindow.destroy();
            view.colorPickerWindow = view.colorPicker = null;
        }

        this.callParent();
    },

    getPopup: function() {
        var view = this.getView(),
            popup = view.colorPickerWindow,
            selector;

        if (!popup) {
            popup = Ext.create(view.getPopup());

            view.colorPickerWindow = popup;
            popup.colorPicker = view.colorPicker = selector = popup.lookupReference('selector');
            selector.setFormat(view.getFormat());
            selector.on({
                ok: 'onColorPickerOK',
                cancel: 'onColorPickerCancel',
                scope: this
            });

            popup.on({
                close: 'onColorPickerCancel',
                scope: this
            });
        }

        return popup;
    },

    // When button is clicked show the color picker window
    onClick: function() {
        var me = this,
            view = me.getView(),
            color = view.getColor(),
            popup = me.getPopup(),
            colorPicker = popup.colorPicker;

        colorPicker.setColor(color);
        colorPicker.setPreviousColor(color);

        popup.showBy(view, 'tl-br?');
    },

    onColorPickerOK: function(picker) {
        var view = this.getView(),
            color = picker.getColor(),
            cpWin = view.colorPickerWindow;

        cpWin.hide();

        view.setColor(color);
    },

    onColorPickerCancel: function() {
        var view = this.getView(),
            cpWin = view.colorPickerWindow;

        cpWin.hide();
    },

    syncColor: function(color) {
        var view = this.getView();

        Ext.ux.colorpick.ColorUtils.setBackground(view.filterEl, color);
    }
});


Ext.define('Ext.ux.colorpick.Button', {
    extend: 'Ext.Component',
    xtype: 'colorbutton',

    controller: 'colorpick-buttoncontroller',

    mixins: [
        'Ext.ux.colorpick.Selection'
    ],

    requires: [
        'Ext.ux.colorpick.ButtonController'
    ],

    baseCls: Ext.baseCSSPrefix + 'colorpicker-button',

    width: 20,
    height: 20,

    childEls: [
        'btnEl', 'filterEl'
    ],

    config: {
        
        popup: {
            lazy: true,
            $value: {
                xtype: 'window',
                closeAction: 'hide',
                referenceHolder: true,
                minWidth: 540,
                minHeight: 200,
                layout: 'fit',
                header: false,
                resizable: true,
                items: {
                    xtype: 'colorselector',
                    reference: 'selector',
                    showPreviousColor: true,
                    showOkCancelButtons: true
                }
            }
        }
    },

    defaultBindProperty: 'value',
    twoWayBindable: 'value',

    
    // Solve issue with IE, when applying a filter the click listener is not being fired.
    renderTpl:
        '<div id="{id}-filterEl" data-ref="filterEl" style="height:100%; width:100%; position: absolute;"></div>' +
        '<a id="{id}-btnEl" data-ref="btnEl" style="height:100%; width:100%; position: absolute;"></a>',
    

    listeners: {
        click: 'onClick',
        element: 'btnEl'
    },

    

    updateColor: function(color) {
        var me = this,
            cp = me.colorPicker;

        me.mixins.colorselection.updateColor.call(me, color);

        Ext.ux.colorpick.ColorUtils.setBackground(me.filterEl, color);

        if (cp) {
            cp.setColor(color);
        }
    },

    // Sets this.format and color picker's setFormat()
    updateFormat: function(format) {
        var cp = this.colorPicker;

        if (cp) {
            cp.setFormat(format);
        }
    }
});


Ext.define('Ext.ux.colorpick.Field', {
    extend: 'Ext.form.field.Picker',
    xtype: 'colorfield',

    mixins: [
        'Ext.ux.colorpick.Selection'
    ],

    requires: [
        'Ext.window.Window',
        'Ext.ux.colorpick.Selector',
        'Ext.ux.colorpick.ColorUtils',
        'Ext.layout.container.Fit'
    ],

    editable: false,

    matchFieldWidth: false, // picker is usually wider than field

    // "Color Swatch" shown on the left of the field
    beforeBodyEl: [
        '<div class="' + Ext.baseCSSPrefix + 'colorpicker-field-swatch">' +
            '<div id="{id}-swatchEl" data-ref="swatchEl" class="' + Ext.baseCSSPrefix +
                    'colorpicker-field-swatch-inner"></div>' +
        '</div>'
    ],

    cls: Ext.baseCSSPrefix + 'colorpicker-field',
    childEls: [
        'swatchEl'
    ],
    checkChangeEvents: ['change'],

    config: {
        
        popup: {
            lazy: true,
            $value: {
                xtype: 'window',
                closeAction: 'hide',
                referenceHolder: true,
                minWidth: 540,
                minHeight: 200,
                layout: 'fit',
                header: false,
                resizable: true,
                items: {
                    xtype: 'colorselector',
                    reference: 'selector',
                    showPreviousColor: true,
                    showOkCancelButtons: true
                }
            }
        }
    },

    

    initComponent: function() {
        var me = this;

        me.callParent();
        me.on('change', me.onHexChange);
    },

    // NOTE: Since much of the logic of a picker class is overriding methods from the
    // base class, we don't bother to split out the small remainder as a controller.

    afterRender: function() {
        this.callParent();

        this.updateValue(this.value);
    },

    // override as required by parent pickerfield
    createPicker: function() {
        var me = this,
            popup = me.getPopup(),
            picker;

        // the window will actually be shown and will house the picker
        me.colorPickerWindow = popup = Ext.create(popup);
        me.colorPicker = picker = popup.lookupReference('selector');

        picker.setFormat(me.getFormat());
        picker.setColor(me.getColor());
        picker.setHexReadOnly(!me.editable);

        picker.on({
            ok: 'onColorPickerOK',
            cancel: 'onColorPickerCancel',
            scope: me
        });

        popup.on({
            close: 'onColorPickerCancel',
            scope: me
        });

        return me.colorPickerWindow;
    },

    // When the Ok button is clicked on color picker, preserve the previous value
    onColorPickerOK: function(colorPicker) {
        this.setColor(colorPicker.getColor());

        this.collapse();
    },

    onColorPickerCancel: function() {
        this.collapse();
    },

    onExpand: function() {
        var color = this.getColor();

        this.colorPicker.setPreviousColor(color);
    },

    onHexChange: function(field) {
        if (field.validate()) {
            this.setValue(field.getValue());
        }
    },

    // Expects value formatted as per "format" config
    setValue: function(color) {
        var me = this;

        if (Ext.ux.colorpick.ColorUtils.isValid(color)) {
            color = me.applyValue(color);

            me.callParent([color]);

            // always update in case opacity changes, even if value doesn't have it
            // to handle "hex6" non-opacity type of format
            me.updateValue(color);
        }
    },

    // Sets this.format and color picker's setFormat()
    updateFormat: function(format) {
        var cp = this.colorPicker;

        if (cp) {
            cp.setFormat(format);
        }
    },

    updateValue: function(color) {
        var me = this,
            c;

        // If the "value" is changed, update "color" as well. Since these are always
        // tracking each other, we guard against the case where we are being updated
        // *because* "color" is being set.
        if (!me.syncing) {
            me.syncing = true;
            me.setColor(color);
            me.syncing = false;
        }

        c = me.getColor();

        if (c) {
            Ext.ux.colorpick.ColorUtils.setBackground(me.swatchEl, c);

            if (me.colorPicker) {
                me.colorPicker.setColor(c);
            }
        }
    },

    validator: function(val) {
        if (!Ext.ux.colorpick.ColorUtils.isValid(val)) {
            return this.invalidText;
        }

        return true;
    }
});

// @source: colorpick/colorpick-overrides.js
Ext.define('Ext.ux.colorpick.Field', {
    override: 'Ext.ux.colorpick.Field',
    afterRender: function () {
        var me = this;
        me.callParent();
        me.swatchEl.setStyle('z-index', 1);
    },
});
