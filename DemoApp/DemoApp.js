var F = require('Fax'), FaxUi = require('FaxUi'),
    LayoutDesigner = require('LayoutDesigner'),
    FWidgets = require('FWidgets'),
    ControlPanel = require('ControlPanel'),
    LayoutElements = require('LayoutElements'),
    DemoApp = {};

/**
 * Allows declarative tail construction of all Components that are in the
 * exports of those modules: x = {content: 'dog'}.Div() as opposed to x =
 * FaxUi.Div({content: 'dog'})
 * Depending on the use case, one form or the other will be more readable, but
 * in either case the FaxOptimizer (server side code transformer) ensures that
 * this is transformed into high performance function calls. If 'using' without
 * the help of server side transformers, this reduces to appending to
 * Object.prototype, which slows down forin loops (3x program slow down). This
 * is optional - use the other form if you like it better.
 */
F.using(FaxUi, DemoApp, LayoutDesigner, ControlPanel, FWidgets, LayoutElements);

var CONSTS = {
  drawingOffsetL: 82, // combination of other numbers
  drawingOffsetT: 39
};

/**
 *  DemoApp.DemoAppContent: The main content for this demo application.
 *  Contains a control panel for selecting tools and editing attributes of
 *  shapes, and a drawing canvas to place and manipulate shapes within.
 */
