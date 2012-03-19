/**
 * Typeahead Module: Contains the @TypeheadInput component.
 */
var F = require('Fax'), FDom = require('FDom');
var stylers = FDom.stylers;
var T = require('FTheme');
var StaticAsyncSearch = require('./StaticAsyncSearch/StaticAsyncSearch');
var CustomizableGroupAndOrderer = require('CustomizableGroupAndOrderer');
var Typeahead = {};
var FTextInput = require('FTextInput').FTextInput;
var Div = FDom.Div;

/**
 * @Cursor positions:
 * - ANTI_CUR: User does not want a cursor - intentionally.
 * - NO_PREF_CUR: We have no reason to believe that the user wants the cursor
 *   positioned on any particular entity, and no reason to believe they want it
 *   omitted. Anything larger than NO_PREF_CUR represents an intent that we
 *   should take into consideration.
 */
var NONE = -1, NO_PREF_CUR = -2, ANTI_CUR = -1;

/**
 * Consts for readability.
 */
var MOVE_FORWARD = 1, MOVE_BACKWARD = -1, DO_WRAP = true, DONT_WRAP = false;

Typeahead.TypeaheadInput = F.Componentize({

  /**
   * -99% of the time, there is no need to pay attention to changing props which
   *  is data that is entirely owned by someone else. But occasionally, though
   *  the information itself isn't owned by us, changes in this information may
   *  result in effecting the data that *is* owned by us (this.state), or have
   *  other side effects. We shouldn't speak much about these property triggers,
   *  because until the expressiveness of structure() is fully realized by the
   *  developer, their first intuition is to use propTrigger everywhere (as it
   *  more closely resembles side-effect-full programming.
   * - propTriggers are only intended to determine the 'next' state change in
   *   response to changing properties.
   * -In this particular case we use that edge detection to enqueue an async
   *  search. Now, it has to be "enqueued" (in other words stuck at the back of
   *  the event queue, because at this time, that nextProps is not yet
   *  "this.props". It will become so, however, one level up this call stack. So
   *  enqueueing the search will work nicely as the search will take place when
   *  everything has reached steady state.
   */
  propTrigger: function(nextProps) {
    if (nextProps.selectedEntity !== this.props.selectedEntity) {
      this.enqueueAsyncSearch();
    }
    return this.S;
  },

  /**
   * @initState: Initializes and kicks off initial request.
   */
  initState: function(initProps) {
    this.enqueueAsyncSearch();
    return {
      results: { ordered: [], groupInfos: [] },
      usrCur: NO_PREF_CUR,
      userInputText: '',
      someOneHovering: false
    };
  },

  determineSearcher: function() {
    return this.props.searcher ||
        StaticAsyncSearch.makeSearcher(this.props.staticEntries);
  },

  determineGroupAndOrderer: function() {
    var P = this.props;
    return P.performGroupingWith ?
      CustomizableGroupAndOrderer.makeKeyBasedGroupAndOrderer(P.performGroupingWith) :
      CustomizableGroupAndOrderer.makeSingleGroupAndOrderer(P.oneGroupWithText || '');
  },

  shouldShowGroups: function() {
    return this.props.performGroupingWith || this.props.oneGroupWithText;
  },

  /**
   * @onSearchResults: Called several times per request, streaming callback
   */
  onSearchResults: function(searchResponse) {
    var S = this.state, P = this.props;
    var newResults = this.determineGroupAndOrderer()(searchResponse);
    var indexOfCurInNew =
        F.indexOfStruct(newResults.ordered, S.results.ordered[S.usrCur]);
    var newCurIdx = S.usrCur === ANTI_CUR ? ANTI_CUR :
        S.usrCur === NO_PREF_CUR ? NO_PREF_CUR :
        indexOfCurInNew === NONE ? NO_PREF_CUR : indexOfCurInNew;

    return searchResponse.text !== this.inputTextToSearchFor() ? S : {
      results: newResults,
      usrCur: newCurIdx
    };
  },

  asyncSearchImpl: function() {
    this.determineSearcher()(
      this.inputTextToSearchFor(), this.stateUpdater(this.onSearchResults)
    );
  },

  /**
   * @enqueueAsyncSearch: Enqueues, a an async request. It enqueues it via a
   * setTimeout, because it allows for the component to reach some steady state,
   * (or steady props) and have the search call use those latest values.
   */
  enqueueAsyncSearch: function() {
    setTimeout(F.bindNoArgs(this.asyncSearchImpl, this), 1);
  },

  shouldHideResults: function() {
    var S = this.state, P = this.props;
    return (!S.isFocused && P.forceHideWhenNotFocused ||
             S.isFocused && P.selectedEntity);
  },

  /**
   * @visibleHighlightPosition: The highlighted position among visibile results.
   * If no results are visible, then this should return NONE. Note that visible
   * highlight not always === usrCur.
   */
  visibleHighlightPosition:  function() {
    var S = this.state;
    return S.usrCur === ANTI_CUR ? NONE :
        S.usrCur === NO_PREF_CUR ? S.results.bestMatchInOrderedIdx : S.usrCur;
  },

  /**
   * @onSearchTextChange: When the user changes the text in the search box. As
   * always, this doesn't fire when we ourselves change the "value".
   * - When the user changes the text, we reset the usrCur to NO_PREF_CUR which
   *   is the right behavior.
   */
  onSearchTextChange: function(text) {
    this.updateState({
      userInputText: text,
      usrCur: NO_PREF_CUR
    });

    /**
     * By changing the text, that is a signal from the user that they intend to
     * change the selection to (nothing).
     */
    if (this.props.selectedEntity && this.props.onEntityChosen) {
      this.props.onEntityChosen(null);
    }
    this.enqueueAsyncSearch();
  },

  onSearchBackSpaceAttempt: function(e) {
    if (this.props.selectedEntity) {
      e.preventDefault();
      this.updateState({
        userInputText: ''
      });
      this.props.onEntityChosen && this.props.onEntityChosen(null);
    }
  },

  /**
   * @onSearchBlur: When the user moves the cursor out of the search box.
   * If we receive a blur when we know someone is hovering we interpret as a
   * click. This is the best way I can think to do this without registering a
   * global window handler that breaks encapsulation. This problem would arise
   * in any framework - it's more of a challenge related to DOM programming.
   * todonow: make this work with a highlighted non-index.
   */
  onSearchBlur: function(value) {
    var S = this.state;
    return F.merge(S.someOneHovering && this.selectEntityIndex(S.usrCur), {
      isFocused: false
    });
  },

  /**
   * @selectEntityIndex: Returns a state fragement corresponding to the selection
   * (usualy via enter or click) of an entity.
   */
  selectEntityIndex: function(nextSelIdx) {
    var P = this.props, S = this.state;
    var nextSel = S.results.ordered[nextSelIdx];
    if (P.onEntityChosen) {
      P.onEntityChosen(nextSel);
    }
    return {
      usrCur: nextSelIdx,
      someOneHovering: false
    };
  },

  /* When the user clicks on some kind of a clear button (typicall only shown
   * when an entity is selected. */
  onUserClear: function() {
    this.props.onEntityChosen && this.props.onEntityChosen(null);
    return {
      userInputText: ''
    };
  },

  /**
   * @Compute a state fragment corresponding to user intending to move the
   * highlighted cursor. Just does a bunch of crazy modulo math.
   */
  userCursorMovement: function(d, wrap) {
    var S = this.state;
    var highlight = this.visibleHighlightPosition();
    var ordered = S.results.ordered;
    var wrappedHighlight = ((ordered.length + (highlight + d)) % ordered.length);
    return {
      usrCur: wrap || d > 0 && wrappedHighlight > highlight ||
              d < 0 && wrappedHighlight < highlight ? wrappedHighlight : NONE
    };
  },

  onSearchFocus: function() {
    if (!this.props.selectedEntity) {
      this.enqueueAsyncSearch();
    }
    return {
      isFocused: true,
      usrCur: NO_PREF_CUR
    };
  },

  /**
   * @inputTextToSearchFor: When an entity is selected, pressing backspace will
   * usually trigger a clearing of that selection (setting the user text to '').
   * So that those results are already ready and rendered/queried upon clearing
   * the selection, we'll ensure that the text to search for when selected is
   * the empty string.
   */
  inputTextToSearchFor: function() {
    return this.props.selectedEntity ? '' :
      this.state.userInputText;
  },

  /**
   * @inputTextToDisplay: What should be displayed in the text box.
   */
  inputTextToDisplay: function() {
    var selectedEntity = this.props.selectedEntity;
    return selectedEntity ?
        this.props.PresenterModule.extractEntityDisplayText(selectedEntity) :
        this.state.userInputText;
  },

  onSearchBackTabAttempt: function(e) {
    if (this.state.usrCur > ANTI_CUR) {
      e.preventDefault();
    }
    return this.userCursorMovement(MOVE_BACKWARD, DONT_WRAP);
  },

  onSearchTabAttempt: function(e) {
    var nextState = this.userCursorMovement(MOVE_FORWARD, DONT_WRAP);
    if (nextState.usrCur > ANTI_CUR) {
      e.preventDefault();
    }
    return nextState;
  },

  /**
   * @onEntityMouseOutIndex: Luckily the event system fixed mouse in/out to be
   * completely reliable and guaranteed to happen in an order that allows this
   * kind of logic.
   */
  onEntityMouseOutIndex: function() {
    return {
      someOneHovering: false,
      usrCur: this.props.clearCursorOnMouseOut ? ANTI_CUR : this.state.usrCur
    };
  },

  onEntityMouseInIndex: function(i) {
    return { usrCur: i, someOneHovering: true };
  },

  /**
   * @onSearchEnter: When the user hits enter, we select whatever's highlighted.
   */
  onSearchEnter: function() {
    return this.visibleHighlightPosition() !== NONE ?
        this.selectEntityIndex(this.visibleHighlightPosition()) :
        this.state;
  },

  /**
   * @structure: This is where it all goes down.
   */
  structure: function() {
    var S = this.state, P = this.props;
    return Div({

      classSet: { relZero: true },
      posInfo: P.posInfo,

      textInput: FTextInput({
        tabIndex: 4,
        placeholder: P.textInputPlaceholder,
        inputClassSet: [
          { SelectedTypeaheadInput: !!P.selectedEntity },
          P.PresenterModule.inputClassSet,
          P.selectedEntity && P.PresenterModule.selectedInputClassSet
        ],
        wrapperClassSet: { TypeaheadInputTextWrapper: true },
        value: this.inputTextToDisplay(),
        onTextChange: this.onSearchTextChange.bind(this),
        onTabAttempt: this.stateUpdater(this.onSearchTabAttempt),
        onBackTabAttempt: this.stateUpdater(this.onSearchBackTabAttempt),
        onDownArrowAttempt: this.stateUpdaterCurry(
            this.userCursorMovement, MOVE_FORWARD, DO_WRAP),
        onUpArrowAttempt: this.stateUpdaterCurry(
            this.userCursorMovement, MOVE_BACKWARD, DO_WRAP),
        onBlurValue: this.stateUpdater(this.onSearchBlur),
        onFocusValue: this.stateUpdater(this.onSearchFocus),
        onEnter: this.stateUpdater(this.onSearchEnter),
        onBackSpaceAttempt: this.onSearchBackSpaceAttempt.bind(this)
      }),

      placeWithInputWhenSelected: P.selectedEntity &&
          P.PresenterModule.SelectionDisplay({
            selectedEntity: P.selectedEntity,
            onUserClear: this.stateUpdater(this.onUserClear)
          }),

      presentation: P.PresenterModule.Presenter({
        shouldHide: !!this.shouldHideResults(),
        results: S.results,
        presenterModuleSpecificParams: P.presenterModuleSpecificParams,
        highlightedEntity: S.results.ordered[this.visibleHighlightPosition()],
        onEntityMouseInIndex: this.stateUpdater(this.onEntityMouseInIndex),
        onEntityMouseOutIndex: this.stateUpdater(this.onEntityMouseOutIndex),
        onEntityClickedIndex: this.stateUpdater(this.selectEntityIndex),
        hideGroupHeaders: !P.performGroupingWith && !P.oneGroupWithText
      })
    });
  }
});

module.exports = Typeahead;

module.exports.styleExports = {
  TypeaheadInputTextWrapper: {
    width: '100%'
  }
};

/*
 * -Todo: The selected state should be sacred, not considered for searching
 *  unless you break out of selection mode.
 * -Todo: handle onBlur of this in the non-cyclical transition, avoid two
 *  reflows
 * -Todo: Only maintain current highlighted on complete mouse out if the mode
 *  indicates it should happen (control based on whether or focus is in text box
 *  for example.) This would be very useful for nav style typeaheads, and/or
 *  always-open typeaheads.
 * -Todo: Option to retain focus even after clicking with mouse on entity and
 * -Todo: When only a single match exists while typing, it is highlighted, but
 *  pressing shift-tab does not unhighlight it leaving cursor in the search box,
 *  rather it moves focus away from the box entirely - likely wrapping logic
 *  issue. This is actually sometimes desirable - as it doesn't add any
 *  additionally required shift-tabs to cycle in the opposite direction if the
 *  user had tabbed into the typeahead.
 */
