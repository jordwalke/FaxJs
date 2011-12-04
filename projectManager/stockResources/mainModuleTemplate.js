var F = require('Fax'), FaxUi = require('FaxUi'), MainModuleName = {};

/* 'using(x)' allows "tail constructors" to be used for every component defined
 * inside module 'x'. Tail constructors look like:   { content: 'hi' }.Div() */
F.using(MainModuleName, FaxUi);

/* The project was created with an index.html that instantiates
 * MainModuleName.MainComponent.  'project()' is the main method of any ui
 * component. It declares what the component 'looks like' - how it's composed.*/
MainModuleName.MainComponent = {
  project : function() {
    return {
      firstPerson: {
        name: 'Joe Johnson', age: 31,
        interests: 'hacking, eating, sleeping'
      }.PersonDisplayer(),

      secondPerson: {
        name: 'Sally Smith', age: 29,
        interests: 'biking, cooking swiming'
      }.PersonDisplayer(),

      thirdPerson: {
        name: 'Greg Winston', age: 25,
        interests: 'design and technology'
      }.PersonDisplayer()
    }.Div();
  }
};

MainModuleName.PersonDisplayer = {
  project : function() {
    return {
      classSet: { personDisplayerContainer: true},

      titleDiv: {
        classSet: { personNameTitle: true },
        content: this.props.name
      }.Div(),

      nestedAgeDiv: {
        content: 'Interests: ' + this.props.interests
      }.Div(),

      ageDiv: {
        content: 'Age: ' + this.props.age
      }.Div()
    }.Div();
  }
};

// Exports and componentizes all members of MainModuleName
module.exports = F.ComponentizeAll(MainModuleName);

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
