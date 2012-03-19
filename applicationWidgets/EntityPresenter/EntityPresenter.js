var F = require('Fax'),
    FDom = require('FDom'),
    stylers = FDom.stylers,
    TypeaheadUtils = require('TypeaheadUtils'),
    T = require('FTheme'),
    Div = FDom.Div, Img = FDom.Img;

var ENTITY_HEIGHT = 58;
var ENTITY_INFO_LEFT = 66;
var HEADER_TOP_MARGIN = 4;
var HEADER_HEIGHT = 20;

var IMAGE_MARGIN = 3;

function NAME_EXTRACTOR(entity) {
  return entity.name;
}

var SelectionDisplay = F.Componentize({
  structure: function() {
    return Div({
      classSet: {SelectionDisplay: true},
      image: FDom.Img({
        classSet: {SelectionDisplayImg: true},
        src: this.props.selectedEntity.picture
      }),
      clearButton: Div({
        classSet: {SelectionDisplayClear: true, cursorPointer: true},
        onClick: this.props.onUserClear
      })
    });
  }
});

var Header = F.Componentize({
  structure: function() {
    return Div({
      classSet: { EntitySetHeader: true },
      content: this.props.groupInfo.text
    });
  }
});

var EntityLink = F.Componentize({
  structure: function() {
    return Div({
      onMouseIn: this.props.entityLinkOnMouseIn,
      onMouseOut: this.props.entityLinkOnMouseOut,
      onClick: this.props.entityLinkOnClick,
      classSet: {
        EntityLink: true,
        EntityLinkHighlighted: this.props.highlighted
      },

      entityLinkPhoto: Img({
        classSet: { EntityLinkPhoto: true },
        src: this.props.entity.picture 
      }),

      entityLinkInfoDiv: Div({
        classSet: { EntityLinkInfo: true },
        titleText: Div({
          classSet: {
            EntityLinkTitleText: true,
            EntityLinkTitleTextNatural: !this.props.highlighted,
            EntityLinkHighlightText: this.props.highlighted
          },
          content: this.props.entity.name
        }),

        detail: Div({
          classSet: {
            EntityLinkDetailText: true,
            EntityLinkDetailTextNatural: !this.props.highlighted,
            EntityLinkHighlightText: this.props.highlighted
          },
          content: this.props.entity.detail || ''
        })
      })
    });
  }
});

var EntityPresenter = F.Componentize({
  structure: function () {
    var P = this.props;
    /* The top pos info is off by  1 pixel in IE, and if you count pixels - IE
     * might be right (gasp!). We should probably special case IE with browser
     * detection or css rules.  */
    return Div({
      classSet: {
        hdn: !P.results.ordered.length || P.shouldHide,
        EntitySetContainer: true
      },
      arrow: Div({
        classSet: {
          EntitySetArrow: true,
          EntitySetArrowByGroup: !P.hideGroupHeaders,
          EntitySetArrowByBackground: P.hideGroupHeaders
        }
      }),
      presentation: Div({
        classSet: { EntitySet: true },
        childSet: TypeaheadUtils.constructGroups(Header, EntityLink, P)
      })
    });
  }
});

/**
 * Typeaheads expect our module to provide implementations of:
 *
 * -Presenter: a presenter Ui component.
 * -inputClassSet: a class set to be applied to attached text boxes.
 * -selectedInputClassSet: a class set to be applied to text boxes when
 *  selected.
 */
module.exports = {
  Presenter: EntityPresenter,

  /* Constructor of component to inject into the container along side the text
   * box. (To show an x, or some other display about the selection). Accepts
   * props of the form {entity: E, onUserClear: F} . */
  SelectionDisplay: SelectionDisplay,

  extractEntityDisplayText: NAME_EXTRACTOR,

  inputClassSet: {
    EntitySetInput: true
  },

  selectedInputClassSet: {
    EntitySetInputSelected: true
  },


};



/**
 * Style declarations for EntityPresenter.
 */
