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
var BLACK          = { r:0, g:0, b:0 };
var TEXT_DARK      = { r:51,  g:51, b:51 };
var TEXT_SUBHEADER = { r:100,  g:100, b:100 };
var TEXT_SUBTLE    = { r:128,  g:128, b:128 };


var SMALL = 5;
var MEDIUM = 10;
var LARGE = 15;

  var intenseBlue = { r: 114, g: 137, b: 164 };
  var aqua = {r:118, g:169, b:161};
  var forest = {r: 100, g:115, b:94};
  var moss = {r: 117, g:132, b:101};
  var redish = {r: 174, g: 81, b: 55};
  var hlColor = forest;

  var BASE         = S.burnDelta(hlColor, 20);
  var BASE_BORDER  = S.burnDelta(BASE, 50);
  var SUB          = { r:109, g:132, b:180 };
  var TOKEN        = S.dodgeFactor(S.toneItDown(hlColor, 0.75), 0.85);
  var TOKEN_BORDER = S.burnFactor(TOKEN, 0.15);

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

  /* Overlay: Note, we could also have overlays with regions that are not the
   * same bgcolor as OVERLAY_BG_COLOR. */

  var OVERLAY_BG_COLOR = WHITE;
  var OVERLAY_BORDER_COLOR = { r: 150, g: 150, b: 150 };
  var OVERLAY_BOTTOM_BORDER_COLOR = { r: 118, g: 118, b: 118 };
  var OVERLAY_SHADOW_SPEC = { r: 0, g: 0, b: 0, a: 0.18, size: 8, x: 0, y: 3};
  var OVERLAY_UP_ARROW_IMAGE_LIGHT_URI = '/staticResources/images/jordowTriangleUp_bg_255_border_150.png';
  var OVERLAY_UP_ARROW_IMAGE_GRAY_URI = '/staticResources/images/jordowTriangleUp_bg_240_border_150.png';

  var CURSOR_END_COLOR = hlColor;
  var CURSOR_START_COLOR  = S.burnDelta(hlColor, 10);
  var CURSOR_BORDER_COLOR = CURSOR_START_COLOR;
  var CURSOR_TEXT_COLOR   = WHITE;

  /* Conversations */
  var THREAD_BG_COLOR    = { r:240, g:240, b:240 };
  var THREAD_NEW_ITEM_COLOR = { r:200, g:200, b:200 };
  var THREAD_DIVIDER_DARK_COLOR = { r:224, g:224, b:224 };
  var THREAD_DIVIDER_LIGHT_COLOR = { r:246, g:246, b:246 };

  /* Inputs */
  var INPUT_BORDER_PROMINENT = { r:157, g:167, b:184 };
  var INPUT_BORDER_COLOR = S.dodgeFactor(S.toneItDown(hlColor, 0.6), 0.5);//{ r: 185, g: 185, b: 185 };
  var INPUT_BORDER_COLOR_FOCUS = S.burnDelta(INPUT_BORDER_COLOR, 15);
  var INPUT_BORDER_FOCUSED = { r: 185, g: 185, b: 185 };
  var INPUT_BACKGROUND_COLOR = { r: 255, g: 255, b: 255 };
  var INPUT_TEXT_COLOR = { r: 68, g: 68, b: 68 };
  var INPUT_TEXT_COLOR_PLACEHELD = { r: 170, g: 170, b: 170 };
  var INPUT_FOCUS_OUTSET_SHADOW_SPEC = F.merge(S.dodgeFactor(hlColor, 0.5), {
    a: 0.5, size: 8, x: 0, y: 0
  });


  /**
   * Okay elements.
   */
  var OKAY_BG            = { r:234, g:234, b:234 };
  var OKAY_BG_HOVER      = S.burnDelta(OKAY_BG, 8);
  var OKAY_BG_ACTIVE     = S.burnDelta(OKAY_BG, 18);

  var OKAY_BORDER        = S.burnDelta(OKAY_BG, 75);
  var OKAY_BORDER_BOTTOM = S.burnDelta(OKAY_BG, 105);

  var OKAY_BORDER_HOVER  = S.burnDelta(OKAY_BG, 105);
  var OKAY_BORDER_BOTTOM_HOVER = S.burnDelta(OKAY_BG, 125);

  var OKAY_BORDER_ACTIVE = OKAY_BORDER_HOVER;
  var OKAY_BORDER_BOTTOM_ACTIVE = OKAY_BORDER_ACTIVE;

  var OKAY_SHADOW_SPEC        = { a: 0.05, size: 0, x: 0, y: 1};
  var OKAY_SHADOW_SPEC_INSET  = { a: 0.7, size: 0, x: 0, y: 1};
  var OKAY_SHADOW_SPEC_HOVER  = { a: 0.10, size: 0, x: 0, y: 1};
  var OKAY_SHADOW_SPEC_INSET_HOVER  = { a: 0.15, size: 0, x: 0, y: 1};
  var OKAY_SHADOW_SPEC_ACTIVE = { a: 0.06, size: 0, x: 0, y: 1};
  var OKAY_SHADOW_SPEC_INSET_ACTIVE = { a: 0.0, size: 0, x: 0, y: 1};

  var OKAY_TEXT_COLOR    = TEXT_DARK;


  /**
   * Confirm elements.
   */
  var CONFIRM_BG            = S.burnDelta(hlColor, 10);
  var CONFIRM_BG_HOVER      = S.burnDelta(CONFIRM_BG, 6);
  var CONFIRM_BG_ACTIVE     = S.burnDelta(CONFIRM_BG, 12);

  var CONFIRM_BORDER        = S.burnDelta(CONFIRM_BG, 30);
  var CONFIRM_BORDER_BOTTOM = S.burnDelta(CONFIRM_BG, 55);

  var CONFIRM_BORDER_HOVER  = S.burnDelta(CONFIRM_BG, 60);
  var CONFIRM_BORDER_BOTTOM_HOVER  = S.burnDelta(CONFIRM_BG, 75);

  var CONFIRM_BORDER_ACTIVE  = CONFIRM_BORDER_HOVER;
  var CONFIRM_BORDER_BOTTOM_ACTIVE  = CONFIRM_BORDER_HOVER;

  var CONFIRM_SHADOW_SPEC        = { a: 0.07, size: 0, x: 0, y: 1};
  var CONFIRM_SHADOW_SPEC_INSET  = { a: 0.07, size: 0, x: 0, y: 1};
  var CONFIRM_SHADOW_SPEC_HOVER  = { a: 0.16, size: 0, x: 0, y: 1};
  var CONFIRM_SHADOW_SPEC_INSET_HOVER  = { a: 0.07, size: 0, x: 0, y: 1};
  var CONFIRM_SHADOW_SPEC_ACTIVE = { a: 0.08, size: 0, x: 0, y: 1};
  var CONFIRM_SHADOW_SPEC_INSET_ACTIVE = { a: 0.0, size: 0, x: 0, y: 1};

  var CONFIRM_TEXT_COLOR    = WHITE;

  var LINK = S.burnDelta(hlColor, 30);


