# FaxJs - Javascript User Interface Toolkit


<table cellspacing=0 cellpadding=0 border-style=none border-width=0>

<tr>
<td border-style=none border-width=0>
<img style="float:right;" src="https://github.com/jordow/FaxJs/raw/gh-pages/images/FaxJsLogo.png"/>
</td>
<td>
</ul>

<ul>
  <li> <h3>Seamless Client Server Rendering</h3><ul><li>Write once, render anywhere - client or server</li></ul></li>
  <li> <h3>Reactive</h3><ul><li>Views are automatically updated on state changes - no bindings necessary </li></ul></li>
  <li> <h3>Performant</h3><ul><li>Fast rendering using string concatenation, small code size </li></ul></li>
  <li> <h3>Structural</h3><ul><li>High level components, functionally defined, declarative views</li></ul></li>
</ul>
</td>
</tr>

</table>
<br>
### Get Started Now:

Get node.js using <a href='https://sites.google.com/site/nodejsmacosx/'>the OSX Installer</a>


**1. Make sure you have the right version of node:**

        node.js 0.5.2 or above will *not* work with the build script - fix coming soon, download 0.5.1
        using the single click installer linked to above
    
**2. Clone or download FaxJs: Save it anywhere you like.**

        git clone git://github.com/jordow/FaxJs.git ~/Desktop/FaxJs
        
**3. Create a new project: Make a directory with the name of your project ("TestProject"). Execute createNewProjectInCurrentDir.sh from within it.**

        mkdir ~/TestProject && cd ~/TestProject && ~/Desktop/FaxJs/newProjectInCurrentDir.sh
        
**4. Simply start the web server. See your web app in the browser.**

        ./runBuild.sh        # now visit http://localhost:8080/

<table cellspacing=0 cellpadding=0 border-style=none border-width=0>
  <tr>
    <td width=50%>
      <img src="https://github.com/jordow/FaxJs/raw/gh-pages/images/newProjectScreenshot.png" />
    </td>
    <td border-style=none border-width=0>
        <p> The project that you created is completely self contained. It contains all of the Fax toolkit libraries, build scripts, and test server to run your app. The original download/clone of FaxJs is only needed to create new projects. When a new project is created, everything important is copied into that new project directory. </p>

    </td>
  </tr>
</table>

### Let's Start Hacking!

Open up `./lib/TestProjectMain/TestProjectMain.js` and we'll discover how to create Ui modules.

<b>First let's take a look at `MainComponent`.</b>

```javascript
TestProjectMain.MainComponent = {
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
```

`TestProjectMain.MainComponent` is the entry point of our app (because index.html says so). `TestProjectMain.MainComponent` has a single method inside of it called `project`. `project` (as in "projector") describes the structure of your component. `project` is expected to be very inteligent. The system expects that `project` will *always* be able to answer the question: "Hey component, what do you look like *right now* ?" In this case, our component is *always* composed of three PersonDisplayer components with hard-coded names, ages, and interests. Thre three PersonDisplayer components are contained within a div, and each PersonDisplayer instance is given properties name/age/interests.
An interesting thing to note, is that each PersonDisplayer instance inside of the div is given a key (firstPerson,secondPerson,thirdPerson). They aren't used yet, but for now they help readability.
Also, the PersonDisplayer is described by a *tail constructor*. (Tail constructors are enabled by a call to Fax.using()).
But what *is* a PersonDisplayer? We haven't yet seen the definition.
<br>
<b>Look further down in the file and you can see where `PersonDisplayer` is defined.</b>

```javascript
TestProjectMain.PersonDisplayer = {
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
```

Just like with our main component, a `PersonDisplayer` has that super important method called `project`. But there's a couple of new concepts here that we haven't yet seen.

1. The outer most div has a `classSet` property. This is just a way to describe a set of css classes.
2. You'll notice references to `this.props`. You'll also notice that the things inside of `this.props` (name/interests/age) look very much like the things set on each instance of `PersonDisplayer` inside of our `MainComponent`.
When someone instantiates a component, the properties set on it become `this.props` inside of the instantiated component's `project` method.

