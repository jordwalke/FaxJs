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
 * 1. You could place in this file, only values that you anticipate multiple
 * modules/generated style sheets taking advantage of.
 * 2. Or you could place *all* values in this file.
 *
 * TODO: We should allow marking a projectModule in ProjectConfig.js as a theme
 * file, which will be merged into a single theme "object" that is the export of
 * require('FTheme'). At that point, a theme would actually be a recognized
 * concept by the FaxJs build system, but still not by FaxJs itself.
 * (Kind of like how styleExports is recognized by the build system, but not the
 * core framework itself.)
 */

var F = require('Fax'),
    FaxUi = require('FaxUi');


/* This theme file assumes that the ui has two potential modes of operation -
 * light background and dark background. (Called Night and Day to make naming
 * clear) */
var NIGHT_MODE = {
  bgColor: { r: 5, g: 5, b: 5 },
  textColor: { r: 235, g: 235, b: 235 },
  textColorSubtle: { r: 180, g: 180, b: 180 },
  textColorReallySubtle: { r: 102, g: 102, b: 102 },
  textColorReallyReallySubtle: { r: 80, g: 80, b: 80 },

  mildBgColor: { r: 26, g: 26, b: 26 },
  reallyMildBgColor: { r: 34, g: 34, b: 34 },

  borderColor: { r: 30, g: 30, b: 30 },
  borderColorHighContrast: { r: 40, g: 40, b: 40 },
  borderColorReallyHighContrast: { r: 90, g: 90, b: 90 },

  /* if day mode full is white, fullInvert is black - night is the opposite. */
  fullColor: {r: 0, g: 0, b: 0},
  fullInvertColor: {r: 255, g: 255, b: 255},

  /* Various action colors for things such as buttons etc. */
  okayBgColor:  { r:80, g:107, b:190, a:1 },
  okayTextColor: { r: 255, g: 255, b: 255 },
  okayBorderDiff: 5,
  dangerBgColor: { r:130, g:63, b:41, a:1 },
  dangerBorderDiff: 5,
  dangerTextColor: { r: 240, g: 240, b: 240 },
  normalBgColor:  { r:40, g:40, b:40, a:1 },
  normalBorderDiff: 5,
  normalTextColor: { r: 230, g: 230, b: 230 },
  /* When a normal color is shown on a 'really mild' background, we may need to
   * contrast the background color a little more to make it stand out. Use what
   * looks best. */
  normalContrastedBgColor:  { r:23, g:23, b:23, a:1 },
  normalContrastedBorderDiff: 0,
  normalContrastedTextColor: { r: 230, g: 230, b: 230 },

  /* You can intensify something. In day mode makes brighter, night mode -
   * darker. In other words, closer to the base color. */
  intensify: FaxUi.stylers.burnDelta,

  /* You can contrast something. In day mode makes darker, night mode -
   * brighter. In other words, closer to the base color. */
  contrast:  FaxUi.stylers.dodgeDelta,

  /*
   * Box shadows need light values.
   */
  boxShadowValue: function(xYSizeA) {
    return FaxUi.stylers.boxShadowValue(F.merge(xYSizeA, {r: 255, g: 255, b: 255}));
  },
  

  /*
   * Because input elements usually go on top of some kind of "paneling",
   * choose a background/border that will look good with paneling, and
   * the input element background color.
   */
  textInputBorderColor: { r: 60, g: 60, b: 60 },
  textInputBackgroundColor: { r: 60, g: 60, b: 60 },

  textInputFontColor: { r: 245, g: 245, b: 245 },
  textInputFontColorPlaceheld: { r: 102, g: 102, b: 102 },

  entirePageBg: { r: 30, g: 30, b: 30 }
};

var DAY_MODE = {
  bgColor: {r: 255, g: 255, b: 255},
  textColor: { r: 20, g: 20, b: 20 },
  textColorSubtle: { r: 95, g: 95, b: 95 },
  textColorReallySubtle: { r: 150, g: 150, b: 150 },
  textColorReallyReallySubtle: { r: 204, g: 204, b: 204 },

  mildBgColor: {r:245, g:245, b:245 },

  reallyMildBgColor: {r:235, g:235, b:235 },

  borderColor: { r: 235, g: 235, b: 235 },
  borderColorHighContrast: {
    r: 205, g: 205, b:205
  },
  borderColorReallyHighContrast: {
    r: 185, g: 185, b:185
  },

  /* if day mode full is white, fullInvert is black - night is the opposite. */
  fullColor: {r: 255, g: 255, b: 255},
  fullInvertColor: {r: 0, g: 0, b: 0},


  /* Various action colors for things such as buttons etc. */
  okayBgColor:  { r:90, g:117, b:200, a:1 },
  okayTextColor: { r: 255, g: 255, b: 255 },
  dangerBgColor: { r:140, g:73, b:51, a:1 },
  dangerTextColor: { r: 255, g: 255, b: 255 },
  normalBgColor:  { r:232, g:232, b:232, a:1 },
  normalTextColor: { r: 70, g: 70, b: 70 },
  normalBorderDiff: 30,
  dangerBorderDiff: 15,
  okayBorderDiff: 15,
  /* When a normal color is shown on a 'really mild' background, we may need to
   * contrast the background color a little more to make it stand out. Use what
   * looks best. */
  normalContrastedBgColor:  {r:240, g:240, b:240 },
  normalContrastedBorderDiff: -25,
  normalContrastedTextColor: { r: 70, g: 70, b: 70 },

  /* You can intensify something. In day mode makes brighter, night mode -
   * darker. In other words, closer to the base color. */
  intensify: FaxUi.stylers.dodgeDelta,

  /* You can contrast something. In day mode makes darker, night mode -
   * brighter. In other words, closer to the base color. */
  contrast:  FaxUi.stylers.burnDelta,

  /*
   * Because input elements usually go on top of some kind of "paneling",
   * choose a background/border that will look good with paneling, and
   * the input element background color.
   */
  textInputBorderColor: { r: 185, g: 185, b: 185 },
  textInputBackgroundColor: { r: 255, g: 255, b: 255 },

  entirePageBg: { r: 231, g: 231, b: 231 },
  textInputFontColor: { r: 68, g: 68, b: 68 },
  textInputFontColorPlaceheld: { r: 170, g: 170, b: 170 },

  /*
   * Box shadows need light values.
   */
  boxShadowValue: function(xYSizeA) {
    return FaxUi.stylers.boxShadowValue(F.merge(xYSizeA, {r: 0, g: 0, b: 0}));
  }

};

/* Flip this switch to toggle app theme mode. When adding global constants here,
 * make sure to add them to each mode if necessary and reference
 * 'mode.yourNewField'. */
var mode = DAY_MODE;


module.exports = F.merge(mode, {

  /* Flat is the new round. */
  interfaceElementsRadius: 0,
  interfaceElementsControlFontSize: 11,

  /* Things like buttons, or customized text/select boxes. The total height,
   * which the widget designer must represent all physical size of a control
   * (including border, padding etc.) */
  interfaceControlsTotalHeight: 23,

  borderThick: 1,

  /* Sometimes we just need these no matter how dark/light night/day is. */
  white: { r: 255, g: 255, b: 255 },
  black: {r: 0, g: 0, b: 0},

  textInputFontSize: 12

});
