const {dialog} = require("electron").remote;
const fs = require("fs");
const gdriveapi = require("./gdrive");
const appsettings = require("./settings");

/*********************/
/* Private Functions */
/*********************/
//This function reads the file content into the editor
function readFileContentsIntoEditor(filename) {
    fs.readFile(filename, function(err, data) {
        if(err) {
            return console.error("Error while reading file \"" + filename + "\": " + err);
            //TODO instead of this error message, show a pop-up/dialog with error message and with a cancel or ok button on it
            //dialog.showErrorBox("File Save Error", err.message);
        }
        editor.setValue(data.toString());
    });
}

//This function writes the editor content into a file
function writeEditorContentsToFile(filename) {
    fs.writeFile(filename, editor.getValue(), function(err) {
        if(err) {
            return console.error("Error while writing to file \"" + filename + "\": " + err);
        }
    });
}

//This function disables the buttons
function disableAllButtons() {
    $(".new-file").prop("disabled", true);
    $(".open-file").prop("disabled", true);
    $(".save-file").prop("disabled", true);
    $(".dropdown-toggle").prop("disabled", true);
    $(".select-mode").prop("disabled", true);
}

//This function enables the buttons
function enableAllButtons() {
    $(".new-file").prop("disabled", false);
    $(".open-file").prop("disabled", false);
    $(".save-file").prop("disabled", false);
    $(".dropdown-toggle").prop("disabled", false);
    $(".select-mode").prop("disabled", false);
}

/*******************/
/* Public Function */
/*******************/
//This function loads the settings; last save settings
var loadSettings = function loadSettings() {
    $(".select-mode #current-editor-mode").text(appsettings.getSetting("mode"));
    $("#opened-file-name").text(appsettings.getSetting("filename"));
    $("#themelist #" + appsettings.getSetting("theme")).addClass("disabled");

    //Load the last opened file in the editor
    if(appsettings.getSetting("filelocation") !== "") {
        readFileContentsIntoEditor(appsettings.getSetting("filelocation"));
    }
}

//This function updates the word and character counts
var updateWordAndCharacterCount = function updateWordAndCharacterCount(editor) {
    //var charactersCount = 0;
    var wordsCount = 0;

    //Loop over each line in the editor and process the text
    editor.eachLine(function(line) {
        var text = line.text;
        //charactersCount += text.length;
        text = text.trim();
        if(text.length > 0) {
            wordsCount += (text.match(/\s+/g)||[]).length + 1;
        }
    });

    //Update the counts
    //$("#characters-length").text(charactersCount);
    $("#words-length").text(wordsCount);
};

//This function changes the mode: local or gdocs
var changeMode = function changeMode() {
    var currText = $(".select-mode #current-editor-mode").text();
    $(".select-mode #current-editor-mode").text(currText == "local" ? "gdocs" : "local");
    $(this).blur();

    //Update the settings
    appsettings.setSetting("mode", $(".select-mode #current-editor-mode").text());
}

//This function changes the theme of the editor
var changeTheme = function changeTheme(event) {
    //Set the theme option of the editor
    editor.setOption("theme", $(this).text());

    //Find the li element with class = disabled
    var currDisabledLi = event.data.themelist.find(".disabled")
    currDisabledLi.removeClass("disabled");
    $(this).addClass("disabled");

    //Update the settings
    appsettings.setSetting("theme", $(this).text());
}

//Create a new file
var createNewFile = function createNewFile() {
    //TODO add a dialog that pops if there is unsaved content in the editor
    //dialog.showErrorBox("File Save Error", err.message); modify this message here

    //Empty the editor
    editor.setValue("");

    //Clear the filename label
    $("#opened-file-name").text("[ No File ]");

    //Put focus back on the editor
    editor.focus();

    //Update the settings for filename and filelocation
    appsettings.setSetting("filename", "[ No File ]");
    appsettings.setSetting("filelocation", "");
}

//Opens the file
var openFile = function openFile() {
    //Disable all the buttons
    disableAllButtons();

    //Check if the mode is local or gdocs
    if(appsettings.getSetting("mode") === "local") {
        dialog.showOpenDialog({properties: ["openFile"]}, function(filename) {
            if(typeof filename !== "undefined") {
                readFileContentsIntoEditor(filename[0]);

                //Set the filename
                var justFileName = filename[0].split("/");
                $("#opened-file-name").text(justFileName[justFileName.length-1]);

                //Update the settings
                appsettings.setSetting("filename", justFileName[justFileName.length-1]);
                appsettings.setSetting("filelocation", filename[0]);
            }

            //Enable all the buttons
            enableAllButtons();

            //Put focus back on the editor
            editor.focus();
        });
    }
    else {
        gdriveapi.communicateToGoogleDrive();

        //Enable all the buttons
        enableAllButtons();
    }
}

//Saves the file
var saveFile = function saveFile() {
    //Disable all the buttons
    disableAllButtons();

    //Check if the mode is local or gdocs
    if(appsettings.getSetting("mode") === "local") {
        dialog.showSaveDialog(function(filename) {
            if(typeof filename !== "undefined") {
                writeEditorContentsToFile(filename);

                //Set the filename
                var justFileName = filename.split("/");
                $("#opened-file-name").text(justFileName[justFileName.length-1]);

                //Update the settings
                appsettings.setSetting("filename", justFileName[justFileName.length-1]);
                appsettings.setSetting("filelocation", filename);

                //Show message to the user that the file has been saved
                dialog.showMessageBox({ message: "The file has been saved! :)", buttons: ["OK"] });
                //TODO: Add custom icon to this using options: https://github.com/electron/electron/blob/master/docs/api/dialog.md
            }
            //Enable all the buttons
            enableAllButtons();
        });
    }
    else {
        //gdriveapi.communicateToGoogleDrive(); TODO use this not the line below this
        $('#save-file-dialog').modal();

        //Enable all the buttons
        enableAllButtons();
    }
}

//Export the public functions
module.exports = {
    loadSettings,
    changeMode,
    changeTheme,
    updateWordAndCharacterCount,
    createNewFile,
    openFile,
    saveFile
}
