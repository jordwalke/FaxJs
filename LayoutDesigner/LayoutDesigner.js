/**
 * LayoutDesigner - displays objects. Provides a moveable canvas to draw shapes
 * upon and drag them around.
 */
var F = require('Fax'),
    FaxUi = require('FaxUi'),
    FWidgets = require('FWidgets'),
    LayoutDesigner = {};

F.using(FaxUi, LayoutDesigner, FWidgets);

/**
 * LayoutDesigner.LayoutDesigner:
 */
LayoutDesigner.Designer = {};
/**
 * Initial model. Hovering nothing, dragging nothing.
 */
LayoutDesigner.Designer.initModel = {
  hoveringShapeId: null,
  mapLeft: 0, mapTop: 0, drgX: 0, drgY: 0
};

LayoutDesigner.Designer.onSurfaceClick = function(abstractEvent) {
  if(this.props.selectedTool === 'pointerTool') {
    this.props.onMouseDownShapeId(null);
  } else if(this.props.selectedTool === 'painterTool') {
    this.props.onPaint(abstractEvent, this.model.mapLeft, this.model.mapTop);
  }
  abstractEvent.preventDefault();
};

LayoutDesigner.Designer.onSurfaceDrag = function(absE) {
  if(this.props.selectedTool === 'pointerTool') {
    this.updateModel({
      drgY: absE.data.globalY - absE.data.startY,
      drgX: absE.data.globalX - absE.data.startX
    });
  }
};

LayoutDesigner.Designer.onSurfaceDragDone = function() {
  var model = this.model;
  this.updateModel({
     mapLeft: model.mapLeft + model.drgX, mapTop: model.mapTop + model.drgY,
     drgX: 0, drgY: 0
  });
};

/**
 * I tried first creating a 'movable map' upon which to place all of the
 * elements, then when dragging on the surface, I implemented optimizing code
 * which is certain not to cause a reprojection to the child blocks, and instead
 * manually manipulated the dom to move the 'moveable map' around. This did not
 * show a huge performance increase, and it turns out that the simplest, most
 * normalized/declarative/functional way of just declaring a projection
 * offers the best tradeoff in complexity, code size and performance. Not to say
 * that there aren't perf wins by optimizing the projection, but in this case,
 * the controlling time is dominated by even a single unavoidable reflow.
 */
LayoutDesigner.Designer.project = function() {
  var model = this.model, props = this.props, ths = this;

  return {
    onMouseDownFirstHandler: this.onSurfaceClick.bind(this),
    onQuantizeDragFirstHandler: this.onSurfaceDrag.bind(this),
    onMouseIn: ths.updater({hoveringShapeId: null}),
    onDragDoneFirstHandler: this.onSurfaceDragDone.bind(this),
    shapes: F.objMap(props.shapes, function(shapeId, obj, i) {
      return {
        l: obj.l + (obj.currentlyChanging.drgX || 0) +
                   (obj.currentlyChanging.left || 0) +
                   (model.mapLeft + model.drgX),
        t: obj.t + (obj.currentlyChanging.drgY || 0) +
                   (obj.currentlyChanging.top || 0) +
                   (model.mapTop + model.drgY) ,
        w: obj.w + (obj.currentlyChanging.right || 0) +
                   (-1*obj.currentlyChanging.left || 0),
        h: obj.h + (-1*obj.currentlyChanging.top || 0) +
                   (obj.currentlyChanging.bottom || 0),
        label: obj.name,
        selected: props.selectedShapeId === shapeId,
        onBoxDragSignal: F.curryOne(props.onDragSignalShapeId, shapeId),
        onBoxDragComplete: F.curryOne(props.onDragCompleteShapeId, shapeId),
        onBoxResizeSignal: F.curryOne(props.onResizeSignalShapeId, shapeId),
        onBoxResizeComplete: F.curryOne(props.onResizeCompleteShapeId, shapeId),
        onBoxClick: F.curryOne(props.onMouseDownShapeId, shapeId)
      }.OwnedDesignerBox();
    }).MultiDynamic()
  }.FView();
};


