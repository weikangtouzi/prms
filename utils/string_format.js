String.prototype.format = function() {
    var args = arguments;

    return this.replace(/{([0-9]+)}/g, (match, index) => {
        return args[index]? args[index] : match;
    })
}

module.exports = {
    format: function() {
        var args = arguments;
        if (args.length <= 1) {
            throw new Error("need at least one argument")
        }
        let format_args = []
        for (var i = 1; i < args.length; i++) {
            format_args[i-1] = args[i]
        }
        return args[0].format(...format_args)
    }
}