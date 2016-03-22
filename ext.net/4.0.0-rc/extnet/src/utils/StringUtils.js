
// @source core/net/StringUtils.js

Ext.net.StringUtils = function () {
    var _formatRe = /\{(\d+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?\}/g,
        _argRe = /(['"])(.*?)\1\s*(?:,|$)/g;

    return {
        format : function (format) {
            var args = Ext.Array.toArray(arguments, 1),
                fm = Ext.util.Format;

            return format.replace(_formatRe, function (m, idx, fn, fmArgs) {
                var replaceValue = args[parseInt(idx, 10)],
                    values,
                    match;

                if (fn) {
                    values = [replaceValue];

                    while (match = _argRe.exec(fmArgs)) {
                        values.push(match[2]);
                    }

                    return fm[fn].apply(fm, values);
                }

                return replaceValue;
            });
        },

        startsWith : function (str, value) {
            return str.match("^" + value) !== null;
        },

        endsWith : function (str, value) {
            return str.match(value + "$") !== null;
        }
    };
}();