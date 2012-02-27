var F = require('Fax'),
    FDom = require('FDom'),
    Div = FDom.Div;

var PersonDisplayer = F.Componentize({
  structure: function() {
    return Div({
      classSet: { personDisplayerContainer: true},

      titleDiv: Div({
        classSet: { personNameTitle: true },
        content: this.props.name
      }),

      nestedAgeDiv: Div({
        content: 'Interests: ' + this.props.interests
      }),

      ageDiv: Div({
        content: 'Age: ' + this.props.age
      })
    });
  }
});

/* The project was created with an index.html that instantiates a MainComponent.
 * 'structure()' is the main method of any ui component. It declares what the
 * component 'looks like' - how it's composed.*/
var MainComponent = exports.MainComponent = F.Componentize({
  structure: function() {
    return Div({
      firstPerson: PersonDisplayer({
        name: 'Joe Johnson', age: 31,
        interests: 'hacking, eating, sleeping'
      }),

      secondPerson: PersonDisplayer({
        name: 'Sally Smith', age: 29,
        interests: 'biking, cooking swiming'
      }),

      thirdPerson: PersonDisplayer({
        name: 'Greg Winston', age: 25,
        interests: 'design and technology'
      })
    });
  }
});


// Style object automatically converted into a css file.
module.exports.styleExports  = {
  body: { backgroundColor: '#bbb' },
  personNameTitle: { marginLeft: '-4px', fontSize: '21px' },
  personDisplayerContainer: {
    padding: '8px',
    'text-shadow': '#202020 2px 2px 2px',
    borderBottom: '1px solid #000',
    borderTop: '1px solid #505050',
    backgroundColor: '#383838',
    color: '#fff'
  }
};
