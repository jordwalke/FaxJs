/*
 * The concept of a 'Theme' is not a concept that the FaxJs framework knows
 * about. But FTheme is included as a 'coreComponent' so that several other core
 * compoennt modules such as InputElements may rely on it as a common place to
 * define dimensions. You'll likely want to augment this with your own
 * application constants, or switch out constants to match your application's
 * look and feel.
 * A theme doesn't produce style sheets by itself, but rather sets up constants
 * and functions for various modules to use in *their* stylesheet generation.
 * Another option is to roll your own method of generating style sheets and
 * completely ignore this file. (Some core componets rely on it though.)
 *
 * Tip: Keep everything in terms of rgba where possible until the time comes to
 * generate a styleModule (which expects all css values to be in string form.)
 * Keeping it in rgba form allows easier manipulation of colors (dodge/burn).
 * A couple of different approaches to theming:
 *
 */

var F = require('Fax'),
    FDom = require('FDom'),
    S = FDom.stylers;

var STANDARD_LINE_HEIGHT = 14;
var WHITE          = { r:255, g:255, b:255 };
var TEXT_DARK      = { r:51,  g:51, b:51 };
var TEXT_SUBHEADER = { r:100,  g:100, b:100 };
var TEXT_SUBTLE    = { r:128,  g:128, b:128 };


var SMALL = 5;
var MEDIUM = 10;
var LARGE = 15;

var intenseBlue = { r:90, g:117, b:200 };
var BASE         = { r:62,  g:62,  b:62 };
var BASE_BORDER  = { r:47,  g:47,  b:47 };
var SUB          = { r:109, g:132, b:180 };
var TOKEN        = { r:230, g:240, b:255 };
var TOKEN_BORDER = { r:189, g:199, b:220 };

var CONTROL_RADIUS = 0;

/**
 * Box Elements.
 */
var BOX_BLUE_BG       = { r:237, g:239, b:250 };
var BOX_BLUE_BORDER   = { r:216, g:223, b:239 };
var BOX_GRAY_BG       = { r:240, g:240, b:240 };
var BOX_GRAY_BORDER   = { r:202, g:202, b:202 };
var BOX_GRAY_LIGHT_BG = { r:246, g:246, b:246 };
var BOX_GRAY_LIGHT_BORDER = { r:228, g:228, b:228 };

/* Overlay */
var OVERLAY_BG_COLOR = WHITE;
var OVERLAY_BORDER_COLOR = { r: 140, g: 140, b: 140 };
var OVERLAY_BOTTOM_BORDER_COLOR = { r: 102, g: 102, b: 102 };
var OVERLAY_SHADOW_SPEC = { r: 0, g: 0, b: 0, a: 0.3, size: 8, x: 0, y: 3};

var CURSOR_END_COLOR = intenseBlue;
var CURSOR_START_COLOR  = S.burnDelta(intenseBlue, 10);
var CURSOR_BORDER_COLOR = CURSOR_START_COLOR;
var CURSOR_TEXT_COLOR   = WHITE;

/* Conversations */
var THREAD_BG_COLOR    = { r:240, g:240, b:240 };
var THREAD_NEW_ITEM_COLOR = { r:200, g:200, b:200 };
var THREAD_DIVIDER_DARK_COLOR = { r:224, g:224, b:224 };
var THREAD_DIVIDER_LIGHT_COLOR = { r:246, g:246, b:246 };

/* Inputs */
var INPUT_BORDER_PROMINENT = { r:157, g:167, b:184 };
var INPUT_BORDER_COLOR = { r: 185, g: 185, b: 185 };
var INPUT_BACKGROUND_COLOR = { r: 255, g: 255, b: 255 };
var INPUT_TEXT_COLOR = { r: 68, g: 68, b: 68 };
var INPUT_TEXT_COLOR_PLACEHELD = { r: 170, g: 170, b: 170 };


/**
 * Okay elements.
 */
var OKAY_BG            = { r:238, g:238, b:238 };
var OKAY_BG_HOVER      = S.burnDelta(OKAY_BG, 10);
var OKAY_BG_ACTIVE     = S.burnDelta(OKAY_BG, 20);

var OKAY_BORDER        = { r:165, g:165, b:165 };
var OKAY_BORDER_HOVER  = S.burnDelta(OKAY_BORDER, 20);
var OKAY_BORDER_ACTIVE = S.burnDelta(OKAY_BORDER, 20);

var OKAY_BORDER_BOTTOM        = { r:145, g:145, b:145 };
var OKAY_BORDER_BOTTOM_HOVER  = S.burnDelta(OKAY_BORDER_BOTTOM, 25);
var OKAY_BORDER_BOTTOM_ACTIVE = OKAY_BORDER_ACTIVE;

var OKAY_SHADOW_SPEC        = { r: 0, g: 0, b: 0, a: 0.05, size: 0, x: 0, y: 1};
var OKAY_SHADOW_SPEC_HOVER  = { r: 0, g: 0, b: 0, a: 0.10, size: 0, x: 0, y: 1};
var OKAY_SHADOW_SPEC_ACTIVE = { r: 0, g: 0, b: 0, a: 0.06, size: 0, x: 0, y: 1};

var OKAY_TEXT_COLOR    = TEXT_DARK;


/**
 * Confirm elements.
 */
var CONFIRM_BG            = intenseBlue ;
var CONFIRM_BG_HOVER      = S.burnDelta(CONFIRM_BG, 10);
var CONFIRM_BG_ACTIVE     = S.burnDelta(CONFIRM_BG, 20);

var CONFIRM_BORDER        = S.burnDelta(CONFIRM_BG, 20);
var CONFIRM_BORDER_HOVER  = S.burnDelta(CONFIRM_BORDER, 12);
var CONFIRM_BORDER_ACTIVE  = S.burnDelta(CONFIRM_BORDER, 12);

