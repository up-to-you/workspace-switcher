### workspace-switcher

```bash
cd ~/.local/share/gnome-shell/extensions/
git clone https://github.com/up-to-you/workspace-switcher.git
gnome-shell-extension-tool -e workspace-switcher
```

### preference
```bash
gsettings set org.gnome.shell.app-switcher current-workspace-only true
gsettings set org.gnome.shell.keybindings toggle-overview "['<Super>s']"
```
