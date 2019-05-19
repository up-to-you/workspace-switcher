const WorkspaceSwitcherPopup = imports.ui.workspaceSwitcherPopup;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const GlobalScreen = global.screen;

const St = imports.gi.St;
const Mainloop = imports.mainloop;

// gsettings set org.gnome.shell.app-switcher current-workspace-only true
// gsettings set org.gnome.shell.keybindings toggle-overview "['<Super>s']"

let dateTimeActor = Main.panel.statusArea.dateMenu.actor;

const KeyManager = new Lang.Class({
    Name: 'MyKeyManager',

    _init: function() {
        this.grabbers = new Map()

        global.display.connect(
            'accelerator-activated',
            Lang.bind(this, function(display, action, deviceId, timestamp){
                // log('Accelerator Activated: [display={}, action={}, deviceId={}, timestamp={}]', display, action, deviceId, timestamp)
                this._onAccelerator(action);
            }))
    },

    listenFor: function(accelerator, callback) {
        let action = global.display.grab_accelerator(accelerator)

        if(action != Meta.KeyBindingAction.NONE) {
            // log('Grabbed accelerator [action={}]', action)
            let name = Meta.external_binding_name_for_action(action);
            // log('Received binding name for action [name={}, action={}]',name, action)

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

const label = new St.Label({ style_class: 'workspace-flag', text: "1" });

var sources_id;

function disableWorskpacePopupWindow() {
    WorkspaceSwitcherPopup.ANIMATION_TIME = 0;
    WorkspaceSwitcherPopup.DISPLAY_TIMEOUT = 0;
    WorkspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype._show = function() { return false };

    let monitor = global.screen.get_monitor_geometry(0);
    let width = Math.floor(monitor.width / 2 - label.get_width() / 2);
    // let height = Math.floor(label.height * 1.877);
    // due to hide top bar extension
    // height = 0;

    label.set_position(width, -1);

    hideLabel();
    global.stage.add_actor(label);
}

function hideLabel() {
    label.hide();
    sources_id = undefined;
    dateTimeActor.show();
}

function showLabel(currentWrkIndex) {
    dateTimeActor.hide();
    label.set_text(''+(currentWrkIndex+1));
    label.show();
    sources_id = Mainloop.timeout_add(700, hideLabel);
}

function clearTimedHide() {
    if(sources_id) {
        Mainloop.source_remove(sources_id);
    }
}

function switchNextWorkspace() {
    clearTimedHide();
    let activeIdx = GlobalScreen.get_active_workspace().index();
    // just flip between 0 & 1
    activeIdx ^= 1;
    GlobalScreen.get_workspace_by_index(activeIdx).activate(global.get_current_time())
    
    showLabel(activeIdx);
}

function moveActiveWindowNextWorkspace() {
    clearTimedHide();
    let activeIdx = GlobalScreen.get_active_workspace().index();
    // just flip between 0 & 1
    activeIdx ^= 1;

    let focusedWin = global.display.get_focus_window();
    
    focusedWin.change_workspace_by_index(activeIdx, false);
    focusedWin.activate(global.get_current_time());

    // GlobalScreen.get_workspace_by_index(activeIdx).activate(global.get_current_time());
    showLabel(activeIdx);
}

function closeAppsCurrentWorkspace() {
    GlobalScreen.get_active_workspace();
    
    // let pid = current_window.get_pid();
    // try {
    //     let argv = ['kill', '' + pid];
    //     GLib.spawn_sync(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null);
    // } catch (e) {
    //     logError(e, 'Failed to kill ' + current_window.title);
    // }

    switchNextWorkspace();
}   

function init() {
    disableWorskpacePopupWindow();
    
    let keyMngr = new KeyManager();
    keyMngr.listenFor("Control_R", switchNextWorkspace);
    keyMngr.listenFor("<ctrl>Control_R", moveActiveWindowNextWorkspace);
    keyMngr.listenFor("<ctrl><alt><shift>Control_R", closeAppsCurrentWorkspace);
}

function enable() {
}

function disable() {
}
