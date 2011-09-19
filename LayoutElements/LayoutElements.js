var F = require('Fax'),
    LayoutElements = {},
    FaxUi = require('FaxUi');

F.using(LayoutElements, FaxUi);

/**
 * LayoutElements.MaterialView: Simple class that maps convenient properties to
 * a component instance made from a couple divs. Material as in 'the stuff that
 * physically constitutes something.' Think of as building blocks that look
 * somewhat like physical objects.
 */
LayoutElements.MaterialView = {
  project : function() {
    return {
      overrides: F.merge(this.props, this.props.overrides),
      clssSet: {
        texturedObject: true,
        texturedObjectLargeCorners: !!this.props.largeMode,
        texturedObjectSmallCorners: !this.props.largeMode
      },
      lighting: {
        clssSet: {
          texturedObjectLighting: true,
          texturedObjectHighlightLighting: !!this.props.highlighted,
          texturedObjectStandardLighting: !this.props.highlighted,
          largerTexturedObjectLighting: !!this.props.largeMode,
          smallerTexturedObjectLighting: !this.props.largeMode
        }
      }.FView()
    }.FView();
  }
};

/**
 * LayoutElements.MaterialButton:
 */
LayoutElements.MaterialButton = {
  project : function() {
    return {
      overrides: this.props,
      highlighted: this.props.highlighted,
      buttonText: {
        innerHtml: F.TextNode(this.props.text ? this.props.text : '')
      }.Span()
    }.MaterialView();
  }
};


/**
 * LayoutElements.MaterialEmbedding: Intended to be included inside a material
 * view. Gives the appearance of being inset.
 */
LayoutElements.MaterialEmbedding = {
  project : function() {
    var shouldUseLarge =
        (this.props.embedded && this.props.embedded.props.largeMode) ||
        this.props.largeMode;
    return {
      overrides: this.props,
      clssSet: {
        largeEmbedding: shouldUseLarge,
        smallEmbedding: !shouldUseLarge
      }
    }.FView();
  }
};


/**
 * LayoutElements.PhysicalButton:
 */
LayoutElements.PhysicalButton = {
  project : function() {
    return {
      onClick: function(abstractEvent) {
        abstractEvent.preventDefault();
      },
      clssSet: {buttonAnchor: true, texturedObject: true,
        smallerTexturedObject: true},
      overrides: F.objExclusion(this.props, {text: true}),
      href: F.TextNode('http://www.facebook.com'),
      physicalObject: {
        lighting: {
          clss: F.TextNode('abs texturedObjectLighting smallerTexturedObjectLighting')
        }.Div(),
        buttonText: {
          innerHtml: F.TextNode(this.props.text)
        }.Span()
      }.ViewDiv()
    }.ViewA();
  }
};


/**
 * LayoutElements.EmbeddedBorderView: Positioning and clssSet applies to the
 * outermost view. Everything else (ideally only children), get passed to the
 * embedded material view.
 */
LayoutElements.EmbeddedBorderView = {
  project : function() {
    return {
      t: this.props.t, r: this.props.r, b: this.props.b, w: this.props.w,
      l: this.props.l, clssSet: this.props.clssSet,
      largeMode: true,
      embedding: { t: 8, l: 8, b: 8, r: 8,
        embeddedObject: {
          highlighted: true,
          overrides: F.objExclusion(this.props, F.POS_CLSS_KEYS)
        }.MaterialView()
      }.MaterialEmbedding()
    }.MaterialView();
  }
};



module.exports = F.ComponentizeAll(LayoutElements);

/** If theme === 'Black' */
module.exports.styleExports = {
  hovering: {
    boxShadow: FaxUi.stylers.boxShadowValue(0, 15, 15, 0,0,0, 0.35)
  },

  texturedObject: {
    color: 'rgb(230,230,230); color: rgba(250,250,250, .8)',
    'text-shadow': '-1px 1px 1px rgba(0,0,0,.9)',
    fontSize: '13px',
    border: '1px solid black',
    backgroundImage: 'url("/images/darkGrain.png")'
  },

  texturedObjectLargeCorners: {
    borderRadius: FaxUi.stylers.roundValue(4)
  },
  texturedObjectSmallCorners: {
    borderRadius: FaxUi.stylers.roundValue(3)
  },

  texturedObjectLighting: {
    borderTop: '1px solid rgba(255,255,255, .8)',
    borderRight: '1px solid rgba(180,180,180, .5)',
    borderLeft: '1px solid rgba(180,180,180, .5)',
    borderBottom: 'none',
    left: 0, right: 0, top: 0, bottom: 0
  },
  texturedObjectStandardLighting: {
    opacity: 0.12,
    background: FaxUi.stylers.backgroundBottomUpGradientValue(
        15,15,15, 90,
        170,170,170, 90)
  },
  texturedObjectHighlightLighting: {
    opacity: 0.2 ,
    background: FaxUi.stylers.backgroundBottomUpGradientValue(
        100,100,100, 90,
        170,170,170, 90)
  },
  largerTexturedObjectLighting: {
    borderRadius: FaxUi.stylers.roundValue(4)
  },
  smallerTexturedObjectLighting: {
    borderRadius: FaxUi.stylers.roundValue(3)
  },

  buttonAnchor: {
    outline: 0,
    'text-decoration': 'none',
    display: 'inline-block'
  },

  largeEmbedding: {
    backgroundColor: 'rgb(10,10,10); background-color: rgba(10,10,10,.85)',
    borderBottom: '1px solid rgba(100,100,100, .25)',
    borderRadius: FaxUi.stylers.roundValue(4)
  },

  smallEmbedding: {
    backgroundColor: 'rgb(10,10,10); background-color: rgba(10,10,10,.85)',
    borderBottom: '1px solid rgba(100,100,100, .25)',
    borderRadius: FaxUi.stylers.roundValue(3)
  }
};