var CONFIRM_BORDER_BOTTOM        = S.burnDelta(CONFIRM_BORDER, 15);
var CONFIRM_BORDER_BOTTOM_HOVER  = S.burnDelta(CONFIRM_BORDER, 20);
var CONFIRM_BORDER_BOTTOM_ACTIVE  = CONFIRM_BORDER_ACTIVE;

var CONFIRM_SHADOW_SPEC        = { r: 0, g: 0, b: 0, a: 0.05, size: 0, x: 0, y: 1};
var CONFIRM_SHADOW_SPEC_HOVER  = { r: 0, g: 0, b: 0, a: 0.15, size: 0, x: 0, y: 1};
var CONFIRM_SHADOW_SPEC_ACTIVE = { r: 0, g: 0, b: 0, a: 0.08, size: 0, x: 0, y: 1};

var CONFIRM_TEXT_COLOR    = WHITE;

var LINK = S.burnDelta(intenseBlue, 30);

var COLORS = {
  white: WHITE,

  grayBgColor: BOX_GRAY_BG,
  grayBorderColor: BOX_GRAY_BORDER,
  grayLightBgColor: BOX_GRAY_LIGHT_BG,
  grayLightBorderColor: BOX_GRAY_LIGHT_BORDER,

  /* Text */
  textColor: TEXT_DARK,
  textColorSubHeader: TEXT_SUBHEADER,
  textColorSubtle: TEXT_SUBTLE,
  textColorLink: LINK,

  /* Page */
  pageBgColor: WHITE,
  topBarBgColor: BASE,
  topBarBorderColor: BASE_BORDER,

  /* Ui elements */
  tokenBgColor: TOKEN,
  tokenBorderColor: TOKEN_BORDER,
  cursorStartColor: CURSOR_START_COLOR,
  cursorEndColor: CURSOR_END_COLOR,
  cursorBorderColor: CURSOR_BORDER_COLOR,
  cursorTextColor: CURSOR_TEXT_COLOR,

  threadBgColor: THREAD_BG_COLOR,
  threadDividerTop: THREAD_DIVIDER_LIGHT_COLOR,
  threadDividerBottom: THREAD_DIVIDER_DARK_COLOR,


  /* Okay specs. */
  okayBgColor:  OKAY_BG,
  okayBgColorHovered: OKAY_BG_HOVER,
  okayBgColorActive: OKAY_BG_ACTIVE,

  okayBorderColor:  OKAY_BORDER,
  okayBorderColorHovered:  OKAY_BORDER_HOVER,
  okayBorderColorActive:  OKAY_BORDER_ACTIVE,

  okayBorderBottomColor:  OKAY_BORDER_BOTTOM,
  okayBorderBottomColorHovered: OKAY_BORDER_BOTTOM_HOVER,
  okayBorderBottomColorActive:  OKAY_BORDER_BOTTOM_ACTIVE,

  okayShadowSpec: OKAY_SHADOW_SPEC,
  okayShadowSpecHovered: OKAY_SHADOW_SPEC_HOVER,
  okayShadowSpecActive: OKAY_SHADOW_SPEC_ACTIVE,

  okayTextColor: OKAY_TEXT_COLOR,


  /* Confirm specs. */
  confirmBgColor:  CONFIRM_BG,
  confirmBgColorHovered: CONFIRM_BG_HOVER,
  confirmBgColorActive: CONFIRM_BG_ACTIVE,

  confirmBorderColor:  CONFIRM_BORDER,
  confirmBorderColorHovered:  CONFIRM_BORDER_HOVER,
  confirmBorderColorActive:  CONFIRM_BORDER_ACTIVE,

  confirmBorderBottomColor:  CONFIRM_BORDER_BOTTOM,
  confirmBorderBottomColorHovered: CONFIRM_BORDER_BOTTOM_HOVER,
  confirmBorderBottomColorActive:  CONFIRM_BORDER_BOTTOM_ACTIVE,

  confirmShadowSpec: CONFIRM_SHADOW_SPEC,
  confirmShadowSpecHovered: CONFIRM_SHADOW_SPEC_HOVER,
  confirmShadowSpecActive: CONFIRM_SHADOW_SPEC_ACTIVE,

  confirmTextColor: CONFIRM_TEXT_COLOR,

  /* You can intensify something. In day mode makes brighter, night mode -
   * darker. In other words, closer to the base color. */
  intensify: S.dodgeDelta,

  /* You can contrast something. In day mode makes darker, night mode -
   * brighter. In other words, closer to the base color. */
  contrast:  S.burnDelta,

  /** Text inputs */
  textInputBorderColor: INPUT_BORDER_COLOR,
  textInputBorderColorProminent: INPUT_BORDER_PROMINENT,
  textInputBackgroundColor: INPUT_BACKGROUND_COLOR,
  textInputTextColor: INPUT_TEXT_COLOR,
  textInputTextColorPlaceheld: INPUT_TEXT_COLOR_PLACEHELD,

  /* Overlays */
  overlayBgColor: OVERLAY_BG_COLOR,
  overlayBorderColor: OVERLAY_BORDER_COLOR,
  overlayBottomBorderColor: OVERLAY_BOTTOM_BORDER_COLOR,
  overlayBoxShadow: OVERLAY_SHADOW_SPEC,

  small: SMALL,
  medium: MEDIUM,
  large: LARGE
};

var DIMS = {
  standardLineHeight: 14,
  controlsRadius: CONTROL_RADIUS,
  controlsFontSize: 11,
  textInputFontSize: 12,
  controlsHeight: 24,
  borderThick: 1
};

module.exports = F.merge(COLORS, DIMS);