var COLORS = {
  white: WHITE,
  black: BLACK,

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
  okayShadowSpecInset: OKAY_SHADOW_SPEC_INSET,
  okayShadowSpecHovered: OKAY_SHADOW_SPEC_HOVER,
  okayShadowSpecInsetHovered: OKAY_SHADOW_SPEC_INSET_HOVER,
  okayShadowSpecActive: OKAY_SHADOW_SPEC_ACTIVE,
  okayShadowSpecInsetActive: OKAY_SHADOW_SPEC_INSET_ACTIVE,

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
  confirmShadowSpecInset: CONFIRM_SHADOW_SPEC_INSET,
  confirmShadowSpecHovered: CONFIRM_SHADOW_SPEC_HOVER,
  confirmShadowSpecInsetHovered: CONFIRM_SHADOW_SPEC_INSET_HOVER,
  confirmShadowSpecActive: CONFIRM_SHADOW_SPEC_ACTIVE,
  confirmShadowSpecInsetActive: CONFIRM_SHADOW_SPEC_INSET_ACTIVE,

  confirmTextColor: CONFIRM_TEXT_COLOR,

  /* You can intensify something. In day mode makes brighter, night mode -
   * darker. In other words, closer to the base color. */
  intensify: S.dodgeDelta,

  /* You can contrast something. In day mode makes darker, night mode -
   * brighter. In other words, closer to the base color. */
  contrast:  S.burnDelta,

  /** Text inputs */
  textInputBorderColor: INPUT_BORDER_COLOR,
  textInputBorderColorFocus: INPUT_BORDER_COLOR_FOCUS,
  textInputBorderColorProminent: INPUT_BORDER_PROMINENT,
  textInputBackgroundColor: INPUT_BACKGROUND_COLOR,
  textInputTextColor: INPUT_TEXT_COLOR,
  textInputTextColorPlaceheld: INPUT_TEXT_COLOR_PLACEHELD,
  textInputFocusOutsetShadowSpec: INPUT_FOCUS_OUTSET_SHADOW_SPEC,

  /* Overlays */
  overlayBgColor: OVERLAY_BG_COLOR,
  overlayBorderColor: OVERLAY_BORDER_COLOR,
  overlayBottomBorderColor: OVERLAY_BOTTOM_BORDER_COLOR,
  overlayBoxShadow: OVERLAY_SHADOW_SPEC,

  overlayUpArrowImageLightUri: OVERLAY_UP_ARROW_IMAGE_LIGHT_URI,
  overlayUpArrowImageGrayUri: OVERLAY_UP_ARROW_IMAGE_GRAY_URI,

  small: SMALL,
  medium: MEDIUM,
  large: LARGE
};

var DIMS = {
  standardLineHeight: 14,
  controlsRadius: CONTROL_RADIUS,
  controlsFontSize: 12,
  textInputFontSize: 12,
  controlsHeight: 24,
  borderThick: 1
};

module.exports = F.merge(COLORS, DIMS);