<br>
So far you've seen how components can instantiate other components and provide properties to each other. The only two things left to cover is how a component can be statefull, instead of just reacting to properties set on it, and how a component cna respond to user events. These will be covered further down in this README. For now, let's take a look at the project structure.

<br>
### Project Structure:
Look at `ProjectConfig.js` in your project, and you'll see the set of project modules in your project:

```javascript
projectModules: {
  TestProjectMain: {    // The name of this object key must match the folder name in ./lib
    description: "Main module for project TestProject",
    main: "./TestProjectMain.js"
  },
  FaxUi: {
    description : "FaxUi Toolkit Core",
    main        : "./FaxUi.js"
  },
  Fax: {
    description : "Fax Toolkit Core",
    main        : "./Fax.js"
  }
}
```

Your new app has three modules. Your main project module, `Fax` and `FaxUi`. For every module in the `ProjectConfig` there must be a module in `./lib` in a folder by the same name. If you look in `./lib` you'll see that your project is valid because it has a folder for `Fax`, `FaxUi`, and `TestProjectMain`.
The way you add new modules to your project is by adding a new entry in the ProjectConfig and creating new folders in `./lib` matching the naming conventions of the others. (Ignore any package.json files - you won't need to worry about those)

<br>
### Building:
<b>Just execute `runBuild.sh` and it will continually do the following:</b>

1. Continually package and optimize your javascript and serve it on port 8080.
2. Generate css files from FaxJs javascript modules that have `styleExports`

<br>
When you execute `./runBuild` the FaxJs project build system uses the project config in conjunction with <a href='https://github.com/tobie/modulr-node'>modulr</a> to build all of your libraries. It starts with the `projectMainModule` from `ProjectConfig.js` and uses modulr to determine the entire set of dependencies from the ProjectConfig. Modulr packages all of them into a single monolithic js file that `index.html` includes. But before `runServer.sh` tells modulr to package your files, **behind the scenes** it calls the FaxJs build and optimization system to perform some AST code transformations on the javascript, and automatically generates css from your javascript files.
`runBuild.sh` also watches for changes and repeats the process for you as often as needed, always serving the most recent build on port 8080.


<br>
## Simple example of statefullness, reactivity and events in a component:

We'll make a button wrapped inside of a containing div. The button will stretch to the size of it's container. When we click the inner button, we'll make the outer container change width. The button will, of course, stretch to fit it's container.

        ./lib/StretchyButton/StretchyButton.js   // Also make sure to add an entry in ProjectConfig.js
        

```javascript
// Just set up our environment a bit.
var F = require('Fax'),
    FaxUi = require('FaxUi'),
    Demo = {};


// Allow use of Divs/Spans/etc tail constructor
F.using(FaxUi);

Demo.StretchyButton = {
  // Initialize state for this component.
  initState: {
    theContainerWidth: '200px'
  },

  // Will be used to handle an event.
  stretchyButtonClicked: function() {
    this.updateState({
      theContainerWidth: '500px'
    });
  },

  // Returns the view as a function of state/properties. Remember, your job is to define
  // a function that answers the question: "What do you look like right <i> now </i>
  project : function() {
    return {
      style: {
        width: this.state.theContainerWidth  // Automatically updated when theContainerWidth is updated
      },
      innerButton: {
        classSet: {someClassFromCss: true},
        onClick: this.stretchyButtonClicked.bind(this)
      }.Button()
    }.Div();
  }
};

// Turns all (one) members of Demo into reusable components
module.exports = F.ComponentizeAll(Demo);

```

##Explanation of example:

* The `initState` method describes the component's initial state.
* The `project` method answers the question: "What do you look like right *now*?". In other words, you describe the structure of your component for an *arbitrary* state/property combination.
* You don't need separate methods for creation/updating. Just tell FaxJs what your component *always is* and FaxJs take care of creating/updating the DOM when we detect changes.
* FaxJs will ensure that your component **reacts** to changes in properties/state, by asking your component again: "What do you look like *now*?"
* The Button's `onClick` method executes an update to this component's state. The
  containing `Div`'s width will automatically be changed, because the invariant 
  `project()` states that the outer container's width should always be equal to what is
  stored in `this.state.theContainerWidth`.
 
What you get by calling F.ComponentizeAll(Demo):

* A reusable component that can be instantiated in the same declarative manner as the *project* method.
* No need to declare getters and setters for attributes - it's all just Plain 'Ol Javascript.



<br>
##Demo App:
Here is a simple <a href='http://jordow.github.com/FaxJs/'>Demo App</a> built with FaxJs.
You can drag and resize the shapes on that layout designer interactively. There
are two tools in the upper right hand of the tool box, a pointer/sizer and a
painter with which you can drop shapes onto the designer panel. (Though FaxJs is designed for
all browsers, this particular app doesn't work well in IE. Try it in Chrome/Safari/FF.

<a href='http://jordow.github.com/FaxJs/'>
![Demo Image](https://github.com/jordow/FaxJs/raw/gh-pages/images/DemoScreenshot.png)
</a>


## FaxJs Additional features:

### Optional server side rendering:
The reason why FaxJs uses top level event delegation for the eventing system, is so
that the interactive portions can work with the markup, regardless of where the
markup was generated. Once you have a component instance generated, the last two
parameters of the genMarkup method specify whether or not markup should be generated
and returned, and whether or not the event system should be used.
For server side rendering on node.js, just set the first parameter to true, and the
second to false. Change this arbitrarily depending on your performance needs.

On node.js:

    componentInstance.genMarkup('.top', true, false);
    
On the browser: (No markup will be generated, but will work with the markup that
came from the server)

    // Assume the markup is on the page mounted at id '.top'

    componentInstance.genMarkup('.top', false, true);

Now your event system is live and working with the markup that came from the server.
The user expeience (viewing) isn't blocked on the events being registered and the
server can likely generate the markup faster than your user's browser. You'll need
to consider where you want the node.js code executed, as it will depend on how you're
currently generating your pages (connect etc.)

### Style Sheets:

FaxJs lets you define stylesheets in your favorite language - javascript. This
is important because often programatic behavior at runtime needs to be consistent
with css styles. If you can declare some javascript constants and generate code *and*
style from them, this takes much of the pain out of interactive ui development.
But feel free to use traditional css if you're more comfortable with that.

For example:
After the last line in the stretchy button example, we could have exported some
styles in the javascript file, much like designing a css document. The advantage
being that you can have separated styling/code, yet in a single file that you can
share with someone.

We could have ended the file with:
    ... component code
    module.exports = F.ComponentizeAll(Demo);
    
    module.styleExports = {
      someClassname: {
        backgroundColor: '#988',
        color: '#222'
      }
    };

Then in our html file we can just "include" the js file *as a css file*. Just
replace '.js' with '.css'.

    <link rel="stylesheet" type="text/css" href="/Demo/Demo.css">

The FaxJs backend system will automatically convert that module into an
includable css file, on the fly, based on what you specified as that
javascript's module.styleExports. The css rules are just the same as you're used
to, but with hyphens translated to camelCase. Also, each member of the style
export is assumed to be a class name. If you want to style based on a dom id,
include the key in quotes with a pound sign.

    
##Backend processing
This packaging of FaxJs uses browserify to run commonjs modules in the browser. An
example server.js node.js file and demo.html is given that will automatically
package up these modules into browser ready components. In addition, the
server.js also performs code transformations to make tail constructors faster
(using the FaxProcessor module).
The server continually parse and package the code. If there is a syntax error,
the server will shut down. Sometimes the optimization process takes a while to
transform code. If you load the demo and it seems slow, do not be fooled. The
generated code will render the demo in about 10ms, but the delay you observe is
the server transforming/optimizing the javascript.
The server also builds the includable stylesheets from styleModule javascript
exports as explained earlier.


##Other features:
There is currently support for the most commont application events such as onFocus,
onBlur, onClick, onKeyUp etc. For each of these events, there is are two other
corresponding versions of these handlers suffixed with 'Direct' and 'FirstHandler'.
For example, there is onClick, onClickDirect, and onClickFirstHandler. onClickDirect
will only be fired when that element is the target of the actual event that happened
and not the result of any kind of bubbling. The onClickFirstHandler event is fired
when a click happens on that element or some child of it, yet noone else deeper in
the component tree has handled that event yet. This eliminates the need to ever
'cancel' bubbling. Instead, the parent can just filter out events that have already
been handled at the lower levels.






