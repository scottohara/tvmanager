function ProgramController(listItem) {
    if (listItem) {
        this.listItem = listItem;
    } else {
        this.listItem = { program: new Program(null, "", 0, 0, 0, 0, 0) };
    }
}

ProgramController.prototype.setup = function() {
    this.header = {
        label: "Add/Edit Program",
        leftButton: {
            eventHandler: this.cancel.bind(this),
            style: "toolButton",
            label: "Cancel"
        },
        rightButton: {
            eventHandler: this.save.bind(this),
            style: "blueButton",
            label: "Save"
        }
    };

    $("programName").value = this.listItem.program.programName;
}

ProgramController.prototype.save = function() {
    this.listItem.program.programName = $("programName").value;
    this.listItem.program.save();
    appController.popView(this.listItem);
}

ProgramController.prototype.cancel = function() {
    appController.popView();
}