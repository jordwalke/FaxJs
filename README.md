# FaxJs - Javascript Ui Framework

##  FaxJs is a javascript Ui framework that focuses on:
* **Declarative** - The code *looks* like the UI itself. Just tell FaxJs what you want, and it figures out the details. (using a JSON style description).
* **Componentization** - Defining reusable ui components
* **Small Code Size** - Quick downloads and rapid development.
* **Rendering performance:** FaxJs uses string concatenation to generate markup, and top level event delegation to handle events - but you don't have to worry about any of that. You just tell the FaxJs what you want to construct and it figures out the details.
* **Pure Javascript Api:** You describe the interface, how to perform updates, even the stylesheets in **javascript**.
* **Markup generation completely separated from Event system** - FaxJs can render your app on the server. That means you can take advantage of very fast server rendering. But you won't have to rewrite your code to make it happen. It's all behind the scenes - you just write the widgets.
<br>

<br>
# Project Manager:
Now included is a project manager that will create an entire FaxJs project by running a single script. Your new project will be completely self contained, contain all dependencies and won't rely on any other libraries being installed (except node.js of course).
The project that it creates, is self contained, and will include a simple server to run your project. You can easily post your project on github or share it, and users will be able to fire up your project by running a single script 'runBuild.sh'.


<br>
##Demo App:
Here is a simple <a href='http://jordow.github.com/FaxJs/'>Demo App</a>.
You can drag and resize the shapes on that layout designer interactively. There
are two tools in the upper right hand of the tool box, a pointer/sizer and a
painter with which you can drop shapes onto the designer panel. (Though FaxJs is designed for
all browsers, this particular app doesn't work well in IE. Try it in Chrome/Safari/FF.

<a href='http://jordow.github.com/FaxJs/'>
![Some Image](https://www.github.com/jordow/FaxJs/raw/master/demo_screenshot.png)
</a>

<br>
## A very simple example:
We'll make a button wrapped inside of a containing div. The button will stretch to the size of it's container. When we click the inner button, we'll make the outer container change width. The button will, of course, stretch to fit it's container.

```javascript
// Just set up our environment a bit.
var F = require('Fax'),
    FaxUi = require('FaxUi'),
    Demo = {};


// Allow use of Divs/Spans/etc.
F.using(FaxUi);

Demo.StretchyButton = {
  // Initialize state for this component.
  initModel: {
    theContainerWidth: '200px'
  },

  // Will be used to handle an event.
  stretchyButtonClicked: function() {
    this.updateModel({theContainerWidth: '500px'});
  },

  // Returns the view as a function of state - an invariant FaxJs upholds
  project : function() {
    return {
      style: {
        width: this.model.theContainerWidth
      },
      innerButton: {
        clss: 'someClassFromCss',
        onClick: this.stretchyButtonClicked.bind(this)
      }.Button()
    }.Div();
  }
};

// Turns all members of Demo (1) into components
module.exports = F.ComponentizeAll(Demo);

```

##Explanation of example:

* The **initModel** method describes the component's initial state.
* The **project** method defines how the view should be projected from an arbitrary model.
  The 'project' method describes an invariant that the system upholds. You don't need
  separate creation/updating methods. Just tell the system what your component *is*,
  and that will be enforced automatically. Think of your your view, as a function of
  your model, and the project method being what defines that mapping.
* The Button's **onClick** method executes an update to this component's model. The
  containing Div's width will automatically be changed, because the invariant 
  *project()* states that the outer container's width should always be equal to what is
  stored in the model.
 
What you get by calling F.ComponentizeAll(Demo):

* A reusable component that can be instantiated in the same declarative manner as the *project* method.
* No need to declare getters and setters for attributes - it's all just Plain 'Ol Javascript.


<br>
<br>
## Get started  (One click install):

If you just want to get a feel for the toolkit and try a couple examples, this should be enough for you to play around.

#### 1. Simply download the <a href='https://github.com/jordow/FaxJs/blob/gh-pages/EasySetup_JustOpenMeAndStartHacking.zip?raw=true'>One Click Install</a>

#### 2. index.html runs the demo app. Start coding in the script tag.

#### 3. Try creating your own component and mount it "as a top level" component as is done with the demo app, replacing the demo app with your own!


## Get started  (nodejs auto builder, optimizer, and development server):

#### 1. Make sure you have node.js and npm installed and can run node/npm by
executing:
         node someFile.js
         npm list
         

#### 2. Download FaxJs and extract anywhere.

        unzip whatverFileYouNamedThisProjectAs.zip
        
#### 3. Execute the setup script which will setup the npm links between all the
packages in FaxJs, using purely npm.

  If you have node <= .5

        ./setupEnvironment.sh
        
  If you have node > .5

        ./setupEnvironmentIfNodeLaterThanFive.sh
        

#### 4. Run the server and point your browser at localhost:8080/demo.html

        ./runServer.sh
        
This starts up a development server that serves static files directly off of your
disk. This is only for development purposes. When you deploy, copy over the built
files into your standard static file deployment method. The server provided in
FaxJs is not meant to be ran as a public server.
        

## Additional features:

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






