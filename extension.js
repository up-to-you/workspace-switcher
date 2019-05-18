const WorkspaceSwitcherPopup = imports.ui.workspaceSwitcherPopup;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const GlobalScreen = global.screen;

// gsettings set org.gnome.shell.app-switcher current-workspace-only true
// gsettings set org.gnome.shell.keybindings toggle-overview "['<Super>s']"

const KeyManager = new Lang.Class({
    Name: 'MyKeyManager',

    _init: function() {
        this.grabbers = new Map()

        global.display.connect(
            'accelerator-activated',
            Lang.bind(this, function(display, action, deviceId, timestamp){
                // log('Accelerator Activated: [display={}, action={}, deviceId={}, timestamp={}]',
                //     display, action, deviceId, timestamp)
                this._onAccelerator(action);
            }))
    },

    listenFor: function(accelerator, callback) {
        let action = global.display.grab_accelerator(accelerator)

        if(action != Meta.KeyBindingAction.NONE) {
            // log('Grabbed accelerator [action={}]', action)
            let name = Meta.external_binding_name_for_action(action);
            // log('Received binding name for action [name={}, action={}]',
            //     name, action)

            // log('Requesting WM to allow binding [name={}]', name)
            Main.wm.allowKeybinding(name, Shell.ActionMode.ALL);

            this.grabbers.set(action, {
                name: name,
                accelerator: accelerator,
                callback: callback,
                action: action
            });
        }
    },

    _onAccelerator: function(action) {
        let grabber = this.grabbers.get(action);
        if(grabber) {
            this.grabbers.get(action).callback();
        }
    }
});

function switchNextWorkspace() {
    let activeIdx = GlobalScreen.get_active_workspace().index();
    // just flip between 0 & 1
    activeIdx ^= 1;
    GlobalScreen.get_workspace_by_index(activeIdx).activate(global.get_current_time())
    // log("Hot keys are working!!!" + Math.random());
}

function moveActiveWindowNextWorkspace() {
    let activeIdx = GlobalScreen.get_active_workspace().index();
    // just flip between 0 & 1
    activeIdx ^= 1;
    // global.screen.get_active_workspace().index()
    // global.screen.get_workspace_by_index(1).activate()
    // global.display.get_focus_window()
    global.display.get_focus_window().change_workspace_by_index(activeIdx, false);
}

function init() {
    disableWorskpacePopupWindow();
    setupGlobalKeyListener("Control_R", switchNextWorkspace);
    setupGlobalKeyListener("<ctrl>Control_R", moveActiveWindowNextWorkspace);
}

function enable() {
}

function disable() {
}

function disableWorskpacePopupWindow() {
    WorkspaceSwitcherPopup.ANIMATION_TIME = 0;
    WorkspaceSwitcherPopup.DISPLAY_TIMEOUT = 0;
    WorkspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype._show = function() { return false };
}

function setupGlobalKeyListener(key, callbackFunc) {
    let keyManager = new KeyManager()
    keyManager.listenFor(key, callbackFunc);
}
