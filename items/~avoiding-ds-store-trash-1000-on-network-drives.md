    social_image: africa.jpg

---

    language: en
    description: Fighting the nuissance of OS-specific metadata files on shared network drives
    published: 2021-10-02


# How to avoid littering your network shares with .DS_Store and .Trash-1000 files

After revamping my homeserver/NAS setup a couple days ago (I know, I still owe this blog a recap) [I was ranting on Twitter](https://twitter.com/slsoftworks/status/1442024283610439682) about how MacOS helpfully spewed `.DS_Store` files into every corner of my SMB (CIFS) network share.

After a bit of investigation, I learned that Apple Support can help you disable this (mis)feature. You will not find it, though:

![Screenshot of the Apple support page shows a search for the "disable ds_store" query, with all results mentioning the App Store and none being relevant to the actual issue](/sources/img/apple-support-ds_store.png "None of these results are even remotely about .DS_Store files")

As it turns out, the support entry is called ["Adjust SMB browsing behavior in macOS"](https://support.apple.com/en-us/HT208209). In fact, Apple frames this as a simple performance-optimization:

> *"To speed up SMB file browsing, you can prevent macOS from reading .DS_Store files on SMB shares. This makes the Finder use only basic information to immediately display each folder's contents in alphanumeric order. Use this Terminal command:"*

Tha magical incantation needs to go into the terminal:

```
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool TRUE
```

Oh and yes, it only works for network drives, not for pendrives and other media.

With that out of the way, the only annoyance that remained are `.Trash-1000` and similar folders. These are used by Gnome on my laptop running Ubuntu for pretty much the same as Windows' "Recycyle Bin", they store "deleted" files until you decide to empty the bin or restore the file.

I felt there ought to be something like a mount option that does this, and since this is a Gnome thing, it's  [gvfs](http://manpages.ubuntu.com/manpages/focal/en/man7/gvfs.7.html), so that's where I started looking.

A cursory search would lead me to the painful classic, a [decade-old unanswered AskUbuntu question](https://askubuntu.com/questions/248944/how-to-disable-trash-for-remote-filesystems-in-nautilus), which matched exactly what I was looking for. Unanswered, no wonders, since it turns out the relevant flag only landed last summer!

> Since GLib 2.66, the `x-gvfs-notrash` unix mount option can be used to disable g_file_trash() support for certain mounts, the %G_IO_ERROR_NOT_SUPPORTED error will be returned in that case.

The above comes straight from the relevant function call, [Gio.File.trash](https://docs.gtk.org/gio/method.File.trash.html)'s documentation. Armed with this info, it wasn't hard to find [the merged issue](https://gitlab.gnome.org/GNOME/gvfs/-/merge_requests/89) and the contributor, [Ondřej Holý's blogpost](https://ondrej.holych.net/whats-new-in-gvfs-for-gnome-40/) on the subject for more details.

So I have an NFS network drive I mount via [`fstab`](http://manpages.ubuntu.com/manpages/focal/en/man5/fstab.5.html) automatically on boot, using `x-gvfs-notrash` in my case looks something like this:

```
192.168.0.1:/nfsshare  /mnt/networkdrive  nfs  auto,rw,x-gvfs-notrash  0  0
```

It is perhaps worth emphasizing, that **this will disable the Trash functionality for these mounted folders**, though, when deleting files the Gnome file manager will display a warning and confirm the operation.

Unfortunately, as you might have probably guessed, the issue with these is that they are all workarounds *on the client*, so the moment someone accesses these (writable) shares through a device that doesn't have these options configured the pesky files are bound to re-appear.