DemoApp.DemoAppContent = {

  /** Initialize the model. */
  initModel: function(props) {
    return {
      selectedTool: 'pointerTool',
      selectedShapeId: 'leftColumn',
      shapes: {
        header: { name: 'header', l: 20, t: 20, w: 600, h: 80,
                  currentlyChanging: { drgX: 0, drgY:0 }},
        underHeaderLeft: { name: 'under header left', l: 20, t: 120, w: 290, h: 50,
                  currentlyChanging: { drgX: 0, drgY:0 }},
        underHeaderRight: { name: 'under header right', l: 330, t: 120, w: 290, h: 50,
          currentlyChanging: { drgX: 0, drgY:0 }},

        leftColumn: {
          name: 'left column', l: 20, t: 190, w: 290, h: 400,
          currentlyChanging: { drgX: 0, drgY:0 }},

        rightColumn: {
          name: 'right column', l: 330, t: 190, w: 290, h: 400,
          currentlyChanging: {drgX: 0, drgY:0 }},

        tileOne: {
          name: 'bottom tile one', l: 20, t: 610, w: 135, h: 50,
          currentlyChanging: {drgX: 0, drgY:0 }},
        tileTwo: {
          name: 'bottom tile two', l: 175, t: 610, w: 135, h: 50,
          currentlyChanging: {drgX: 0, drgY:0 }},
        tileThree: {
          name: 'bottom tile three', l: 330, t: 610, w: 135, h: 50,
          currentlyChanging: {drgX: 0, drgY:0 }},
        tileFour: {
          name: 'bottom tile four', l: 485, t: 610, w: 135, h: 50,
          currentlyChanging: {drgX: 0, drgY:0 }}
      }
    };
  },

  /**
   * Defines the "projection" of the model. A projection of a model, is a
   * mapping from the model (state of this component) to:
   * 1. Visual appearance of this component.
   * 2. Any other children components that themselves have a visual appearance.
   * This method defines an invariant that the Fax system ensures is held true.
   * If you say that you have a child button who's text is this.model.buttonText,
   * then if you update your model's button text, the child button's text will
   * automatically be updated, but there are constructs that need to be
   * allocated in order to make this happen. Just write pure javascript such as:
   * project: function() {
   *   return {
   *      content: this.model.buttonText
   *   }.Button();
   * }
   */
  someHandler: function() {
    this.projection.designerPanel.content.shapes.stupidShape.get().setProperties({x: 0, y: 1222});
  },

  project : function() {
    var ths = this;
    return {
      l: 0, t: 0, b: 0, r: 0,
      clssSet: {noSelect: true, appContent: true},
      designerPanel: {
        l: 30, t: 30, r: 250, b: 30,
        clssSet: {shadowy: true},
        theContent: {
          onPaint: this.onPaint.bind(this),
          selectedTool: ths.model.selectedTool,
          shapes: ths.model.shapes,
          selectedShapeId: this.model.selectedShapeId,
          onMouseDownShapeId: this.onMouseDownShapeId.bind(this),
          onDragSignalShapeId: this.onDragSignalShapeId.bind(this),
          onDragCompleteShapeId: this.onDragCompleteShapeId.bind(this),
          onResizeSignalShapeId: this.onResizeSignalShapeId.bind(this),
          onResizeCompleteShapeId: this.onResizeCompleteShapeId.bind(this)
        }.Designer()
      }.EmbeddedBorderView(),
      controlPanel: {
        clssSet: {shadowy: true},
        l: 'auto', r: 30, t: 30, w: 200, b: 30,
        theContent: {
          onToolChange: function(newTool) {
            ths.updateModel({selectedTool: newTool});
          },
          selectedTool: ths.model.selectedTool,
          selectedShape: ths.model.shapes[ths.model.selectedShapeId],
          onAttributeChange: function(attributeName, newValStr) {
            if(ths.model.selectedShapeId) {
              var val = isNaN(parseInt(newValStr, '10')) ?  newValStr : parseInt(newValStr, 10);
              ths.model.shapes[ths.model.selectedShapeId][attributeName] = val;
              ths.updateModel({});
            }
          }
        }.ToolBox()
      }.EmbeddedBorderView()
    }.FView();
  },

  /** When a paint callback occurs on the canvas.  */
  onPaint: function(abstractEvent, mapLeftOffset, mapTopOffset) {
    var updateBlock = {shapes: {}};

    updateBlock.shapes[''+Math.random()] = {
      name: 'block',
      l: abstractEvent.data.globalX - CONSTS.drawingOffsetL - mapLeftOffset,
      t: abstractEvent.data.globalY - CONSTS.drawingOffsetT - mapTopOffset,
      w: 100, h: 100, currentlyChanging: {drgX: 0, drgY:0}
    };
    this.updateModelDeep(updateBlock);
  },

  /** User clicked on a particular shape.  */
  onMouseDownShapeId: function(shapeId) {
    this.updateModel({selectedShapeId: shapeId});
  },

  /**
   * Continually updated dragging signal.
   */
  onDragSignalShapeId: function(shapeId, plan) {
    var updateBlock = { shapes: {} };
    updateBlock.shapes[shapeId] = {
      currentlyChanging: plan
    };
    this.updateModelDeep(updateBlock);
  },

  /**
   * Done dragging a particular shape. Make pending changes complete.
   */
  onDragCompleteShapeId: function(shapeId) {
    var obj = this.model.shapes[shapeId], updateBlock = { shapes: {} };
    updateBlock.shapes[shapeId] = {
      l: obj.l + obj.currentlyChanging.drgX,
      t: obj.t + obj.currentlyChanging.drgY,
      currentlyChanging: { drgX: 0, drgY: 0 }
    };
    this.updateModelDeep(updateBlock);
  },

  /**
   * Continually updated resizing signal.
   */
  onResizeSignalShapeId: function(shapeId, plan) {
    this.model.shapes[shapeId].currentlyChanging = plan;
    this.updateModel({});
  },

  /**
   * Done resizing a particular shape. Make pending changes complete.
   */
  onResizeCompleteShapeId: function(shapeId) {
    var obj = this.model.shapes[shapeId], updateBlock = {shapes: {}};
    updateBlock.shapes[shapeId] = {
      w : obj.w + (obj.currentlyChanging.right || 0) +
              (-1*obj.currentlyChanging.left || 0),
      l: obj.l + (obj.currentlyChanging.left || 0),
      h: obj.h + (-1*obj.currentlyChanging.top || 0) +
              (obj.currentlyChanging.bottom || 0),
      t: obj.t + (obj.currentlyChanging.top || 0),
      currentlyChanging : {}
    };
    this.model.shapes[shapeId].currentlyChanging = null;
    this.updateModelDeep(updateBlock);
  }

};

/**
 * DemoApp.MainDemoApp:
 */
DemoApp.MainDemoApp = {
  initModel: {
    selectedSection: 'settings'
  },
  project : function() {
    return {
      appContent: DemoApp.DemoAppContent()
    }.FView();
  }
};

module.exports = F.ComponentizeAll(DemoApp);

module.exports.styleExports = {
  '#appMount': {
    backgroundImage: 'url("/images/lightWood.png")'
  },
  shadowy: {
    boxShadow: FaxUi.stylers.boxShadowValue(0, 15, 18, 0,0,0, 0.3)
  },
  appContent: {
    position: 'absolute', left: 0, right: 0, top:0, bottom: 0
  }
};
