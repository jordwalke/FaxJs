# Fax - Javascript Ui Framework

###  Fax is a javascript UI framework that focuses on:
* **Componentization** - defining reusable ui components
* **Declarative API** - The code *looks* like the UI itself. You tell the system what you want to be generated, and it figures out the details. (JSON style code API)
* **Small Code Size** and rapid development.
* **Rendering performance:** Fax uses string concatenation to generate the markup, coupled exclusively with top level event delegation to handle events - but you wouldn't know it - those details are hidden from the developer. You just tell the api that you want something to happen "when the button is clicked".
* **Pure Javascript Api:** You describe the interface, how to perform updates, even the stylesheets in **javascript**.


### A very brief example:
We'll make a button wrapped inside of a containing div. The button will stretch to the size of it's container. When we click the inner button, we'll make the outer container change width. The button will, of course, stretch to fit it's container.

    var F = require('Fax'),
         FaxUi = require('FaxUi'),
         Demo = {};

    F.using(FaxUi);   // Allows use of Div and Button components

    Demo.StretchyButon = {
      initModel: {
        theContainerWidth: '200px'
      },

      project : function() {
        var ths = this;
        return {
          style: {width: this.model.theContainerWidth},

          innerButton: {
            style: {width: '100%'},
            onClick: function() {
              ths.updateModel({theContainerWidth: '500px'});
            }
          }.Button()
        }.Div();
      }
    };

    module.exports = F.ComponentizeAll(Demo);



**Explanation:**

* The initModel method describes the component's initial state.
* The project method defines how the view should be projected from an arbitrary model. The 'project' method describes an invariant that the system upholds. You don't need separate creation/updating methods.
* The Button's onClick method executes an update to this component's model. The containing Div's width will automatically be changed, because the invariant *project()* states that the outer container's width should always be equal to what is stored in the model.

   
**What you get:**

* A reusable component that can be instantiated in the same declarative manner as the *project* method.
* No need to declare getters and setters for attributes - it's all just Plain 'Ol Javascript.


**Style Sheets:**
After the last line in the example, we could have exported some styles in the
javascript file, much like designing a css document. The advantage being that
you can have separated styling/code, yet in a single file that you can share
with someone.

We could have ended the file with:

    module.exports = F.ComponentizeAll(Demo);
    module.styleExports = {
      someClassname: {
        backgroundColor: '#988',
        color: '#222'
      }
    };

Then in our html file we can just "include" the js file *as a css file*.

    <link rel="stylesheet" type="text/css" href="/Demo/Demo.css">

And the Fax backend system will automatically convert that module into an
includable css file, on the fly, based on what you specified as that
javascript's module.styleExports. The css rules are just the same as you're used
to, but with hyphens translated to camelCase. Also, each member of the style
export is assumed to be a class name. If you want to style based on a dom id,
include the key in quotes with a pound sign.

    

**More about Fax and how to run the examples:**
This packaging of Fax uses browserify to run commonjs modules in the browser. An
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

####Setting up the npm modules:
The modules that Fax consists of are npm modules, but they are not registered
with npm. You'll have to manually link them or globally register each of them.
Once that is done just cd into the main directory and execute:

        node server.js

It will run a web server on port 8080. Check that out.



