
Ext.define('Ext.ux.gauge.needle.Abstract', {
    mixins: [
        'Ext.mixin.Factoryable'
    ],

    alias: 'gauge.needle.abstract',

    isNeedle: true,

    config: {
        
        path: null,

        
        innerRadius: 25,

        
        outerRadius: '100% - 20',

        
        style: null,

        
        radius: 0,

        
        gauge: null
    },

    constructor: function(config) {
        this.initConfig(config);
    },

    applyInnerRadius: function(innerRadius) {
        return this.getGauge().getRadiusFn(innerRadius);
    },

    applyOuterRadius: function(outerRadius) {
        return this.getGauge().getRadiusFn(outerRadius);
    },

    updateRadius: function() {
        this.regeneratePath();
    },

    setTransform: function(centerX, centerY, rotation) {
        var needleGroup = this.getNeedleGroup();

        needleGroup.setStyle(
            'transform',
            'translate(' + centerX + 'px,' + centerY + 'px) ' + 'rotate(' + rotation + 'deg)'
        );
    },

    applyPath: function(path) {
        return Ext.isFunction(path) ? path : null;
    },

    updatePath: function(path) {
        this.regeneratePath(path);
    },

    regeneratePath: function(path) {
        path = path || this.getPath();

        // eslint-disable-next-line vars-on-top
        var me = this,
            radius = me.getRadius(),
            inner = me.getInnerRadius()(radius),
            outer = me.getOuterRadius()(radius),
            d = outer > inner ? path(inner, outer) : '';

        me.getNeedlePath().dom.setAttribute('d', d);
    },

    getNeedleGroup: function() {
        var gauge = this.getGauge(),
            group = this.needleGroup;

        // The gauge positions the needle by calling its `setTransform` method,
        // which applies a transformation to the needle's group, that contains
        // the actual path element. This is done because we need the ability to
        // transform the path independently from it's position in the gauge.
        // For example, if the needle has to be made bigger, is shouldn't be
        // part of the transform that centers it in the gauge and rotates it
        // to point at the current value.
        if (!group) {
            group = this.needleGroup = Ext.get(document.createElementNS(gauge.svgNS, 'g'));
            gauge.getSvg().appendChild(group);
        }

        return group;
    },

    getNeedlePath: function() {
        var me = this,
            pathElement = me.pathElement;

        if (!pathElement) {
            pathElement = me.pathElement =
                Ext.get(document.createElementNS(me.getGauge().svgNS, 'path'));
            pathElement.dom.setAttribute('class', Ext.baseCSSPrefix + 'gauge-needle');
            me.getNeedleGroup().appendChild(pathElement);
        }

        return pathElement;
    },

    updateStyle: function(style) {
        var pathElement = this.getNeedlePath();

        // Note that we are setting the `style` attribute, e.g `style="fill: red"`,
        // instead of path attributes individually, e.g. `fill="red"` because
        // the attribute styles defined in CSS classes will override the values
        // of attributes set on the elements individually.
        if (Ext.isObject(style)) {
            pathElement.setStyle(style);
        }
        else {
            pathElement.dom.removeAttribute('style');
        }
    },

    destroy: function() {
        var me = this;

        me.pathElement = Ext.destroy(me.pathElement);
        me.needleGroup = Ext.destroy(me.needleGroup);
        me.setGauge(null);
    }
});

Ext.define('Ext.ux.gauge.needle.Arrow', {
    extend: 'Ext.ux.gauge.needle.Abstract',
    alias: 'gauge.needle.arrow',

    config: {
        path: function(ir, or) {
            return or - ir > 30
                ? "M0," + (ir + 5) + " L-4," + ir + " L-4," + (ir + 10) + " L-1," +
                  (ir + 15) + " L-1," + (or - 7) + " L-5," + (or - 10) + " L0," + or +
                  " L5," + (or - 10) + " L1," + (or - 7) + " L1," + (ir + 15) +
                  " L4," + (ir + 10) + " L4," + ir + " Z"
                : '';
        }
    }
});