/**
 * LayoutDesigner.OwnedDesignerBox: Externally owned designer box. Variable
 * properties are determined by the owner, not by this instances.
 */
LayoutDesigner.OwnedDesignerBox = {
  project : function() {
    F.sure(this.props, ['onBoxDragSignal',
        'onBoxDragComplete', 'onBoxResizeSignal', 'onBoxResizeComplete',
        'l', 't', 'w', 'h']);

    var props = this.props, ths = this;

    return {
      overrides: this.props,
      clssSet: {noSelect: true, designerBox: true, selected: props.selected },
      onClick: props.onBoxClick,
      onMouseIn: props.onBoxMouseIn,
      onMouseOut: props.onBoxMouseOut,
      onQuantizeDragFirstHandler: function(absE) {
        props.onBoxDragSignal({
          drgX: absE.data.globalX - absE.data.startX,
          drgY: absE.data.globalY - absE.data.startY
       });
      },
      onDragDoneFirstHandler: props.onBoxDragComplete,
      nameLabel: {
        clssSet: {noSelect: true},
        l: 3, t: 3,
        content: props.label
      }.ViewDiv(),
      rightDragger: {
        clss: 'noSelect designerBoxRightDragger',
        onQuantizeDrag: function(absE) {
          props.onBoxResizeSignal({right: absE.data.globalX - absE.data.startX});
        },
        onDragDone: props.onBoxResizeComplete
      }.Div(),
      topDragger: {
        clss: 'noSelect designerBoxTopDragger',
        onQuantizeDrag: function(absE) {
          props.onBoxResizeSignal({top: absE.data.globalY - absE.data.startY});
        },
        onDragDone: ths.props.onBoxResizeComplete
      }.Div(),
      leftDragger: {
        clss: 'noSelect designerBoxLeftDragger',
        onQuantizeDrag: function(absE) {
          props.onBoxResizeSignal({left: absE.data.globalX - absE.data.startX});
        },
        onDragDone: ths.props.onBoxResizeComplete
      }.Div(),
      bottomDragger: {
        clss: 'noSelect designerBoxBottomDragger',
        onQuantizeDrag: function(absE) {
          props.onBoxResizeSignal({bottom: absE.data.globalY - absE.data.startY});
        },
        onDragDone: ths.props.onBoxResizeComplete
      }.Div()
    }.ViewA();
  }
};

module.exports = F.ComponentizeAll(LayoutDesigner);

var CONSTS = {
  controlPanelPadding: 8
};

module.exports.styleExports = {
  designerBox: {
    position: 'absolute',
    boxShadow: FaxUi.stylers.boxShadowValue(-4, 4, 7, 0,0,0, 0.2),
    borderRadius: FaxUi.stylers.roundValue(3),
    border: FaxUi.stylers.borderValue('#000'),
    background: FaxUi.stylers.backgroundBottomUpGradientValueFromMaps(
      { r: 40, g:40, b:40, a: 255 }, { r: 50, g:50, b:50, a: 255 })
  },
  selected: {
    color: '#73b2f9',
    boxShadow: FaxUi.stylers.boxShadowValue(-5, 5, 7, 0,0,0, 0.3)
  },

  designerBoxRightDragger: {
    cursor: 'e-resize', position: 'absolute',
    top: 0, right: -1, bottom: 0, width: 7
  },
  designerBoxLeftDragger: {
    cursor: 'w-resize', position: 'absolute',
    top: 0, left: -1, bottom: 0, width: 7
  },
  designerBoxBottomDragger: {
    cursor: 's-resize', position: 'absolute',
    left: 0, right: 0, bottom: -1, height: 7
  },
  designerBoxTopDragger: {
    cursor: 'n-resize', position: 'absolute',
    top: -1, right: 0, left: 0, height: 7
  }
};

