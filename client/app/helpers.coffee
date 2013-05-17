# Base class generated by Brunch
class exports.BrunchApplication
    constructor: ->
        $ =>
            @initialize this

    initializeJQueryExtensions: ->
        $.fn.spin = (opts, color) ->
            presets =
                tiny:
                    lines: 8
                    length: 2
                    width: 2
                    radius: 3

                small:
                    lines: 8
                    length: 1
                    width: 2
                    radius: 4

                large:
                    lines: 10
                    length: 8
                    width: 4
                    radius: 8

                extralarge:
                    lines: 10
                    length: 30
                    width: 12
                    radius: 30
                    top: 30
                    left: 60

            if Spinner
                @each ->
                    $this = $(this)
                    spinner = $this.data("spinner")
                    if spinner?
                        spinner.stop()
                        $this.data "spinner", null
                    else if opts isnt false
                        if typeof opts is "string"
                            if opts of presets
                                opts = presets[opts]
                            else
                                opts = {}
                            opts.color = color    if color
                        spinner = new Spinner($.extend(color: $this.css("color"), opts))
                        spinner.spin(this)
                        $this.data "spinner", spinner

            else
                throw "Spinner class not available."
                null

    initialize: ->

# Select all content of an input field.
exports.selectAll = (input) ->
    input.setSelection(0, input.val().length)

# Change a string into its slug shape (only alphanumeric char and hyphens
# instead of spaces.
exports.slugify = (string) ->
    _slugify_strip_re = /[^\w\s-]/g
    _slugify_hyphenate_re = /[-\s]+/g
    string = string.replace(_slugify_strip_re, '').trim().toLowerCase()
    string = string.replace _slugify_hyphenate_re, '-'
    string

# Transform a todolist path into its regular expression shape.
exports.getPathRegExp = (path) ->
    slashReg = new RegExp "/", "g"
    "^#{path.replace(slashReg, "\/")}"
