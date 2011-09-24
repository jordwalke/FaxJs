# Sets up npm links to the local folders. Cd into this dir then run this.

# only two dependencies Uncomment if you don't already have these
# Newest versions of node.js aren't supported with connect
# We include a version that works for our purposes and manually inject into
# the node_modules directory.
sudo npm install burrito;

mkdir -p ./node_modules
unzip connect_for_modern_node.zip
mv connect node_modules

cd ./Fax;
sudo npm link;
cd ../FaxUi/;
sudo npm link Fax;
sudo npm link;
cd ../FWidgets;
sudo npm link Fax;
sudo npm link FaxUi;
sudo npm link;
cd ../LayoutElements;
sudo npm link Fax;
sudo npm link FaxUi;
sudo npm link;

cd ../LayoutDesigner;
sudo npm link Fax;
sudo npm link FaxUi;
sudo npm link FWidgets;
sudo npm link;
cd ../ControlPanel;
sudo npm link Fax;
sudo npm link FaxUi;
sudo npm link FWidgets;
sudo npm link LayoutElements;
sudo npm link;
cd ../DemoApp;
sudo npm link Fax;
sudo npm link FaxUi;
sudo npm link FWidgets;
sudo npm link LayoutElements;
sudo npm link LayoutDesigner;
sudo npm link ControlPanel;
sudo npm link;


cd ../FaxProcessor;
sudo npm link Fax;
sudo npm link FaxUi;
sudo npm link;

cd ..;
sudo npm link FaxProcessor;
sudo npm link DemoApp;
