# Tropo Ready customizations for Visual Studio Code

These customizations will help you debug, tests and run your Tropo scripts from VS Code.


## Installation guidelines

To install the Tropo Ready customizations:

1. copy the launch.json, settings.json, tasks.json file to your workspace's ".vscode/" folder 

2. [optional] install the tropoready command on your local machine, if you want to use the Tropo Ready Tasks (ctrl+shift+b shortcut)
   ```shell
   > npm install tropo-emulator-js -g
   # Check it is working ok
   > tropoready -v
   v0.1.0
   ```

3. [optional] customize the settings.json file to suit your local environment and Tropo testing purposes

4. [optional] add the `ctrl+shift+y` shortcut to easilly access the Tropo Ready tasks

   Open your Keyboard shortcut preferences, and add the following: 
   ```json
    [
        {
            "key": "ctrl+shift+y",
            "command": "workbench.action.tasks.runTask",
            "when": "editorTextFocus"
        }
    ]
    ```