Ext.define('Ext.ux.gauge.needle.Diamond', {
    extend: 'Ext.ux.gauge.needle.Abstract',
    alias: 'gauge.needle.diamond',

    config: {
        path: function(ir, or) {
            return or - ir > 10
                ? 'M0,' + ir + ' L-4,' + (ir + 5) + ' L0,' + or + ' L4,' + (ir + 5) + ' Z'
                : '';
        }
    }
});

Ext.define('Ext.ux.gauge.needle.Rectangle', {
    extend: 'Ext.ux.gauge.needle.Abstract',
    alias: 'gauge.needle.rectangle',

    config: {
        path: function(ir, or) {
            return or - ir > 10
                ? "M-2," + ir + " L2," + ir + " L2," + or + " L-2," + or + " Z"
                : '';
        }
    }
});

Ext.define('Ext.ux.gauge.needle.Spike', {
    extend: 'Ext.ux.gauge.needle.Abstract',
    alias: 'gauge.needle.spike',

    config: {
        path: function(ir, or) {
            return or - ir > 10
                ? "M0," + (ir + 5) + " L-4," + ir + " L0," + or + " L4," + ir + " Z"
                : '';
        }
    }
});

Ext.define('Ext.ux.gauge.needle.Wedge', {
    extend: 'Ext.ux.gauge.needle.Abstract',
    alias: 'gauge.needle.wedge',

    config: {
        path: function(ir, or) {
            return or - ir > 10 ? "M-4," + ir + " L0," + or + " L4," + ir + " Z" : '';
        }
    }
});


