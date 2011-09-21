var F = require('Fax'),
    FaxUi = require('FaxUi'),
    FWidgets = require('FWidgets'),
    LayoutElements = require('LayoutElements'),
    ControlPanel = {};

/**
 * Allows declarative tail construction for all Ui components in these packages.
 */
F.using(FaxUi, ControlPanel, FWidgets, LayoutElements);


/**
 * ControlPanel.ToolBox:
 */
ControlPanel.ToolBox = {
  project : function() {
    var props = this.props, ths = this, selectedShape = ths.props.selectedShape;

    return {
      clss: F.TextNode('noSelect'),
      pointerToolButton: {
        l: 9, t: 9, h: 22, w: 22,
        highlighted: props.selectedTool === 'pointerTool',
        onClick: function() {
          props.onToolChange('pointerTool');
        },
        iconImage: {
          clss: F.TextNode('buttonIcon'),
          src: F.TextNode("./images/pointer_icon.png")
        }.Img()
      }.MaterialButton(),
      painterToolButton: {
        highlighted: props.selectedTool === 'painterTool',
        l: 34, t: 9, w: 22, h: 22, b: 'auto',
        onClick: function() {
          props.onToolChange('painterTool');
        },
        iconImage: {
          clss: F.TextNode('buttonIcon'),
          src: F.TextNode("./images/plus_icon.png")
        }.Img()
      }.MaterialButton(),
      toolBoxEditorPanel: {
        clssSet: {toolBoxEditorPanel: true},
        toolBoxRows: !selectedShape ? null : {
          nameRow: {
            value: selectedShape.name,
            attributeName: 'name', label: 'name', t:0,
            onAttributeChange: this.props.onAttributeChange
          }.ToolBoxRow(),
          leftRow: {
            value: selectedShape.l, entryType: 'int',
            attributeName: 'l', label: 'left', t:25,
            onAttributeChange: this.props.onAttributeChange
          }.ToolBoxRow(),
          topRow: {
            value: selectedShape.t, entryType: 'int',
            attributeName: 't', label: 'top', t:50,
            onAttributeChange: this.props.onAttributeChange
          }.ToolBoxRow(),
          heightRow: {
            value: selectedShape.w, entryType: 'int',
            attributeName: 'w', label: 'width', t:75,
            onAttributeChange: this.props.onAttributeChange
          }.ToolBoxRow(),
          widthRow: {
            value: selectedShape.h, entryType: 'int',
            attributeName: 'h', label: 'height', t:100,
            onAttributeChange: this.props.onAttributeChange
          }.ToolBoxRow()
        }.MultiDynamic()
      }.FView()
    }.Div();
  }
};


/**
 * ControlPanel.ToolBoxRow:
 */
ControlPanel.ToolBoxRow = {
  project : function() {
    var ths = this;
    return {
      overrides: F.objExclusion(this.props, {
        isNumeric: true, label: true, value: true, attributeName: true
      }),
      clssSet: { abs: true },

      leftLabel: {
        style: {left: 0, width: 50},
        innerHtml: F.TextNode(this.props.label)
      }.ViewDiv(),

      rightInput: {
        l: 50, r: 0, t: 0, b: 0, h: 22,
        clssSet: {toolBoxRowInput: true},
        value: F.TextNode(this.props.value),
        entryType: this.props.entryType,
        onChange: function(newVal) {
          ths.props.onAttributeChange(ths.props.attributeName, newVal);
        }
      }.FInputView()
    }.FView();
  }
};

module.exports = F.ComponentizeAll(ControlPanel);

/**
 * Now some style exports.
 */
module.exports.styleExports = {
  toolBoxEditorPanel: { bottom: 9, left: 9, right: 9, top: 40 },
  buttonIcon: { position: 'absolute', height: 16, width: 16, left: 3, top: 3 },
  toolBoxRowInput: {
    color: '#000', fontSize: '13px', backgroundColor: '#888',
    position: 'absolute', left: 50, right: 0, top:0, bottom: 0,
    border: '1px solid #222'
  }
};