module.exports.styleExports = {
  EntitySetContainer: {
    position: 'relative',
    top: -1
  },

  EntitySetArrow: {
    zIndex: 200,
    position: 'absolute',
    left: 25,
    marginLeft: -8,
    height: 9,
    width: 16,
    top: 2
  },

  EntitySetArrowByGroup: {
    background: stylers.imageBgValue(T.overlayUpArrowImageGrayUri, 0, 0)
  },
  EntitySetArrowByBackground: {
    background: stylers.imageBgValue(T.overlayUpArrowImageLightUri, 0, 0)
  },

  EntitySet: {
    position: 'absolute',
    top: 10,
    'overflow-x': 'hidden',
    width: '100%',
    background: FDom.stylers.rgbaStr(T.overlayBgColor),
    border: stylers.borderValue(T.overlayBorderColor),
    borderBottom: stylers.borderValue(T.overlayBottomBorderColor),
    boxSizing: stylers.boxSizingValue('border-box'),
    boxShadow: stylers.blackBoxShadowValue(
      F.merge(T.overlayBoxShadow, {a: T.overlayBoxShadow.a})
    ),
    // When combined with padding of each entity -
    // creates eight pixels of vertical whitespace.
    paddingBottom: 4,
    cursor: 'default'
  },

  EntityLinkInfo: {
    position: 'absolute',
    left: ENTITY_INFO_LEFT, 
    top: 0, bottom: 0, right: 0,
    padding: 3
  },

  EntityLink: {
    /**
     * It *shouldn't* matter if we have trans border here, since the boxSizing
     * is border-box, but FF 3.6.2 has children positioned from the border, not
     * the actual container!
     */
    minWidth: 400,
    borderTop: stylers.borderValue('transparent'),
    boxSizing: stylers.boxSizingValue('border-box'),
    position: 'relative',
    display: 'block',
    height: ENTITY_HEIGHT,
    fontSize: 11,
    overflow: 'hidden'
  },

  EntityLinkPhoto: {
    position: 'absolute',
    left: 8, top: 3, height: 50, width: 50
  },

  EntityLinkTitleText: {
    boxSizing: stylers.boxSizingValue('border-box'),
    paddingTop: 5,
    height: 14,
    display: 'block',
    fontWeight: 'bold'
  },

  EntityLinkTitleTextNatural: {
    color: stylers.rgbaStr(T.textColorSubHeader)
  },

  EntityLinkDetailText: {
    display: 'block',
    boxSizing: stylers.boxSizingValue('border-box'),
    paddingTop: '5px',
    height: 14
  },

  EntityLinkDetailTextNatural: {
    color: stylers.rgbaStr(T.textColorSubHeader)
  },

  EntityLinkHighlightText: {
    color: '#fff',
    'text-shadow': '0 1px 0  rgba(0,0,0, 0.15)'
  },

  EntityLinkHighlighted: {
    color: '#fff',
    borderTop: stylers.borderValue(T.cursorBorderColor),
    borderBottom: stylers.borderValue(T.cursorBorderColor),
    background: stylers.bgGradientValue(T.cursorStartColor, T.cursorEndColor)
  },

  EntitySetHeader: {
    fontSize: 11,
    lineHeight: HEADER_HEIGHT,
    fontWeight: 'bold',
    backgroundColor: stylers.rgbaStr(T.grayBgColor),
    boxSizing: stylers.boxSizingValue('border-box'),
    borderTop: stylers.borderValue(T.grayLightBorderColor),
    color: stylers.rgbaStr(T.textColor),
    height: HEADER_HEIGHT,
    marginTop: HEADER_TOP_MARGIN,
    paddingRight: 15,
    paddingLeft: 6,
    left: 0,
    right: 0
  },

  EntitySetInputSelected: {
    backgroundColor: stylers.rgbaStr(T.tokenBgColor),
    border: stylers.borderValue(T.tokenBorderColor),

    /* We'll now have an image that is as wide (including margins) as the text
     * box is tall - but still add the standard left padding of 5 */
    paddingLeft: T.controlsHeight
  },

  SelectionDisplay: {
    boxSizing: stylers.boxSizingValue('border-box'),
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0
  },

  SelectionDisplayClear: {
    position: 'absolute',
    opacity: 0.3,
    lineHeight: T.textInputFontSize,
    bottom: 0,
    width: 20,
    right: 3,
    top: 0,
		'background-repeat': 'no-repeat',
		'background-position': 'center center',
		backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAANElEQVQImYWNOwoAMAhDX3r/WY9rJ0EDpVlCyA8ggGKjgJAZS2skHdIQvvBvPj8PkPbfnBdBpgtgztbSTgAAAABJRU5ErkJggg==)'
  },

  SelectionDisplayImg: {
    boxSizing: stylers.boxSizingValue('border-box'),
    position: 'absolute',
    top: IMAGE_MARGIN,
    bottom: IMAGE_MARGIN,
    left: IMAGE_MARGIN,
    height: T.controlsHeight - 2*IMAGE_MARGIN,
    width: T.controlsHeight - 2*IMAGE_MARGIN
  }

};

/* Style rules that will be sensitive to key compression. */
module.exports.styleExports[stylers.firstChildKey({EntitySetHeader:1})] = {
  'border-top-style': 'none',
  marginTop: 0
};

/**
 * If there is no grouping info, showing a little space above the highlighted
 * portion works well when showing the white arrow.
 */
module.exports.styleExports[stylers.firstChildKey({EntityLink:1})] = {
  // With entity link padding, creates eight pixels of vertical whitespace, just
  // like the distance between each of the pictures (white space).
  marginTop: 4
};
