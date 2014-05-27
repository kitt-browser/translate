(($) ->
  $.widget "salsita.scalebreaker",

    # TODO:
    # fix non-mobile websites scaling back to a tiny dialog (correct but wrong)
    # add scale to center
    # make instanceable html?

    options:
      cssAnimated: true
      dialogContent: ''
      # Namespace only affects the HTML output currently, not CSS rules.
      idNamespace: 'jq-scalebreaker'
      dialogPosition: 'bottom'
      closeOnBackdrop: true
      denyUserScroll: true
      refreshOnScroll: true
      debug: false

    _create: ->
      @rawElement =
        "<div id='#{@options.idNamespace}-wrapper'>
          <div id='#{@options.idNamespace}-dialog-scalable'>
            <div id='#{@options.idNamespace}-dialog-scrollable'>
              <div id='#{@options.idNamespace}-dialog-content'></div>
              <span id='#{@options.idNamespace}-dialog-close'></span>
            </div>
          </div>
        </div>"
      @scrollbar = null
      # DOM references
      @wrapper = null
      @dialog = null
      @scrollarea = null
      @content = null
      @close = null
      # Dynamic data based on actual user values.
      @fullPageHeight = null
      @scaleFactor = null
      @currentViewportOffset = null
      @_initWidget()

    _initWidget: ->
      # Append the basic wrapper to the DOM.
      $('body').append @rawElement
      # Cache DOM references.
      @wrapper = $('#' + @options.idNamespace + '-wrapper')
      @dialog = $('#' + @options.idNamespace + '-dialog-scalable')
      @scrollarea = $('#' + @options.idNamespace + '-dialog-scrollable')
      @content = $('#' + @options.idNamespace + '-dialog-content')
      @close = $('#' + @options.idNamespace + '-dialog-close')
      # Append initial HTML content.
      # The widget stays in the DOM so any 3rd party manipulation of it's content is A-okay at any time.
      @changeDialogContent @options.dialogContent

    _setFullPageHeight: ->
      @fullPageHeight = Math.max(document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight)
      # Apply to wrapper.
      @wrapper.css
        'height': @fullPageHeight

    _getCurrentViewport: ->
      bodyOverflow = $('body').css 'overflow'
      # Hide the scrollbars so the calculations don't fail.
      $('body').css
        'overflow': 'hidden'
      @scaleFactor = window.innerWidth/document.documentElement.clientWidth
      @_logMessage 'scale factor', @scaleFactor
      # This may be too iPhony (though nice), needs testing across browsers and devices.
      @currentViewportOffset = [window.pageXOffset, window.pageYOffset]
      @_logMessage 'current viewport offset', @currentViewportOffset
      # Revert back to the original page value.
      $('body').css
        'overflow': bodyOverflow

    _rescaleAndReposition: ->
      @dialog.css
        'left': @currentViewportOffset[0]
        'transform': "scale(#{@.scaleFactor})"
        '-webkit-transform': "scale(#{@.scaleFactor})"
      if @options.dialogPosition is 'top'
        @dialog.css
          'top': @currentViewportOffset[1]
          'transform-origin': '0 0'
          '-webkit-transform-origin': '0 0'
      if @options.dialogPosition is 'bottom'
        @dialog.css
          'bottom': @fullPageHeight - (@currentViewportOffset[1] + window.innerHeight)
          'transform-origin': '0 100%'
          '-webkit-transform-origin': '0 100%'

    _manageScrollbar: ->
      if @content.outerHeight() > @scrollarea.outerHeight() and !@scrollbar
        @scrollbar = new IScroll(@scrollarea.get(0),
          HWCompositing: true
          useTransition: false
          click: true
        )
      else if @scrollbar
        @scrollbar.refresh()

    _logMessage: (name, args) ->
      if @options.debug
        console.log "#{@options.idNamespace}: #{name}", args

    show: ->
      _self = this
      # Close binds.
      if @options.closeOnBackdrop
        _self.wrapper.on "click.#{@options.idNamespace}", (e) ->
          if e.target is _self.wrapper.get(0)
            _self.hide()
      @close.on "click.#{@options.idNamespace}", (e) ->
        _self.hide()
      # Deny user touch scrolling while widget is visible.
      # This solves a lot of proxy UX problems, visual browser prolapses and code complexity for the moment.
      if @options.denyUserScroll
        $('body').on "touchmove.#{@options.idNamespace}", (e) ->
          e.preventDefault()
      # Show the widget.
      @wrapper.addClass "#{@options.idNamespace}-show"
      # Rescale the element and reposition on screen.
      @refresh()
      # Add the animation class after element is displayed.
      if @options.cssAnimated
        @wrapper.addClass "#{@options.idNamespace}-animate-in"
        @wrapper.on 'animationend webkitAnimationEnd',(e) ->
          if e.target is _self.scrollarea.get(0)
            _self.wrapper.removeClass "#{_self.options.idNamespace}-animate-in"
            _self.wrapper.off 'animationend webkitAnimationEnd'
      # Refresh the dialog on an unexpected scroll event.
      if @options.refreshOnScroll
        $(window).on "scroll.#{@options.idNamespace}",(e) ->
          _self.refresh()
      @_logMessage 'showing widget'

    hide: ->
      _self = this
      # Remove the user scrolling bind.
      if @options.denyUserScroll
        $('body').off "touchmove.#{@options.idNamespace}"
      # Animate out and hide on click.
      if @options.closeOnBackdrop and @options.cssAnimated
        _self.wrapper.off "click.#{@options.idNamespace}"
        @wrapper.addClass "#{@options.idNamespace}-animate-out"
        @wrapper.on 'animationend webkitAnimationEnd',(e) ->
          if e.target is _self.scrollarea.get(0)
            _self.wrapper.removeClass "#{_self.options.idNamespace}-animate-out"
            _self.wrapper.removeClass "#{_self.options.idNamespace}-show"
            # Remove inline CSS from the scaling.
            # _self.dialog.removeAttr 'style'
            _self.wrapper.off 'animationend webkitAnimationEnd'
      # Or just close.
      else if @options.closeOnBackdrop
        _self.wrapper.off "click.#{@options.idNamespace}"
        @wrapper.removeClass "#{@options.idNamespace}-show"
        # Remove inline CSS from the scaling.
        # @dialog.removeAttr 'style'
      # Remove the scroll event bind.
      if @options.refreshOnScroll
        $(window).off "scroll.#{@options.idNamespace}"
      @_logMessage 'hiding widget'

    changeDialogContent: (content) ->
      @content.html content
      @refresh()
      @_logMessage 'adding content to dialog', content

    refresh: ->
      # Sets height of the backdrop, important step prone to potential issues.
      # Position fixed cannot be used due to iPhone post-process moving elements relative to page edge during user scaling.
      @_setFullPageHeight()
      @_getCurrentViewport()
      @_rescaleAndReposition()
      @_manageScrollbar()
      @_logMessage 'refreshing'

    destroy: ->
      $(window).off "scroll.#{@options.idNamespace}"
      @wrapper.remove()
      @rawElement = null
      @wrapper = null
      @dialog = null
      @scrollarea = null
      @content = null
      @close = null
      @scaleFactor = null
      @fullPageHeight = null
      @currentViewportOffset = null
      if @scrollbar
        @scrollbar.destroy()
      @scrollbar = null
      @_destroy()

    _destroy: $.noop

) jQuery
