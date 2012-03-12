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
 * positioned on any particular entity, and no reason to believe they want it
 * omitted. Anything larger than NO_PREF_CUR represents an intent that we should
 * take into consideration.
 */
var NONE = -1, NO_PREF_CUR = -2, ANTI_CUR = -1;

/**
 * Consts for readability.
 */
var MOVE_FORWARD = 1, MOVE_BACKWARD = -1, AND_WRAP = true, DONT_WRAP = false;

/**
 * @Modes:
 * - hide: Hides the results completely when selected.
 * - showAndSearchText: Selected entires exactly the same as regular text.
 * - showMatchedEntityOnly: The selected entity (and only it) will be shown.
 * - showAndSearchEmpty: Selected entry results in empty text search.
 */
var Modes = Typeahead.Modes = F.keyMirror({
  hide: null,
  showAndSearchText: null,
  showMatchedEntityOnly: null, /* Not yet supported - todo */
  showAndSearchEmpty: null
});

Typeahead.TypeaheadInput = F.Componentize({

  /**
   * @initState: Initializes and kicks off initial request.
   */
  initState: function(initProps) {
    window.setTimeout(F.bindNoArgs(this.triggerAsyncSearch, this),20);
    return {
      results: { ordered: [], groupInfos: [] },
      focused: false /*isFocused*/,
      selectedIdx: NONE,
      usrCur: NO_PREF_CUR,
      inputText: '',
      someOneHovering: false,
      searchTextIfDifferent: null
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
    var newResults = this.determineGroupAndOrderer().groupAndOrder(
        searchResponse.data);
    var indexOfCurInNew =
        F.indexOfStruct(newResults.ordered, S.results.ordered[S.usrCur]);
    var newCurIdx = S.usrCur === ANTI_CUR ? ANTI_CUR :
        S.usrCur === NO_PREF_CUR ? NO_PREF_CUR :
        indexOfCurInNew === NONE ? NO_PREF_CUR : indexOfCurInNew;

    return {
      results: newResults,
      usrCur: newCurIdx
    };
  },

  /**
   * @triggerAsyncSearch: Triggers an async request.
   */
  triggerAsyncSearch: function() {
    var searchTextIfDifferent = this.state.searchTextIfDifferent;
    this.determineSearcher().asyncSearch(
        searchTextIfDifferent !== null ? searchTextIfDifferent :
            this.state.inputText, this.stateUpdater(this.onSearchResults)
    );
  },

  shouldHideResults: function() {
    var S = this.state, P = this.props;
    var isSelected = S.selectedIdx !== NONE;
    return (!S.isFocused && P.forceHideWhenNotFocused) ||
      S.isFocused && isSelected && (P.focusedSelection === Modes.hide);
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
   * @onSearchTextChange: Be resilient to streaming results - not destroying
   * their cursor: Two extra measures can also be taken to preserve the user's
   * selction:
   * - Force usrCur entry to appear in the async results. (augment asyn results)
   * - Or if the usrCur isn't in the next async results, at least reset the
   * usrCur to NO_PREF_CUR, but make sure the enter key doesn't have any effect
   * for a half second after new results come back - don't show the blue cursor
   * for a while if it's not still present in search results.
   */
  onSearchTextChange: function(text) {
    this.updateState({
      inputText: text,
      selectedIdx: NONE,
      usrCur: NO_PREF_CUR,
      searchTextIfDifferent: null
    });
    this.triggerAsyncSearch();
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

  extractEntityDisplayText: function(entity) {
    return this.props.PresenterModule.extractEntityDisplayText(entity);
  },

  /**
   * @selectEntityIndex: Returns a state fragement corresponding to the selection
   * (usualy via enter or click) of an entity.
   */
  selectEntityIndex: function(nextSelIdx) {
    var P = this.props, S = this.state;
    var nextSel = S.results.ordered[nextSelIdx];
    var nextInputText = nextSel ? this.extractEntityDisplayText(nextSel) :
        P.inputText;
    var nextSearchTextIfDifferent =
      nextSel && P.focusedSelection === Modes.showAndSearchEmpty ? '' : null;
    if (nextSearchTextIfDifferent !== nextInputText) {
      window.setTimeout(this.triggerAsyncSearch.bind(this), 1);
    }
    if (P.onEntityChange) {
      P.onEntityChange(nextSel);
    }
    return {
      inputText: nextSel ? this.extractEntityDisplayText(nextSel) : P.inputText,
      searchTextIfDifferent: nextSearchTextIfDifferent,
      usrCur: nextSelIdx,
      selectedIdx: nextSelIdx,
      someOneHovering: false
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
    if (this.state.selectedIdx === NONE) {
      this.triggerAsyncSearch();
    }
    return {
      isFocused: true,
      usrCur: NO_PREF_CUR
    };
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
   * @onSearchEnter: When the user hits enter, we select whatever is
   * highlighted.
   */
  onSearchEnter: function() {
    return this.visibleHighlightPosition() !== NONE ?
        this.selectEntityIndex(this.visibleHighlightPosition()) :
        this.state;
  },

  structure: function() {
    var S = this.state, P = this.props;
    var isSelected = S.selectedIdx !== NONE;
    return Div({
      posInfo: P.posInfo,
      textInput: FTextInput({
        tabIndex: 4,
        placeholder: P.textInputPlaceholder,
        type: 'text',
        inputClassSet: {
          SelectedTypeaheadInput: isSelected,
          providedInputClassSet: P.PresenterModule.inputClassSet,
          providedSelectedInputClassSet:
              isSelected && P.PresenterModule.selectedInputClassSet
        },
        wrapperClassSet: { TypeaheadInputTextWrapper: true },
        value: S.inputText,
        onTextChange: this.onSearchTextChange.bind(this),
        onTabAttempt: this.stateUpdater(this.onSearchTabAttempt),
        onBackTabAttempt: this.stateUpdater(this.onSearchBackTabAttempt),
        onDownArrowAttempt: this.stateUpdaterCurry(
            this.userCursorMovement,
            MOVE_FORWARD,
            AND_WRAP),
        onUpArrowAttempt: this.stateUpdaterCurry(
            this.userCursorMovement,
            MOVE_BACKWARD,
            AND_WRAP),
        onBlurValue: this.stateUpdater(this.onSearchBlur),
        onFocusValue: this.stateUpdater(this.onSearchFocus),
        onEnter: this.stateUpdater(this.onSearchEnter)
      }),

      presentation: P.PresenterModule.Presenter({
        shouldHide: this.shouldHideResults(),
        results: S.results,
        presenterModuleSpecificParams: P.presenterModuleSpecificParams,
        highlightedResult: S.results.ordered[this.visibleHighlightPosition()],
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
 * Todo: The selected state should be sacred, not considered for searching
 * unless you break out of selection mode.
 * Todo: handle onBlur of this in the non-cyclical transition, avoid two reflows
 * Todo: Only maintain current highlighted on complete mouse out if the mode
 *       indicates it should happen (control based on whether or focus is in
 *       text box for example.) This would be very useful for nav style
 *       typeaheads, and/or always-open typeaheads.
 * Todo: Option to retain focus even after clicking with mouse on entity and
 */
