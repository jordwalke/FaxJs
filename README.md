Disclaimer:
===========
This is an old, experimental project: [React](https://github.com/facebook/react)
is much better in every way and you should use that instead. This project will remain on Github for historical context.

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
      <br>
      <br>
      <br>
<ul><ul><ul>
<ul><ul><ul>
<ul><ul><ul>
<ul><ul><ul>
<ul><ul><ul>
</ul></ul></ul>
</ul></ul></ul>
</ul></ul></ul>
</ul></ul></ul>
</ul></ul></ul>
</td>
</tr>
</tr>
<br>
</table>
<br>

### Get Started Now:

Get node.js using <a href='https://sites.google.com/site/nodejsmacosx/'>the OSX Installer</a>. Download/clone FaxJs and Make a new directory for your project.


        git clone git://github.com/jordow/FaxJs.git ~/Desktop/FaxJs
        mkdir ~/TestProject && cd ~/TestProject && ~/Desktop/FaxJs/newProjectInCurrentDir.sh
        ./runBuild.sh        # now visit http://localhost:8080/

<table cellspacing=0 cellpadding=0 border-style=none border-width=0>
  <tr>
    <td width=50%>
      <img src="https://github.com/jordow/FaxJs/raw/gh-pages/images/newProjectScreenshot.png" />
    </td>
    <td border-style=none border-width=0>
        <p> The new project directory is self contained and has all of the core libraries copied into its `./lib` directory. It also has all the project build scripts. </p>
    </td>
  </tr>
<tr>

</tr>
</table>
<br>

<br>

### Let's Start Hacking!

Open up `./lib/TestProject/TestProject.js` and take a look at the `MainComponent` UI module.

```javascript
var MainComponent = exports.MainComponent = F.Componentize({
  structure : function() {
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
```

`MainComponent` is the main component of our app. `MainComponent` has a single method inside of it called `structure`.  `structure` is a powerful function that describes what the component looks like at any given point in time.
Look further to see where the `PersonDisplayer` is defined.
<br>
<br>
<b>Look further down in the file and you can see where `PersonDisplayer` is defined.</b>

```javascript
TestProject.PersonDisplayer = {
  structure : function() {
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
};
```

Just like with our main component, a `PersonDisplayer` has that method called `structure`. But there's a couple of new concepts here that we haven't yet seen.

1. The outer most div has a `classSet` property. This is just a way to describe a set of css classes (by the object keys).
2. You'll notice references to `this.props`. The things inside of `this.props` (name/interests/age) look very much like the things set on each instance of `PersonDisplayer` inside of our `MainComponent`.
When someone contains a child component, the properties injected into it that child component become `this.props` inside the child component's  `structure` method.

<br>
The two remaining topics are "statefullness" and "event handing". These will be covered further down in this README. For now, let's take a look at the project structure.

<br>
### Project Structure and building:
Look at `ProjectConfig.js` in your project, and you'll see the set of `projectModules`. `projectModules` is the list of modules in `./lib` that will have special processing applied to them (FaxJS specific performance).

```javascript
projectModules: {
  // This is the entry point from index.html, which kicks off TestProject.js
  main: { },
  
  TestProject: {  },
  
  FDom: { },

  Fax: { },

  FTextInput: { },

  FBoxes: { },

  FButton: { },

  FToggleSwitch: {}
}
```

Just execute `runBuild.sh` and it will continually do the following:</b>

1. Continually package and optimize your javascript and serve it on port 8080 (using <a href='https://github.com/tobie/modulr-node'>modulr</a>)
2. Optimize the AST for any modules that are listed in `projectModules` (in ProjectConfig.js) and are present in `./lib`.
2. Generate css files from `projectModules` (in ProjectConfig.js) that have `styleExports` and are present in `./lib`. (See example of this in the demo project)


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

### Google Closure Advanced Compilation:
In `ProjectConfig.js` there is an entry to control whether or not you'd like to run Google Closure's advanced minification. Set the field to true to see what kind of saving on filesize you can achieve. Expect a large reduction in js/css size. The FaxJs build system is smart enough to take the key minification that closure applied, and apply it to the `styleExports` css output as well, so those css files will also be reduced in size. (This only works correctly if you use `classSet: {myCssClassName: true}`, not `className: 'myCssClassName'`. Key minification works by renaming all occurences of object keys across your entire project. Strings will never be renamed. Be dilligent about using the `classSet` construct which uses object keys to specify class names.) 
The advanced mode of compliation will significantly reduce your filesize, but will take a long time to compile. It is suggested that you develop with this mode set to `false` but occasionally set it to `true` to test that your app is resilient to key minification.

```javascript
minifyClosureAdvanced: false,  // Set this to true

minifyClosureAdvancedPreserveKeys: {   // Add whatever keys you don't want touched
  thisKeyWillNeverBeMinifiedIfUsingAdvancedMinification: true,
  thisOneWontBeEither: true
},
```

**As a general rule of thumb, strings will never be changed by the compiler, object keys likely will. If you don't want something changed, encode it into a string or add it to the `ProjectConfig.js` `minifyClosureAdvancedPreserveKeys` .**


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
with css styles. If you can declare some javascript constants/functions and generate
code *and* style from them, it's much easier to keep your code and style in sync.
FaxJs will work completely fine with standard css/less files.

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

The FaxJs backend system will automatically convert that module into an
includable css file, on the fly, based on what you specified as that
javascript's module.styleExports. The css attribute names are just the same as
you're used to, but with hyphens translated to camelCase (background-color=>backgroundColor).
Also, each member of the style export is assumed to be a class name, unless it is one of
the common tag names (body/div/span). If you want to style based on a dom id,
include the key in quotes with a pound sign.

All styleExports are automatically packaged into a single `monolithicStyle.css` file which
the default index.html includes. There's nothing more to do beyond including your styleExports
at the bottom of your FaxJs modules.
    
## Backend processing

FaxJs uses `modulr` to package js into a single monolithic js file, and Google Closure advanced
compilation to rename object keys. FaxJs ensures that styleExports are consistent with classNames
defined in styleExports, which should work excellently for classNames specified using the classSet
construct.


```javascript
var myDiv = Div({
  classSet: {
    blueDiv: true,
    largeDiv: true
  }
  content: 'hello!'
});
```



## Events:

There is currently support for the most common application events such as onFocus,
onBlur, onClick, onKeyUp etc. For each of these events, there is are two other
corresponding versions of these handlers suffixed with 'Direct' and 'FirstHandler'.
For example, there is onClick, onClickDirect, and onClickFirstHandler. onClickDirect
will only be fired when that element is the target of the actual event that happened
and not the result of any kind of bubbling. The onClickFirstHandler event is fired
when a click happens on that element or some child of it, yet noone else deeper in
the component tree has handled that event yet. This eliminates the need to ever
'cancel' bubbling. Instead, the parent can just filter out events that have already
been handled at the lower levels.


```javascript
var myDiv = Div({
  onClickDirect: function() {
    alert('You Clicked on the div directly, not the span!');
  },
  onClickFirstHandler: function() {
    alert("You clicked on the div or some child, but in either case I'm the first to handle it!");
  },
  childSpan: Span({
    content: 'spanny',
  })
});
```