Ext.define('Ext.ux.gauge.Gauge', {
    alternateClassName: 'Ext.ux.Gauge',
    extend: 'Ext.Gadget',
    xtype: 'gauge',

    requires: [
        'Ext.ux.gauge.needle.Abstract',
        'Ext.util.Region'
    ],

    config: {
        
        padding: 10,

        
        trackStart: 135,

        
        trackLength: 270,

        
        angleOffset: 0,

        
        minValue: 0,

        
        maxValue: 100,

        
        value: 50,

        
        needle: null,

        needleDefaults: {
            cached: true,
            $value: {
                type: 'diamond'
            }
        },

        
        clockwise: true,

        
        textTpl: ['<tpl>{value:number("0.00")}%</tpl>'],

        
        textAlign: 'c-c',

        
        textOffset: {
            dx: 0,
            dy: 0
        },

        
        trackStyle: {
            outerRadius: '100%',
            innerRadius: '100% - 20',
            round: false
        },

        
        valueStyle: {
            outerRadius: '100% - 2',
            innerRadius: '100% - 18',
            round: false
        },

        
        animation: true
    },

    baseCls: Ext.baseCSSPrefix + 'gauge',

    template: [{
        reference: 'bodyElement',
        children: [{
            reference: 'textElement',
            cls: Ext.baseCSSPrefix + 'gauge-text'
        }]
    }],

    defaultBindProperty: 'value',

    pathAttributes: {
        // The properties in the `trackStyle` and `valueStyle` configs
        // that are path attributes.
        fill: true,
        fillOpacity: true,
        stroke: true,
        strokeOpacity: true,
        strokeWidth: true
    },

    easings: {
        linear: Ext.identityFn,
        // cubic easings
        'in': function(t) {
            return t * t * t;
        },
        out: function(t) {
            return (--t) * t * t + 1;
        },
        inOut: function(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }
    },

    resizeDelay: 0,   // in milliseconds
    resizeTimerId: 0,
    size: null,       // cached size
    svgNS: 'http://www.w3.org/2000/svg',
    svg: null,        // SVG document
    defs: null,       // the `defs` section of the SVG document
    trackArc: null,
    valueArc: null,
    trackGradient: null,
    valueGradient: null,
    fx: null,         // either the `value` or the `angleOffset` animation
    fxValue: 0,       // the actual value rendered/animated
    fxAngleOffset: 0,

    constructor: function(config) {
        var me = this;

        me.fitSectorInRectCache = {
            startAngle: null,
            lengthAngle: null,
            minX: null,
            maxX: null,
            minY: null,
            maxY: null
        };

        me.interpolator = me.createInterpolator();
        me.callParent([config]);

        me.el.on('resize', 'onElementResize', me);
    },

    doDestroy: function() {
        var me = this;

        Ext.undefer(me.resizeTimerId);
        me.el.un('resize', 'onElementResize', me);
        me.stopAnimation();
        me.setNeedle(null);
        me.trackGradient = Ext.destroy(me.trackGradient);
        me.valueGradient = Ext.destroy(me.valueGradient);
        me.defs = Ext.destroy(me.defs);
        me.svg = Ext.destroy(me.svg);

        me.callParent();
    },

    // <if classic>
    afterComponentLayout: function(width, height, oldWidth, oldHeight) {
        this.callParent([width, height, oldWidth, oldHeight]);

        if (Ext.isIE9) {
            this.handleResize();
        }
    },
    // </if>

    onElementResize: function(element, size) {
        this.handleResize(size);
    },

    handleResize: function(size, instantly) {
        var me = this,
            el = me.element;

        if (!(el && (size = size || el.getSize()) && size.width && size.height)) {
            return;
        }

        me.resizeTimerId = Ext.undefer(me.resizeTimerId);

        if (!instantly && me.resizeDelay) {
            me.resizeTimerId = Ext.defer(me.handleResize, me.resizeDelay, me, [size, true]);

            return;
        }

        me.size = size;
        me.resizeHandler(size);
    },

    updateMinValue: function(minValue) {
        var me = this;

        me.interpolator.setDomain(minValue, me.getMaxValue());

        if (!me.isConfiguring) {
            me.render();
        }
    },

    updateMaxValue: function(maxValue) {
        var me = this;

        me.interpolator.setDomain(me.getMinValue(), maxValue);

        if (!me.isConfiguring) {
            me.render();
        }
    },

    updateAngleOffset: function(angleOffset, oldAngleOffset) {
        var me = this,
            animation = me.getAnimation();

        me.fxAngleOffset = angleOffset;

        if (me.isConfiguring) {
            return;
        }

        if (animation.duration) {
            me.animate(
                oldAngleOffset, angleOffset,
                animation.duration, me.easings[animation.easing],
                function(angleOffset) {
                    me.fxAngleOffset = angleOffset;
                    me.render();
                }
            );
        }
        else {
            me.render();
        }
    },

    //<debug>
    applyTrackStart: function(trackStart) {
        if (trackStart < 0 || trackStart >= 360) {
            Ext.raise("'trackStart' should be within [0, 360).");
        }

        return trackStart;
    },

    applyTrackLength: function(trackLength) {
        if (trackLength <= 0 || trackLength > 360) {
            Ext.raise("'trackLength' should be within (0, 360].");
        }

        return trackLength;
    },
    //</debug>

    updateTrackStart: function(trackStart) {
        var me = this;

        if (!me.isConfiguring) {
            me.render();
        }
    },

    updateTrackLength: function(trackLength) {
        var me = this;

        me.interpolator.setRange(0, trackLength);

        if (!me.isConfiguring) {
            me.render();
        }
    },

    applyPadding: function(padding) {
        var ratio;

        if (typeof padding === 'string') {
            ratio = parseFloat(padding) / 100;

            return function(x) {
                return x * ratio;
            };
        }

        return function() {
            return padding;
        };
    },

    updatePadding: function() {
        if (!this.isConfiguring) {
            this.render();
        }
    },

    applyValue: function(value) {
        var minValue = this.getMinValue(),
            maxValue = this.getMaxValue();

        return Math.min(Math.max(value, minValue), maxValue);
    },

    updateValue: function(value, oldValue) {
        var me = this,
            animation = me.getAnimation();

        me.fxValue = value;

        if (me.isConfiguring) {
            return;
        }

        me.writeText();

        if (animation.duration) {
            me.animate(
                oldValue, value,
                animation.duration, me.easings[animation.easing],
                function(value) {
                    me.fxValue = value;
                    me.render();
                }
            );
        }
        else {
            me.render();
        }
    },

    applyTextTpl: function(textTpl) {
        if (textTpl && !textTpl.isTemplate) {
            textTpl = new Ext.XTemplate(textTpl);
        }

        return textTpl;
    },

    applyTextOffset: function(offset) {
        offset = offset || {};
        offset.dx = offset.dx || 0;
        offset.dy = offset.dy || 0;

        return offset;
    },

    updateTextTpl: function() {
        this.writeText();

        if (!this.isConfiguring) {
            this.centerText(); // text will be centered on first size
        }
    },

    writeText: function(options) {
        var me = this,
            value = me.getValue(),
            minValue = me.getMinValue(),
            maxValue = me.getMaxValue(),
            delta = maxValue - minValue,
            textTpl = me.getTextTpl();

        textTpl.overwrite(me.textElement, {
            value: value,
            percent: (value - minValue) / delta * 100,
            minValue: minValue,
            maxValue: maxValue,
            delta: delta
        });
    },

    centerText: function(cx, cy, sectorRegion, innerRadius, outerRadius) {
        var textElement = this.textElement,
            textAlign = this.getTextAlign(),
            alignedRegion, textBox;

        if (Ext.Number.isEqual(innerRadius, 0, 0.1) ||
            sectorRegion.isOutOfBound({ x: cx, y: cy })) {

            alignedRegion = textElement.getRegion().alignTo({
                align: textAlign, // align text region's center to sector region's center
                target: sectorRegion
            });

            textElement.setLeft(alignedRegion.left);
            textElement.setTop(alignedRegion.top);
        }
        else {
            textBox = textElement.getBox();
            textElement.setLeft(cx - textBox.width / 2);
            textElement.setTop(cy - textBox.height / 2);
        }
    },

    camelCaseRe: /([a-z])([A-Z])/g,

    
    camelToHyphen: function(name) {
        return name.replace(this.camelCaseRe, '$1-$2').toLowerCase();
    },

    applyTrackStyle: function(trackStyle) {
        var me = this,
            trackGradient;

        trackStyle.innerRadius = me.getRadiusFn(trackStyle.innerRadius);
        trackStyle.outerRadius = me.getRadiusFn(trackStyle.outerRadius);

        if (Ext.isArray(trackStyle.fill)) {
            trackGradient = me.getTrackGradient();
            me.setGradientStops(trackGradient, trackStyle.fill);
            trackStyle.fill = 'url(#' + trackGradient.dom.getAttribute('id') + ')';
        }

        return trackStyle;
    },

    updateTrackStyle: function(trackStyle) {
        var me = this,
            trackArc = Ext.fly(me.getTrackArc()),
            name;

        for (name in trackStyle) {
            if (name in me.pathAttributes) {
                trackArc.setStyle(me.camelToHyphen(name), trackStyle[name]);
            }
            else {
                trackArc.setStyle(name, trackStyle[name]);
            }
        }
    },

    applyValueStyle: function(valueStyle) {
        var me = this,
            valueGradient;

        valueStyle.innerRadius = me.getRadiusFn(valueStyle.innerRadius);
        valueStyle.outerRadius = me.getRadiusFn(valueStyle.outerRadius);

        if (Ext.isArray(valueStyle.fill)) {
            valueGradient = me.getValueGradient();
            me.setGradientStops(valueGradient, valueStyle.fill);
            valueStyle.fill = 'url(#' + valueGradient.dom.getAttribute('id') + ')';
        }

        return valueStyle;
    },

    updateValueStyle: function(valueStyle) {
        var me = this,
            valueArc = Ext.fly(me.getValueArc()),
            name;

        for (name in valueStyle) {
            if (name in me.pathAttributes) {
                valueArc.setStyle(me.camelToHyphen(name), valueStyle[name]);
            }
            else {
                valueArc.setStyle(name, valueStyle[name]);
            }
        }
    },

    
    getRadiusFn: function(radius) {
        var result, pos, ratio,
            increment = 0;

        if (Ext.isNumber(radius)) {
            result = function() {
                return radius;
            };
        }
        else if (Ext.isString(radius)) {
            radius = radius.replace(/ /g, '');
            ratio = parseFloat(radius) / 100;
            pos = radius.search('%'); // E.g. '100% - 4'

            if (pos < radius.length - 1) {
                increment = parseFloat(radius.substr(pos + 1));
            }

            result = function(radius) {
                return radius * ratio + increment;
            };

            result.ratio = ratio;
        }

        return result;
    },

    getSvg: function() {
        var me = this,
            svg = me.svg;

        if (!svg) {
            svg = me.svg = Ext.get(document.createElementNS(me.svgNS, 'svg'));
            me.bodyElement.append(svg);
        }

        return svg;
    },

    getTrackArc: function() {
        var me = this,
            trackArc = me.trackArc;

        if (!trackArc) {
            trackArc = me.trackArc = document.createElementNS(me.svgNS, 'path');
            me.getSvg().append(trackArc, true);
            // Note: Ext.dom.Element.addCls doesn't work on SVG elements,
            // as it simply assigns a class string to el.dom.className,
            // which in case of SVG is no simple string:
            // SVGAnimatedString {baseVal: "x-gauge-track", animVal: "x-gauge-track"}
            trackArc.setAttribute('class', Ext.baseCSSPrefix + 'gauge-track');
        }

        return trackArc;
    },

    getValueArc: function() {
        var me = this,
            valueArc = me.valueArc;

        me.getTrackArc(); // make sure the track arc is created first for proper draw order

        if (!valueArc) {
            valueArc = me.valueArc = document.createElementNS(me.svgNS, 'path');
            me.getSvg().append(valueArc, true);
            valueArc.setAttribute('class', Ext.baseCSSPrefix + 'gauge-value');
        }

        return valueArc;
    },

    applyNeedle: function(needle, oldNeedle) {
        // Make sure the track and value elements have been already created,
        // so that the needle element renders on top.
        this.getValueArc();

        return Ext.Factory.gaugeNeedle.update(oldNeedle, needle,
                                              this, 'createNeedle', 'needleDefaults');
    },

    createNeedle: function(config) {
        return Ext.apply({
            gauge: this
        }, config);
    },

    getDefs: function() {
        var me = this,
            defs = me.defs;

        if (!defs) {
            defs = me.defs = Ext.get(document.createElementNS(me.svgNS, 'defs'));
            me.getSvg().appendChild(defs);
        }

        return defs;
    },

    
    setGradientSize: function(gradient, x1, y1, x2, y2) {
        gradient.setAttribute('x1', x1);
        gradient.setAttribute('y1', y1);
        gradient.setAttribute('x2', x2);
        gradient.setAttribute('y2', y2);
    },

    
    resizeGradients: function(size) {
        var me = this,
            trackGradient = me.getTrackGradient(),
            valueGradient = me.getValueGradient(),
            x1 = 0,
            y1 = size.height / 2,
            x2 = size.width,
            y2 = size.height / 2;

        me.setGradientSize(trackGradient.dom, x1, y1, x2, y2);
        me.setGradientSize(valueGradient.dom, x1, y1, x2, y2);
    },

    
    setGradientStops: function(gradient, stops) {
        var ln = stops.length,
            i, stopCfg, stopEl;

        while (gradient.firstChild) {
            gradient.removeChild(gradient.firstChild);
        }

        for (i = 0; i < ln; i++) {
            stopCfg = stops[i];
            stopEl = document.createElementNS(this.svgNS, 'stop');
            gradient.appendChild(stopEl);
            stopEl.setAttribute('offset', stopCfg.offset);
            stopEl.setAttribute('stop-color', stopCfg.color);

            if ('opacity' in stopCfg) {
                stopEl.setAttribute('stop-opacity', stopCfg.opacity);
            }
        }
    },

    getTrackGradient: function() {
        var me = this,
            trackGradient = me.trackGradient;

        if (!trackGradient) {
            trackGradient = me.trackGradient =
                Ext.get(document.createElementNS(me.svgNS, 'linearGradient'));

            // Using absolute values for x1, y1, x2, y2 attributes.
            trackGradient.dom.setAttribute('gradientUnits', 'userSpaceOnUse');
            me.getDefs().appendChild(trackGradient);
            Ext.get(trackGradient); // assign unique ID
        }

        return trackGradient;
    },

    getValueGradient: function() {
        var me = this,
            valueGradient = me.valueGradient;

        if (!valueGradient) {
            valueGradient = me.valueGradient =
                Ext.get(document.createElementNS(me.svgNS, 'linearGradient'));

            // Using absolute values for x1, y1, x2, y2 attributes.
            valueGradient.dom.setAttribute('gradientUnits', 'userSpaceOnUse');
            me.getDefs().appendChild(valueGradient);
            Ext.get(valueGradient); // assign unique ID
        }

        return valueGradient;
    },

    getArcPoint: function(centerX, centerY, radius, degrees) {
        var radians = degrees / 180 * Math.PI;

        return [
            centerX + radius * Math.cos(radians),
            centerY + radius * Math.sin(radians)
        ];
    },

    isCircle: function(startAngle, endAngle) {
        return Ext.Number.isEqual(Math.abs(endAngle - startAngle), 360, 0.001);
    },

    getArcPath: function(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, round) {
        var me = this,
            isCircle = me.isCircle(startAngle, endAngle),
            // It's not possible to draw a circle using arcs.
            endAngle = endAngle - 0.01, // eslint-disable-line no-redeclare
            innerStartPoint = me.getArcPoint(centerX, centerY, innerRadius, startAngle),
            innerEndPoint = me.getArcPoint(centerX, centerY, innerRadius, endAngle),
            outerStartPoint = me.getArcPoint(centerX, centerY, outerRadius, startAngle),
            outerEndPoint = me.getArcPoint(centerX, centerY, outerRadius, endAngle),
            large = endAngle - startAngle <= 180 ? 0 : 1,
            path = [
                'M', innerStartPoint[0], innerStartPoint[1],
                'A', innerRadius, innerRadius, 0, large, 1, innerEndPoint[0], innerEndPoint[1]
            ],
            capRadius = (outerRadius - innerRadius) / 2;

        if (isCircle) {
            path.push('M', outerEndPoint[0], outerEndPoint[1]);
        }
        else {
            if (round) {
                path.push('A', capRadius, capRadius, 0, 0, 0, outerEndPoint[0], outerEndPoint[1]);
            }
            else {
                path.push('L', outerEndPoint[0], outerEndPoint[1]);
            }
        }

        path.push('A', outerRadius, outerRadius, 0, large, 0, outerStartPoint[0],
                  outerStartPoint[1]);

        if (round && !isCircle) {
            path.push('A', capRadius, capRadius, 0, 0, 0, innerStartPoint[0], innerStartPoint[1]);
        }

        path.push('Z');

        return path.join(' ');
    },

    resizeHandler: function(size) {
        var me = this,
            svg = me.getSvg();

        svg.setSize(size);
        me.resizeGradients(size);
        me.render();
    },

    
    createInterpolator: function(rangeCheck) {
        var domainStart = 0,
            domainDelta = 1,
            rangeStart = 0,
            rangeEnd = 1,

            interpolator = function(x, invert) {
                var t = 0;

                if (domainDelta) {
                    t = (x - domainStart) / domainDelta;

                    if (rangeCheck) {
                        t = Math.max(0, t);
                        t = Math.min(1, t);
                    }

                    if (invert) {
                        t = 1 - t;
                    }
                }

                return (1 - t) * rangeStart + t * rangeEnd;
            };

        interpolator.setDomain = function(a, b) {
            domainStart = a;
            domainDelta = b - a;

            return this;
        };

        interpolator.setRange = function(a, b) {
            rangeStart = a;
            rangeEnd = b;

            return this;
        };

        interpolator.getDomain = function() {
            return [domainStart, domainStart + domainDelta];
        };

        interpolator.getRange = function() {
            return [rangeStart, rangeEnd];
        };

        return interpolator;
    },

    applyAnimation: function(animation) {
        if (true === animation) {
            animation = {};
        }
        else if (false === animation) {
            animation = {
                duration: 0
            };
        }

        if (!('duration' in animation)) {
            animation.duration = 1000;
        }

        if (!(animation.easing in this.easings)) {
            animation.easing = 'out';
        }

        return animation;
    },

    updateAnimation: function() {
        this.stopAnimation();
    },

    
    animate: function(from, to, duration, easing, fn, scope) {
        var me = this,
            start = Ext.now(),
            interpolator = me.createInterpolator().setRange(from, to);

        function frame() {
            var now = Ext.AnimationQueue.frameStartTime,
                t = Math.min(now - start, duration) / duration,
                value = interpolator(easing(t));

            if (scope) {
                if (typeof fn === 'string') {
                    scope[fn].call(scope, value);
                }
                else {
                    fn.call(scope, value);
                }
            }
            else {
                fn(value);
            }

            if (t >= 1) {
                Ext.AnimationQueue.stop(frame, scope);
                me.fx = null;
            }
        }

        me.stopAnimation();
        Ext.AnimationQueue.start(frame, scope);
        me.fx = {
            frame: frame,
            scope: scope
        };
    },

    
    stopAnimation: function() {
        var me = this;

        if (me.fx) {
            Ext.AnimationQueue.stop(me.fx.frame, me.fx.scope);
            me.fx = null;
        }
    },

    unitCircleExtrema: {
        0: [1, 0],
        90: [0, 1],
        180: [-1, 0],
        270: [0, -1],
        360: [1, 0],
        450: [0, 1],
        540: [-1, 0],
        630: [0, -1]
    },

    
    getUnitSectorExtrema: function(startAngle, lengthAngle) {
        var extrema = this.unitCircleExtrema,
            points = [],
            angle;

        for (angle in extrema) {
            if (angle > startAngle && angle < startAngle + lengthAngle) {
                points.push(extrema[angle]);
            }
        }

        return points;
    },

    
    fitSectorInRect: function(width, height, startAngle, lengthAngle, ratio) {
        if (Ext.Number.isEqual(lengthAngle, 360, 0.001)) {
            return {
                cx: width / 2,
                cy: height / 2,
                radius: Math.min(width, height) / 2,
                region: new Ext.util.Region(0, width, height, 0)
            };
        }

        // eslint-disable-next-line vars-on-top
        var me = this,
            points, xx, yy, minX, maxX, minY, maxY,
            cache = me.fitSectorInRectCache,
            sameAngles = cache.startAngle === startAngle && cache.lengthAngle === lengthAngle;

        if (sameAngles) {
            minX = cache.minX;
            maxX = cache.maxX;
            minY = cache.minY;
            maxY = cache.maxY;
        }
        else {
            points = me.getUnitSectorExtrema(startAngle, lengthAngle).concat([
                // start angle outer radius point
                me.getArcPoint(0, 0, 1, startAngle),

                // start angle inner radius point
                me.getArcPoint(0, 0, ratio, startAngle),

                // end angle outer radius point
                me.getArcPoint(0, 0, 1, startAngle + lengthAngle),

                // end angle inner radius point
                me.getArcPoint(0, 0, ratio, startAngle + lengthAngle)
            ]);

            xx = points.map(function(point) {
                return point[0];
            });

            yy = points.map(function(point) {
                return point[1];
            });

            // The bounding box of a unit sector with the given properties.
            minX = Math.min.apply(null, xx);
            maxX = Math.max.apply(null, xx);
            minY = Math.min.apply(null, yy);
            maxY = Math.max.apply(null, yy);

            cache.startAngle = startAngle;
            cache.lengthAngle = lengthAngle;
            cache.minX = minX;
            cache.maxX = maxX;
            cache.minY = minY;
            cache.maxY = maxY;
        }

        // eslint-disable-next-line vars-on-top, one-var
        var sectorWidth = maxX - minX,
            sectorHeight = maxY - minY,
            scaleX = width / sectorWidth,
            scaleY = height / sectorHeight,
            scale = Math.min(scaleX, scaleY),
            // Region constructor takes: top, right, bottom, left.
            sectorRegion = new Ext.util.Region(minY * scale, maxX * scale, maxY * scale,
                                               minX * scale),
            rectRegion = new Ext.util.Region(0, width, height, 0),
            alignedRegion = sectorRegion.alignTo({
                align: 'c-c', // align sector region's center to rect region's center
                target: rectRegion
            }),
            dx = alignedRegion.left - minX * scale,
            dy = alignedRegion.top - minY * scale;

        return {
            cx: dx,
            cy: dy,
            radius: scale,
            region: alignedRegion
        };
    },

    
    fitSectorInPaddedRect: function(width, height, padding, startAngle, lengthAngle, ratio) {
        var result = this.fitSectorInRect(
            width - padding * 2,
            height - padding * 2,
            startAngle, lengthAngle, ratio
        );

        result.cx += padding;
        result.cy += padding;
        result.region.translateBy(padding, padding);

        return result;
    },

    
    normalizeAngle: function(angle) {
        return (angle % 360 + 360) % 360;
    },

    render: function() {
        if (!this.size) {
            return;
        }

        // eslint-disable-next-line vars-on-top
        var me = this,
            textOffset = me.getTextOffset(),
            trackArc = me.getTrackArc(),
            valueArc = me.getValueArc(),
            needle = me.getNeedle(),
            clockwise = me.getClockwise(),
            value = me.fxValue,
            angleOffset = me.fxAngleOffset,
            trackLength = me.getTrackLength(),
            width = me.size.width,
            height = me.size.height,
            paddingFn = me.getPadding(),
            padding = paddingFn(Math.min(width, height)),

            // in the range of [0, 360)
            trackStart = me.normalizeAngle(me.getTrackStart() + angleOffset),

            // in the range of (0, 720)
            trackEnd = trackStart + trackLength,
            valueLength = me.interpolator(value),
            trackStyle = me.getTrackStyle(),
            valueStyle = me.getValueStyle(),
            sector = me.fitSectorInPaddedRect(
                width, height, padding, trackStart, trackLength, trackStyle.innerRadius.ratio
            ),
            cx = sector.cx,
            cy = sector.cy,
            radius = sector.radius,
            trackInnerRadius = Math.max(0, trackStyle.innerRadius(radius)),
            trackOuterRadius = Math.max(0, trackStyle.outerRadius(radius)),
            valueInnerRadius = Math.max(0, valueStyle.innerRadius(radius)),
            valueOuterRadius = Math.max(0, valueStyle.outerRadius(radius)),
            trackPath = me.getArcPath(
                cx, cy, trackInnerRadius, trackOuterRadius, trackStart, trackEnd, trackStyle.round
            ),
            valuePath = me.getArcPath(
                cx, cy, valueInnerRadius, valueOuterRadius,
                clockwise ? trackStart : trackEnd - valueLength,
                clockwise ? trackStart + valueLength : trackEnd,
                valueStyle.round
            );

        me.centerText(
            cx + textOffset.dx, cy + textOffset.dy,
            sector.region, trackInnerRadius, trackOuterRadius
        );

        trackArc.setAttribute('d', trackPath);
        valueArc.setAttribute('d', valuePath);

        if (needle) {
            needle.setRadius(radius);
            needle.setTransform(cx, cy, -90 + trackStart + valueLength);
        }

        me.fireEvent('render', me);
    }
});

